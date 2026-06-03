import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { createNotificationsForUsers } from "@/lib/notifications"
import { sendStatusChangeEmail } from "@/lib/email"
import { stripHtml } from "@/lib/sanitize"

const attachmentSchema = z.object({
  attachmentType: z.enum(["FILE", "VIDEO_LINK"]),
  filePath: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  videoUrl: z.string().optional(),
  videoPlatform: z.string().optional(),
})

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("SELESAI_KECAMATAN"),
    catatan: z.string().transform(stripHtml).optional(),
    attachments: z
      .array(attachmentSchema)
      .min(1, "Wajib upload minimal 1 file bukti")
      .refine((arr) => arr.some((a) => a.attachmentType === "FILE"), "Wajib upload minimal 1 file bukti"),
  }),
  z.object({
    action: z.literal("ESKALASI_OPD_DARI_KECAMATAN"),
    opdId: z.string().min(1, "OPD tujuan wajib dipilih"),
    catatan: z.string().transform(stripHtml).optional(),
  }),
])

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(["PETUGAS_KECAMATAN"])
  if (!user) return response!

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const { action } = parsed.data

  const petugasKec = await prisma.user.findUnique({
    where: { id: user.id },
    select: { kecamatanId: true },
  })
  if (!petugasKec?.kecamatanId) return err("User tidak terdaftar di kecamatan", 400)
  const kecamatanId = petugasKec.kecamatanId

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id },
    include: {
      desa: { select: { kecamatanId: true } },
      posyanduUser: { select: { id: true, email: true, name: true } },
    },
  })

  if (!pengajuan) return err("Pengajuan tidak ditemukan", 404)
  if (pengajuan.status !== "DALAM_PROSES_KECAMATAN") {
    return err("Pengajuan tidak dalam status proses kecamatan")
  }
  if (pengajuan.desa.kecamatanId !== petugasKec.kecamatanId) {
    return err("Akses ditolak", 403)
  }

  if (action === "SELESAI_KECAMATAN") {
    const { attachments, catatan } = parsed.data

    await prisma.$transaction(async (tx) => {
      await tx.pengajuan.update({
        where: { id },
        data: {
          status: "SELESAI",
          selesaiOleh: "KECAMATAN",
          completedAt: new Date(),
        },
      })
      await tx.verifikasiKecamatan.create({
        data: {
          pengajuanId: id,
          kecamatanId,
          petugasKecId: user.id,
          status: "SELESAI_KECAMATAN",
          penyelesaian: "SELESAI_KECAMATAN",
          catatan: catatan ?? null,
        },
      })
      await tx.pengajuanAttachment.createMany({
        data: attachments.map((att) => ({
          pengajuanId: id,
          uploadedById: user.id,
          attachmentContext: "VERIFIKASI_KECAMATAN",
          attachmentType: att.attachmentType,
          filePath: att.filePath ?? null,
          fileName: att.fileName ?? null,
          fileSize: att.fileSize ?? null,
          mimeType: att.mimeType ?? null,
          videoUrl: att.videoUrl ?? null,
          videoPlatform: att.videoPlatform ?? null,
        })),
      })
      await tx.activityLog.create({
        data: {
          pengajuanId: id,
          userId: user.id,
          userRole: "PETUGAS_KECAMATAN",
          action: "Pengajuan diselesaikan di tingkat kecamatan",
          oldStatus: "DALAM_PROSES_KECAMATAN",
          newStatus: "SELESAI",
          catatan,
        },
      })
    })

    await createNotificationsForUsers([pengajuan.posyanduUserId], {
      type: "SELESAI_KECAMATAN",
      title: "Pengajuan Diselesaikan oleh Kecamatan",
      message: `Pengajuan ${pengajuan.tiketNumber} telah diselesaikan di tingkat Kecamatan.`,
      pengajuanId: id,
    })

    sendStatusChangeEmail(
      pengajuan.posyanduUser.email,
      pengajuan.posyanduUser.name,
      pengajuan.tiketNumber,
      "Selesai (Diselesaikan Kecamatan)",
      id,
      "POSYANDU"
    ).catch((e) => console.error("[email] Failed to send status change:", e))

    return ok({ status: "SELESAI" }, "Pengajuan berhasil diselesaikan di tingkat kecamatan")
  }

  if (action === "ESKALASI_OPD_DARI_KECAMATAN") {
    const { opdId, catatan } = parsed.data

    const opd = await prisma.opd.findUnique({ where: { id: opdId } })
    if (!opd) return err("OPD tidak ditemukan", 404)

    await prisma.$transaction(async (tx) => {
      await tx.pengajuan.update({
        where: { id },
        data: {
          status: "DALAM_PROSES_OPD",
          opdId,
        },
      })
      await tx.verifikasiKecamatan.create({
        data: {
          pengajuanId: id,
          kecamatanId,
          petugasKecId: user.id,
          status: "ESKALASI_OPD",
          penyelesaian: "ESKALASI_OPD",
          opdEskalasiId: opdId,
          catatan: catatan ?? null,
        },
      })
      await tx.activityLog.create({
        data: {
          pengajuanId: id,
          userId: user.id,
          userRole: "PETUGAS_KECAMATAN",
          action: `Pengajuan dieskalasikan ke OPD: ${opd.name} (dari kecamatan)`,
          oldStatus: "DALAM_PROSES_KECAMATAN",
          newStatus: "DALAM_PROSES_OPD",
          catatan,
        },
      })
    })

    const opdUsers = await prisma.user.findMany({
      where: { role: "PETUGAS_OPD", opdId, isActive: true },
      select: { id: true },
    })
    await createNotificationsForUsers(
      opdUsers.map((u) => u.id),
      {
        type: "OPD_RECEIVED",
        title: "Pengajuan Baru Masuk (Eskalasi Kecamatan)",
        message: `Pengajuan ${pengajuan.tiketNumber} dieskalasikan dari kecamatan dan menunggu tindak lanjut.`,
        pengajuanId: id,
      }
    )

    await createNotificationsForUsers([pengajuan.posyanduUserId], {
      type: "ESKALASI_OPD",
      title: "Pengajuan Dieskalasikan ke OPD oleh Kecamatan",
      message: `Pengajuan ${pengajuan.tiketNumber} telah dieskalasikan ke ${opd.name} oleh Kecamatan.`,
      pengajuanId: id,
    })

    sendStatusChangeEmail(
      pengajuan.posyanduUser.email,
      pengajuan.posyanduUser.name,
      pengajuan.tiketNumber,
      "Dalam Proses OPD",
      id,
      "POSYANDU"
    ).catch((e) => console.error("[email] Failed to send status change:", e))

    return ok({ status: "DALAM_PROSES_OPD" }, "Pengajuan berhasil dieskalasikan ke OPD dari kecamatan")
  }

  return err("Action tidak valid")
}
