import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

const schema = z.object({
  kecamatanId: z.string().min(1, "Kecamatan wajib dipilih"),
  name: z.string().min(1, "Nama desa wajib diisi"),
  code: z.string().min(1, "Kode desa wajib diisi"),
})

export async function GET() {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const desas = await prisma.desa.findMany({
    orderBy: [{ kecamatanId: "asc" }, { name: "asc" }],
    include: { kecamatan: { select: { name: true } } },
  })
  return ok(desas)
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const existing = await prisma.desa.findUnique({ where: { code: parsed.data.code } })
  if (existing) return err("Kode desa sudah digunakan")

  const desa = await prisma.desa.create({ data: parsed.data })
  return ok(desa, "Desa berhasil ditambahkan")
}
