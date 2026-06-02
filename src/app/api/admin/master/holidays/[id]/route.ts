import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidatePattern } from "@/lib/cache"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params

  try {
    await prisma.publicHoliday.delete({ where: { id } })
    invalidatePattern("master:holidays")
    return ok(null)
  } catch {
    return err("Gagal menghapus hari libur", 500)
  }
}
