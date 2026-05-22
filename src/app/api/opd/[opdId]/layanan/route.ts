import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ opdId: string }> }
) {
  const { user, response } = await requireAuth()
  if (!user) return response!

  const { opdId } = await params

  try {
    const layanan = await prisma.layananJenis.findMany({
      where: { opdId, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, description: true },
    })
    return ok(layanan)
  } catch {
    return err("Gagal mengambil data layanan", 500)
  }
}
