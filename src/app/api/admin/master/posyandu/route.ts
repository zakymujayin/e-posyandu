import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidatePattern } from "@/lib/cache"

export async function GET(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { searchParams } = new URL(req.url)
  const desaId = searchParams.get("desaId")
  const search = searchParams.get("search")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10")))

  const where: Record<string, unknown> = {}
  if (desaId) where.desaId = desaId
  if (search) where.name = { contains: search }

  const include = { desa: { select: { name: true, kecamatan: { select: { name: true } } } } }

  const [posyandus, total] = await Promise.all([
    prisma.posyandu.findMany({
      where,
      orderBy: [{ desaId: "asc" }, { name: "asc" }],
      include,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.posyandu.count({ where }),
  ])

  return ok({ data: posyandus, total, page, totalPages: Math.ceil(total / limit) || 1 })
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  try {
    const body = await req.json()
    const { desaId, name, code } = body

    if (!desaId || !name || !code) return err("desaId, name, dan code wajib diisi", 400)

    const desa = await prisma.desa.findUnique({ where: { id: desaId } })
    if (!desa) return err("Desa tidak ditemukan", 404)

    const exists = await prisma.posyandu.findUnique({ where: { code } })
    if (exists) return err("Kode posyandu sudah digunakan", 409)

    const posyandu = await prisma.posyandu.create({
      data: { desaId, name, code, isActive: true },
      include: { desa: { select: { name: true, kecamatan: { select: { name: true } } } } },
    })

    invalidatePattern("master:posyandu*")

    return ok(posyandu)
  } catch {
    return err("Gagal membuat posyandu", 500)
  }
}
