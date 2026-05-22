import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

const schema = z.object({
  name: z.string().min(1, "Nama kecamatan wajib diisi"),
  code: z.string().min(1, "Kode wajib diisi"),
})

export async function GET() {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const kecamatans = await prisma.kecamatan.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { desas: true } } },
  })
  return ok(kecamatans)
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const existing = await prisma.kecamatan.findUnique({ where: { code: parsed.data.code } })
  if (existing) return err("Kode kecamatan sudah digunakan")

  const kecamatan = await prisma.kecamatan.create({ data: parsed.data })
  return ok(kecamatan, "Kecamatan berhasil ditambahkan")
}
