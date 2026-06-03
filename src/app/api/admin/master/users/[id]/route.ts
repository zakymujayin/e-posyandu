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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params

  if (id === user.id) return err("Tidak dapat menghapus akun sendiri", 400)

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return err("Pengguna tidak ditemukan", 404)

  const [pengajuan, balita, ats, verDesa, verKec, tl, actions, notif] = await Promise.all([
    prisma.pengajuan.count({ where: { posyanduUserId: id } }),
    prisma.balita.count({ where: { posyanduUserId: id } }),
    prisma.anakTidakSekolah.count({ where: { posyanduUserId: id } }),
    prisma.verifikasiDesa.count({ where: { petugasDesaId: id } }),
    prisma.verifikasiKecamatan.count({ where: { petugasKecId: id } }),
    prisma.tindakLanjut.count({ where: { petugasOpdId: id } }),
    prisma.adminAction.count({ where: { adminId: id } }),
    prisma.notification.count({ where: { userId: id } }),
  ])

  const total = pengajuan + balita + ats + verDesa + verKec + tl + actions + notif

  if (total === 0) {
    await prisma.user.delete({ where: { id } })
    return ok(null, "Pengguna dihapus permanen")
  }

  const parts: string[] = []
  if (pengajuan > 0) parts.push(`${pengajuan} pengajuan`)
  if (balita > 0) parts.push(`${balita} balita`)
  if (ats > 0) parts.push(`${ats} ATS`)
  if (verDesa > 0) parts.push(`${verDesa} verifikasi desa`)
  if (verKec > 0) parts.push(`${verKec} verifikasi kecamatan`)
  if (tl > 0) parts.push(`${tl} tindak lanjut`)
  if (actions > 0) parts.push(`${actions} admin action`)
  if (notif > 0) parts.push(`${notif} notifikasi`)

  await prisma.user.update({ where: { id }, data: { isActive: false } })
  return ok(
    { isActive: false },
    `Akun dinonaktifkan (memiliki histori: ${parts.join(", ")})`
  )
}
