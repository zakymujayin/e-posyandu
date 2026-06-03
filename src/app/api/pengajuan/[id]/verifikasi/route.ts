import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { createNotificationsForUsers, notifySelesaiDesa } from "@/lib/notifications"
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
    action: z.literal("APPROVE"),
    catatan: z.string().transform(stripHtml).optional(),
  }),
  z.object({
    action: z.literal("REJECT"),
    catatan: z.string().min(1, "Alasan penolakan wajib diisi").transform(stripHtml),
  }),
  z.object({
    action: z.literal("SELESAI_DESA"),
    catatan: z.string().transform(stripHtml).optional(),
    attachments: z
      .array(attachmentSchema)
      .min(1, "Wajib upload minimal 1 file bukti")
      .refine((arr) => arr.some((a) => a.attachmentType === "FILE"), "Wajib upload minimal 1 file bukti"),
  }),
  z.object({
    action: z.literal("ESKALASI_OPD"),
    opdId: z.string().min(1, "OPD tujuan wajib dipilih"),
    catatan: z.string().transform(stripHtml).optional(),
  }),
  z.object({
    action: z.literal("ESKALASI_KECAMATAN"),
    catatan: z.string().transform(stripHtml).optional(),
  }),
])

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(["PETUGAS_DESA"])
  if (!user) return response!

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const { action } = parsed.data

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id },
    include: {
      posyanduUser: { select: { id: true, email: true, name: true } },
      desa: { select: { kecamatanId: true, name: true } },
    },
  })

  if (!pengajuan) return err("Pengajuan tidak ditemukan", 404)
  if (pengajuan.status !== "MENUNGGU_VERIFIKASI") {
    return err("Pengajuan tidak dalam status menunggu verifikasi")
  }

  const petugasDesa = await prisma.user.findUnique({ where: { id: user.id } })
  if (petugasDesa?.desaId !== pengajuan.desaId) return err("Akses ditolak", 403)

  if (action === "APPROVE") {
    await prisma.$transaction(async (tx) => {
      await tx.pengajuan.update({
        where: { id },
        data: { status: "DALAM_PROSES_OPD" },
      })
      await tx.verifikasiDesa.create({
        data: {
          pengajuanId: id,
          petugasDesaId: user.id,
          status: "APPROVE",
          penyelesaian: "LANJUT_OPD",
          catatan: parsed.data.catatan,
        },
      })
      await tx.activityLog.create({
        data: {
          pengajuanId: id,
          userId: user.id,
          userRole: "PETUGAS_DESA",
          action: "Pengajuan diverifikasi",
          oldStatus: "MENUNGGU_VERIFIKASI",
          newStatus: "DALAM_PROSES_OPD",
          catatan: parsed.data.catatan,
        },
      })
    })

    const opdUsers = await prisma.user.findMany({
      where: { role: "PETUGAS_OPD", opdId: pengajuan.opdId, isActive: true },
      select: { id: true },
    })
    await createNotificationsForUsers(
      opdUsers.map((u) => u.id),
      {
        type: "OPD_RECEIVED",
        title: "Pengajuan Baru Masuk",
        message: `Pengajuan ${pengajuan.tiketNumber} telah diverifikasi dan menunggu tindak lanjut.`,
        pengajuanId: id,
      }
    )

    await createNotificationsForUsers(
      [pengajuan.posyanduUserId],
      {
        type: "VERIFIED",
        title: "Pengajuan Diverifikasi",
        message: `Pengajuan ${pengajuan.tiketNumber} telah diverifikasi oleh Petugas Desa dan diteruskan ke OPD.`,
        pengajuanId: id,
      }
    )

    sendStatusChangeEmail(
      pengajuan.posyanduUser.email,
      pengajuan.posyanduUser.name,
      pengajuan.tiketNumber,
      "Dalam Proses OPD",
      id,
      "POSYANDU"
    ).catch((e) => console.error("[email] Failed to send status change:", e))

    return ok({ status: "DALAM_PROSES_OPD" }, "Pengajuan diverifikasi")
  }

  if (action === "REJECT") {
    await prisma.$transaction(async (tx) => {
      await tx.pengajuan.update({
        where: { id },
        data: { status: "DITOLAK_DESA" },
      })
      await tx.verifikasiDesa.create({
        data: {
          pengajuanId: id,
          petugasDesaId: user.id,
          status: "REJECT",
          penyelesaian: "TOLAK",
          catatan: parsed.data.catatan,
        },
      })
      await tx.activityLog.create({
        data: {
          pengajuanId: id,
          userId: user.id,
          userRole: "PETUGAS_DESA",
          action: "Pengajuan ditolak oleh Desa",
          oldStatus: "MENUNGGU_VERIFIKASI",
          newStatus: "DITOLAK_DESA",
          catatan: parsed.data.catatan,
        },
      })
    })

    await createNotificationsForUsers([pengajuan.posyanduUserId], {
      type: "REJECTED_DESA",
      title: "Pengajuan Ditolak",
      message: `Pengajuan ${pengajuan.tiketNumber} ditolak oleh Petugas Desa. Alasan: ${parsed.data.catatan}`,
      pengajuanId: id,
    })

    sendStatusChangeEmail(
      pengajuan.posyanduUser.email,
      pengajuan.posyanduUser.name,
      pengajuan.tiketNumber,
      "Ditolak Desa",
      id,
      "POSYANDU"
    ).catch((e) => console.error("[email] Failed to send status change:", e))

    return ok({ status: "DITOLAK_DESA" }, "Pengajuan ditolak")
  }

  if (action === "SELESAI_DESA") {
    const { attachments, catatan } = parsed.data

    await prisma.$transaction(async (tx) => {
      await tx.pengajuan.update({
        where: { id },
        data: {
          status: "SELESAI",
          selesaiOleh: "DESA",
          completedAt: new Date(),
        },
      })
      await tx.verifikasiDesa.create({
        data: {
          pengajuanId: id,
          petugasDesaId: user.id,
          status: "SELESAI_DESA",
          penyelesaian: "SELESAI_DESA",
          catatan,
        },
      })
      await tx.pengajuanAttachment.createMany({
        data: attachments.map((att) => ({
          pengajuanId: id,
          uploadedById: user.id,
          attachmentContext: "VERIFIKASI_DESA",
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
          userRole: "PETUGAS_DESA",
          action: "Pengajuan diselesaikan di tingkat desa",
          oldStatus: "MENUNGGU_VERIFIKASI",
          newStatus: "SELESAI",
          catatan,
        },
      })
    })

    await notifySelesaiDesa(pengajuan.posyanduUserId, id, pengajuan.tiketNumber)

    sendStatusChangeEmail(
      pengajuan.posyanduUser.email,
      pengajuan.posyanduUser.name,
      pengajuan.tiketNumber,
      "Selesai (Diselesaikan Desa)",
      id,
      "POSYANDU"
    ).catch((e) => console.error("[email] Failed to send status change:", e))

    return ok({ status: "SELESAI" }, "Pengajuan berhasil diselesaikan di tingkat desa")
  }

  if (action === "ESKALASI_OPD") {
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
      await tx.verifikasiDesa.create({
        data: {
          pengajuanId: id,
          petugasDesaId: user.id,
          status: "ESKALASI_OPD",
          penyelesaian: "ESKALASI_OPD",
          opdEskalasiId: opdId,
          catatan,
        },
      })
      await tx.activityLog.create({
        data: {
          pengajuanId: id,
          userId: user.id,
          userRole: "PETUGAS_DESA",
          action: `Pengajuan dieskalasikan ke OPD: ${opd.name}`,
          oldStatus: "MENUNGGU_VERIFIKASI",
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
        title: "Pengajuan Baru Masuk (Eskalasi Desa)",
        message: `Pengajuan ${pengajuan.tiketNumber} dieskalasikan dari desa dan menunggu tindak lanjut.`,
        pengajuanId: id,
      }
    )

    await createNotificationsForUsers([pengajuan.posyanduUserId], {
      type: "ESKALASI_OPD",
      title: "Pengajuan Dieskalasikan ke OPD",
      message: `Pengajuan ${pengajuan.tiketNumber} telah dieskalasikan ke ${opd.name} untuk ditindaklanjuti.`,
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

    return ok({ status: "DALAM_PROSES_OPD" }, "Pengajuan berhasil dieskalasikan ke OPD")
  }

  if (action === "ESKALASI_KECAMATAN") {
    const kecamatanId = pengajuan.desa?.kecamatanId
    if (!kecamatanId) return err("Desa tidak memiliki kecamatan", 400)

    await prisma.$transaction(async (tx) => {
      await tx.pengajuan.update({
        where: { id },
        data: { status: "DALAM_PROSES_KECAMATAN" },
      })
      await tx.verifikasiDesa.create({
        data: {
          pengajuanId: id,
          petugasDesaId: user.id,
          status: "ESKALASI_KECAMATAN",
          penyelesaian: "ESKALASI_KECAMATAN",
          catatan: parsed.data.catatan,
        },
      })
      await tx.activityLog.create({
        data: {
          pengajuanId: id,
          userId: user.id,
          userRole: "PETUGAS_DESA",
          action: "Pengajuan dieskalasikan ke Kecamatan",
          oldStatus: "MENUNGGU_VERIFIKASI",
          newStatus: "DALAM_PROSES_KECAMATAN",
          catatan: parsed.data.catatan,
        },
      })
    })

    const kecUsers = await prisma.user.findMany({
      where: { role: "PETUGAS_KECAMATAN", kecamatanId, isActive: true },
      select: { id: true },
    })
    await createNotificationsForUsers(
      kecUsers.map((u) => u.id),
      {
        type: "ESKALASI_KECAMATAN",
        title: "Pengajuan Baru Masuk (Eskalasi Desa)",
        message: `Pengajuan ${pengajuan.tiketNumber} dari Desa ${pengajuan.desa.name} dieskalasikan dan menunggu tindak lanjut.`,
        pengajuanId: id,
      }
    )

    await createNotificationsForUsers([pengajuan.posyanduUserId], {
      type: "ESKALASI_KECAMATAN",
      title: "Pengajuan Dieskalasikan ke Kecamatan",
      message: `Pengajuan ${pengajuan.tiketNumber} telah dieskalasikan ke tingkat Kecamatan untuk ditindaklanjuti.`,
      pengajuanId: id,
    })

    sendStatusChangeEmail(
      pengajuan.posyanduUser.email,
      pengajuan.posyanduUser.name,
      pengajuan.tiketNumber,
      "Dalam Proses Kecamatan",
      id,
      "POSYANDU"
    ).catch((e) => console.error("[email] Failed to send status change:", e))

    return ok({ status: "DALAM_PROSES_KECAMATAN" }, "Pengajuan berhasil dieskalasikan ke Kecamatan")
  }

  return err("Action tidak valid")
}
