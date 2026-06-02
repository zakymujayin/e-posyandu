import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { withCache, invalidatePattern } from "@/lib/cache"

const schema = z.object({
  opdId: z.string().optional(),
  name: z.string().min(1, "Nama layanan wajib diisi"),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  isDesa: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
}).refine(
  (data) => data.isDesa || !!data.opdId,
  { message: "OPD wajib dipilih untuk layanan non-desa", path: ["opdId"] }
)

export async function GET(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { searchParams } = new URL(req.url)
  const opdId = searchParams.get("opdId")

  const layanans = await withCache(
    opdId ? `master:layanan:${opdId}` : "master:layanan",
    600,
    () =>
      prisma.layananJenis.findMany({
        where: opdId ? { opdId } : undefined,
        orderBy: [{ opdId: "asc" }, { sortOrder: "asc" }],
        include: { opd: { select: { name: true } } },
      })
  )
  return ok(layanans)
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  if (parsed.data.opdId) {
    const opd = await prisma.opd.findUnique({ where: { id: parsed.data.opdId } })
    if (!opd) return err("OPD tidak ditemukan")
  }

  const { opdId, ...rest } = parsed.data
  const layanan = await prisma.layananJenis.create({
    data: { ...rest, opdId: opdId ?? null },
  })
  invalidatePattern("master:layanan*")
  return ok(layanan, "Layanan berhasil ditambahkan")
}
