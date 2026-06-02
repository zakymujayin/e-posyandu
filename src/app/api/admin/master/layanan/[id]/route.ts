import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidatePattern } from "@/lib/cache"

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isDesa: z.boolean().optional(),
  opdId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const existing = await prisma.layananJenis.findUnique({ where: { id } })
  if (!existing) return err("Layanan tidak ditemukan", 404)

  const updated = await prisma.layananJenis.update({ where: { id }, data: parsed.data })
    invalidatePattern("master:layanan*")
    return ok(updated, "Layanan diperbarui")
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params
  const pengajuanCount = await prisma.pengajuan.count({ where: { layananJenisId: id } })
  if (pengajuanCount > 0) return err("Layanan tidak bisa dihapus karena memiliki data pengajuan")

  await prisma.layananJenis.delete({ where: { id } })
    invalidatePattern("master:layanan*")
    return ok(null, "Layanan dihapus")
}
