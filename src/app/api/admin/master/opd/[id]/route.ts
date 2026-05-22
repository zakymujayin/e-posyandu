import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const opd = await prisma.opd.findUnique({ where: { id } })
  if (!opd) return err("OPD tidak ditemukan", 404)

  const updated = await prisma.opd.update({ where: { id }, data: parsed.data })
  return ok(updated, "OPD berhasil diperbarui")
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params
  const pengajuanCount = await prisma.pengajuan.count({ where: { opdId: id } })
  if (pengajuanCount > 0) return err("OPD tidak bisa dihapus karena memiliki data pengajuan")

  await prisma.opd.delete({ where: { id } })
  return ok(null, "OPD berhasil dihapus")
}
