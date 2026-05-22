import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

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
    const { name, isActive } = body

    const posyandu = await prisma.posyandu.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { desa: { select: { name: true, kecamatan: { select: { name: true } } } } },
    })

    return ok(posyandu)
  } catch {
    return err("Gagal memperbarui posyandu", 500)
  }
}
