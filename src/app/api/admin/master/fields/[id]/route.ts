import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

const schema = z.object({
  fieldLabel: z.string().min(1).optional(),
  fieldOptions: z.string().optional().nullable(),
  isRequired: z.boolean().optional(),
  placeholder: z.string().optional().nullable(),
  helperText: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const existing = await prisma.formField.findUnique({ where: { id } })
  if (!existing) return err("Field tidak ditemukan", 404)

  const updated = await prisma.formField.update({ where: { id }, data: parsed.data })
  return ok(updated, "Field diperbarui")
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params
  const usedCount = await prisma.pengajuanFieldValue.count({ where: { formFieldId: id } })
  if (usedCount > 0) return err("Field tidak bisa dihapus karena sudah memiliki data pengajuan")

  await prisma.formField.delete({ where: { id } })
  return ok(null, "Field dihapus")
}
