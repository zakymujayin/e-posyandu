import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { createNotificationsForUsers } from "@/lib/notifications"
import { sendStatusChangeEmail } from "@/lib/email"

const schema = z.object({
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  attachments: z.array(z.object({
    attachmentType: z.enum(["FILE", "VIDEO_LINK"]),
    filePath: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
    videoUrl: z.string().optional(),
    videoPlatform: z.string().optional(),
  })).refine((arr) => arr.some((a) => a.attachmentType === "FILE"), "Wajib upload minimal 1 file bukti"),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(["PETUGAS_OPD"])
  if (!user) return response!

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id },
    include: { posyanduUser: { select: { id: true, email: true, name: true } } },
  })

  if (!pengajuan) return err("Pengajuan tidak ditemukan", 404)
  if (pengajuan.status !== "DALAM_PROSES_OPD") {
    return err("Pengajuan tidak dalam status proses OPD")
  }

  if (user.opdId !== pengajuan.opdId) return err("Akses ditolak", 403)

  const { deskripsi, attachments } = parsed.data

  const tindakLanjut = await prisma.$transaction(async (tx) => {
    const tl = await tx.tindakLanjut.create({
      data: {
        pengajuanId: id,
        petugasOpdId: user.id,
        deskripsi,
        attachments: {
          create: attachments.map((att) => ({
            pengajuanId: id,
            uploadedById: user.id,
            attachmentContext: "TINDAK_LANJUT",
            attachmentType: att.attachmentType,
            filePath: att.filePath,
            fileName: att.fileName,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            videoUrl: att.videoUrl,
            videoPlatform: att.videoPlatform,
          })),
        },
      },
    })

    await tx.pengajuan.update({
      where: { id },
      data: { status: "MENUNGGU_APPROVAL_DPMD" },
    })

    await tx.activityLog.create({
      data: {
        pengajuanId: id,
        userId: user.id,
        userRole: "PETUGAS_OPD",
        action: "Tindak lanjut disubmit",
        oldStatus: "DALAM_PROSES_OPD",
        newStatus: "MENUNGGU_APPROVAL_DPMD",
      },
    })

    return tl
  })

  // Notif ke admin DPMD
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN_DPMD", isActive: true },
    select: { id: true },
  })
  await createNotificationsForUsers(admins.map((a) => a.id), {
    type: "FOLLOWUP_SUBMITTED",
    title: "Tindak Lanjut Disubmit",
    message: `Tindak lanjut untuk pengajuan ${pengajuan.tiketNumber} menunggu persetujuan Anda.`,
    pengajuanId: id,
  })

  // Notif ke akun posyandu
  await createNotificationsForUsers([pengajuan.posyanduUserId], {
    type: "FOLLOWUP_SUBMITTED",
    title: "Tindak Lanjut Disubmit",
    message: `Tindak lanjut untuk pengajuan ${pengajuan.tiketNumber} telah disubmit dan menunggu persetujuan Admin DPMD.`,
    pengajuanId: id,
  })

  // Email to posyandu: status now MENUNGGU_APPROVAL_DPMD (fire-and-forget)
  sendStatusChangeEmail(
    pengajuan.posyanduUser.email,
    pengajuan.posyanduUser.name,
    pengajuan.tiketNumber,
    "Menunggu Approval DPMD",
    id,
    "POSYANDU"
  ).catch((e) => console.error("[email] Failed to send status change:", e))

  return ok({ id: tindakLanjut.id }, "Tindak lanjut berhasil dikirim")
}
