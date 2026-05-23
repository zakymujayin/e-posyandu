import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!
  const { id } = await params
  const json = await req.json()
  const { name, code } = json
  if (!name?.trim()) return err("Nama wajib diisi", 400)
  try {
    const data: Record<string, string> = { name: name.trim() }
    if (code !== undefined) data.code = code
    const updated = await prisma.kecamatan.update({ where: { id }, data })
    return ok(updated)
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") return err("Kode sudah digunakan", 409)
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
