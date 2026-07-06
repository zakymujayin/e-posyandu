import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidatePattern } from "@/lib/cache"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!
  const { id } = await params
  const json = await req.json()
  const { name, code, kecamatanId } = json
  if (!name?.trim()) return err("Nama wajib diisi", 400)
  try {
    const data: Record<string, string> = { name: name.trim() }
    if (code !== undefined) data.code = code
    if (kecamatanId !== undefined) data.kecamatanId = kecamatanId
    const updated = await prisma.desa.update({
      where: { id },
      data,
      include: { kecamatan: { select: { id: true, name: true } } },
    })
    invalidatePattern("master:desa")
    return ok(updated)
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") return err("Kode sudah digunakan", 409)
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
    invalidatePattern("master:desa")
    return ok(null, "Desa dihapus")
  } catch {
    return err("Gagal menghapus desa", 500)
  }
}
