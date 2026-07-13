import { prisma } from "@/lib/prisma"
import { requireAuth, ok } from "@/lib/api-helpers"

export async function GET(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { searchParams } = new URL(req.url)
  const desaId = searchParams.get("desaId")
  const search = searchParams.get("search")

  const where: Record<string, unknown> = {}
  if (desaId) where.desaId = desaId
  if (search) where.name = { contains: search, mode: "insensitive" }

  const posyandus = await prisma.posyandu.findMany({
    where,
    orderBy: [{ desaId: "asc" }, { name: "asc" }, { id: "asc" }],
    include: { desa: { select: { name: true, kecamatan: { select: { name: true } } } } },
  })

  return ok(posyandus)
}
