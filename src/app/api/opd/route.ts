import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function GET() {
  const { user, response } = await requireAuth()
  if (!user) return response!

  try {
    const opds = await prisma.opd.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        tiketPrefix: true,
        description: true,
        icon: true,
        color: true,
        sortOrder: true,
      },
    })
    return ok(opds)
  } catch {
    return err("Gagal mengambil data OPD", 500)
  }
}
