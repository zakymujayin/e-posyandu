import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidatePattern } from "@/lib/cache"

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!
  const { id } = await params
  const kaderCount = await prisma.user.count({ where: { posyanduId: id } })
  if (kaderCount > 0) return err(`Tidak dapat dihapus: masih ada ${kaderCount} kader terdaftar`, 400)
  const pengCount = await prisma.pengajuan.count({ where: { posyanduId: id } })
  if (pengCount > 0) return err(`Tidak dapat dihapus: masih ada ${pengCount} pengajuan terkait`, 400)
  try {
    await prisma.posyandu.delete({ where: { id } })
    invalidatePattern("master:posyandu*")
    return ok(null, "Posyandu dihapus")
  } catch {
    return err("Gagal menghapus posyandu", 500)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params

  try {
    const body = await req.json()
    const { name, code, isActive, desaId } = body

    const posyandu = await prisma.posyandu.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(isActive !== undefined && { isActive }),
        ...(desaId !== undefined && { desaId }),
      },
      include: { desa: { select: { name: true, kecamatan: { select: { id: true, name: true } } } } },
    })

    invalidatePattern("master:posyandu*")
    return ok(posyandu)
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") return err("Kode sudah digunakan", 409)
    return err("Gagal memperbarui posyandu", 500)
  }
}
