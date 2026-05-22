import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function GET() {
  const { user, response } = await requireAuth()
  if (!user) return response!

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        pengajuanId: true,
      },
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    })

    return ok({ notifications, unreadCount })
  } catch (e) {
    console.error(e)
    return err("Gagal mengambil notifikasi", 500)
  }
}

export async function PATCH() {
  const { user, response } = await requireAuth()
  if (!user) return response!

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    return ok(null, "Semua notifikasi ditandai sudah dibaca")
  } catch (e) {
    console.error(e)
    return err("Gagal memperbarui notifikasi", 500)
  }
}
