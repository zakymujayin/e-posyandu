import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { createNotificationsForUsers } from "@/lib/notifications"
import { stripHtml } from "@/lib/sanitize"

const schema = z.object({ catatan: z.string().min(1, "Catatan bypass wajib diisi").transform(stripHtml) })

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id },
    include: { posyanduUser: { select: { id: true } } },
  })

  if (!pengajuan) return err("Pengajuan tidak ditemukan", 404)

  const allowedStatuses = ["MENUNGGU_VERIFIKASI", "DALAM_PROSES_OPD"]
  if (!allowedStatuses.includes(pengajuan.status)) {
    return err("Status pengajuan tidak dapat di-bypass")
  }

  const newStatus = pengajuan.status === "MENUNGGU_VERIFIKASI" ? "DALAM_PROSES_OPD" : "SELESAI"

  await prisma.$transaction(async (tx) => {
    await tx.pengajuan.update({
      where: { id },
      data: {
        status: newStatus,
        ...(newStatus === "SELESAI" ? { completedAt: new Date() } : {}),
      },
    })

    await tx.adminAction.create({
      data: {
        pengajuanId: id,
        adminId: user.id,
        actionType: "BYPASS_MANUAL",
        catatan: parsed.data.catatan,
      },
    })

    await tx.activityLog.create({
      data: {
        pengajuanId: id,
        userId: user.id,
        userRole: "ADMIN_DPMD",
        action: "Bypass manual oleh Admin DPMD",
        oldStatus: pengajuan.status,
        newStatus,
        catatan: parsed.data.catatan,
      },
    })
  })

  // Notif ke akun posyandu + petugas terkait
  const notifyIds = [pengajuan.posyanduUserId]
  await createNotificationsForUsers(notifyIds, {
    type: "BYPASS_MANUAL",
    title: "Bypass oleh Admin DPMD",
    message: `Pengajuan ${pengajuan.tiketNumber} di-bypass ke status ${newStatus}.`,
    pengajuanId: id,
  })

  // Kalau bypass ke DALAM_PROSES_OPD, notif OPD juga
  if (newStatus === "DALAM_PROSES_OPD" && pengajuan.opdId) {
    const opdUsers = await prisma.user.findMany({
      where: { role: "PETUGAS_OPD", opdId: pengajuan.opdId, isActive: true },
      select: { id: true },
    })
    await createNotificationsForUsers(
      opdUsers.map((u) => u.id),
      {
        type: "OPD_RECEIVED",
        title: "Pengajuan Baru Masuk",
        message: `Pengajuan ${pengajuan.tiketNumber} telah masuk ke OPD (bypass oleh Admin DPMD).`,
        pengajuanId: id,
      }
    )
  }

  return ok({ status: newStatus }, "Bypass berhasil dilakukan")
}
