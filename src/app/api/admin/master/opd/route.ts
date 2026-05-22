import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

const schema = z.object({
  name: z.string().min(1, "Nama OPD wajib diisi"),
  code: z.string().min(1, "Kode OPD wajib diisi"),
  tiketPrefix: z.string().min(1, "Prefix tiket wajib diisi").max(5),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
})

export async function GET() {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const opds = await prisma.opd.findMany({ orderBy: { sortOrder: "asc" } })
  return ok(opds)
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const { name, code, tiketPrefix, description, isActive, sortOrder } = parsed.data

  const existing = await prisma.opd.findFirst({ where: { OR: [{ code }, { tiketPrefix }] } })
  if (existing) return err("Kode atau prefix tiket sudah digunakan")

  const opd = await prisma.opd.create({ data: { name, code, tiketPrefix, description, isActive, sortOrder } })
  return ok(opd, "OPD berhasil ditambahkan")
}
