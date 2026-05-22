import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { createNotificationsForUsers } from "@/lib/notifications"
import { sendStatusChangeEmail } from "@/lib/email"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id },
    include: {
      kader: { select: { id: true, email: true, name: true } },
      tindakLanjuts: { orderBy: { submittedAt: "desc" }, take: 1, select: { id: true, petugasOpdId: true } },
    },
  })

  if (!pengajuan) return err("Pengajuan tidak ditemukan", 404)
  if (pengajuan.status !== "MENUNGGU_APPROVAL_DPMD") {
    return err("Pengajuan tidak dalam status menunggu approval")
  }

  await prisma.$transaction(async (tx) => {
    await tx.pengajuan.update({
      where: { id },
      data: { status: "SELESAI", completedAt: new Date() },
    })

    if (pengajuan.tindakLanjuts[0]) {
      await tx.tindakLanjut.update({
        where: { id: pengajuan.tindakLanjuts[0].id },
        data: { status: "APPROVED" },
      })
    }

    await tx.adminAction.create({
      data: {
        pengajuanId: id,
        adminId: user.id,
        actionType: "APPROVE",
        catatan: "Tindak lanjut disetujui",
      },
    })

    await tx.activityLog.create({
      data: {
        pengajuanId: id,
        userId: user.id,
        userRole: "ADMIN_DPMD",
        action: "Pengajuan diselesaikan oleh Admin DPMD",
        oldStatus: "MENUNGGU_APPROVAL_DPMD",
        newStatus: "SELESAI",
      },
    })
  })

  const notifyIds = [pengajuan.kaderId]
  if (pengajuan.tindakLanjuts[0]?.petugasOpdId) {
    notifyIds.push(pengajuan.tindakLanjuts[0].petugasOpdId)
  }
  await createNotificationsForUsers(notifyIds, {
    type: "FOLLOWUP_APPROVED",
    title: "Pengajuan Selesai",
    message: `Pengajuan ${pengajuan.tiketNumber} telah diselesaikan oleh Admin DPMD.`,
    pengajuanId: id,
  })

  sendStatusChangeEmail(
    pengajuan.kader.email,
    pengajuan.kader.name,
    pengajuan.tiketNumber,
    "Selesai",
    id,
    "KADER"
  ).catch(() => {})

  return ok({ status: "SELESAI" }, "Pengajuan berhasil diselesaikan")
}
