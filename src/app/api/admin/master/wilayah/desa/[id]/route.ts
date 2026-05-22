import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!
  const { id } = await params
  const { name } = await req.json()
  if (!name?.trim()) return err("Nama wajib diisi", 400)
  try {
    const updated = await prisma.desa.update({ where: { id }, data: { name: name.trim() } })
    return ok(updated)
  } catch {
    return err("Gagal memperbarui desa", 500)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!
  const { id } = await params
  const posCount = await prisma.posyandu.count({ where: { desaId: id } })
  if (posCount > 0) return err(`Tidak dapat dihapus: masih ada ${posCount} posyandu terdaftar`, 400)
  const userCount = await prisma.user.count({ where: { desaId: id } })
  if (userCount > 0) return err(`Tidak dapat dihapus: masih ada ${userCount} pengguna terdaftar`, 400)
  try {
    await prisma.desa.delete({ where: { id } })
    return ok(null, "Desa dihapus")
  } catch {
    return err("Gagal menghapus desa", 500)
  }
}
