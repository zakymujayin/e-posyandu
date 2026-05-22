import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth()
  if (!user) return response!

  const { id } = await params

  try {
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true, readAt: new Date() },
    })
    return ok(null)
  } catch (e) {
    console.error(e)
    return err("Gagal memperbarui notifikasi", 500)
  }
}
