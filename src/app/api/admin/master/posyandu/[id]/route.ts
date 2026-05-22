import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

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
