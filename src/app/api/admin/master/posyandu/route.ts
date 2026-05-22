import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function GET(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { searchParams } = new URL(req.url)
  const desaId = searchParams.get("desaId")

  const posyandus = await prisma.posyandu.findMany({
    where: desaId ? { desaId } : undefined,
    orderBy: [{ desaId: "asc" }, { name: "asc" }],
    include: { desa: { select: { name: true, kecamatan: { select: { name: true } } } } },
  })

  return ok(posyandus)
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

    return ok(posyandu)
  } catch {
    return err("Gagal membuat posyandu", 500)
  }
}
