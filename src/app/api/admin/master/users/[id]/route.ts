import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

const schema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["POSYANDU", "PETUGAS_DESA", "PETUGAS_KECAMATAN", "PETUGAS_OPD", "ADMIN_DPMD"]).optional(),
  desaId: z.string().optional().nullable(),
  kecamatanId: z.string().optional().nullable(),
  opdId: z.string().optional().nullable(),
  posyanduId: z.string().optional().nullable(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return err("Pengguna tidak ditemukan", 404)

  const { password, ...rest } = parsed.data
  const data: Record<string, unknown> = { ...rest }
  if (password) data.password = await bcrypt.hash(password, 12)

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, lastLoginAt: true },
  })
  return ok(updated, "Pengguna diperbarui")
}
