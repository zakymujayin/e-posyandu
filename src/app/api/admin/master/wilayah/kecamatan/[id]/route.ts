import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!
  const { id } = await params
  const { name } = await req.json()
  if (!name?.trim()) return err("Nama wajib diisi", 400)
  try {
    const updated = await prisma.kecamatan.update({ where: { id }, data: { name: name.trim() } })
    return ok(updated)
  } catch {
    return err("Gagal memperbarui kecamatan", 500)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!
  const { id } = await params
  const count = await prisma.desa.count({ where: { kecamatanId: id } })
  if (count > 0) return err(`Tidak dapat dihapus: masih ada ${count} desa terdaftar`, 400)
  try {
    await prisma.kecamatan.delete({ where: { id } })
    return ok(null, "Kecamatan dihapus")
  } catch {
    return err("Gagal menghapus kecamatan", 500)
  }
}
