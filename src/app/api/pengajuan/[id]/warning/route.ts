import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { createNotificationsForUsers } from "@/lib/notifications"

const schema = z.object({
  catatan: z.string().min(1, "Isi teguran wajib diisi"),
  targetRole: z.enum(["PETUGAS_DESA", "PETUGAS_OPD"]),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const { catatan, targetRole } = parsed.data
  const pengajuan = await prisma.pengajuan.findUnique({ where: { id } })
  if (!pengajuan) return err("Pengajuan tidak ditemukan", 404)

  // Cari user target berdasarkan role dan konteks
  let targetUserIds: string[] = []
  if (targetRole === "PETUGAS_DESA") {
    const users = await prisma.user.findMany({
      where: { role: "PETUGAS_DESA", desaId: pengajuan.desaId, isActive: true },
      select: { id: true },
    })
    targetUserIds = users.map((u) => u.id)
  } else {
    const users = await prisma.user.findMany({
      where: { role: "PETUGAS_OPD", opdId: pengajuan.opdId, isActive: true },
      select: { id: true },
    })
    targetUserIds = users.map((u) => u.id)
  }

  await prisma.$transaction(async (tx) => {
    await tx.adminAction.create({
      data: {
        pengajuanId: id,
        adminId: user.id,
        actionType: "WARNING",
        targetRole,
        catatan,
      },
    })
    await tx.activityLog.create({
      data: {
        pengajuanId: id,
        userId: user.id,
        userRole: "ADMIN_DPMD",
        action: `Teguran dikirim ke ${targetRole}`,
        catatan,
      },
    })
  })

  await createNotificationsForUsers(targetUserIds, {
    type: "ADMIN_WARNING",
    title: "Teguran dari Admin DPMD",
    message: `Anda mendapat teguran terkait pengajuan ${pengajuan.tiketNumber}: ${catatan}`,
    pengajuanId: id,
  })

  return ok(null, "Teguran berhasil dikirim")
}
