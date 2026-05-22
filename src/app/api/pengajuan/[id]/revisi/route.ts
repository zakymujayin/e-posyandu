import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { createNotificationsForUsers } from "@/lib/notifications"

const schema = z.object({ catatan: z.string().min(1, "Catatan revisi wajib diisi") })

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id },
    include: {
      tindakLanjuts: { orderBy: { submittedAt: "desc" }, take: 1, select: { id: true, petugasOpdId: true } },
    },
  })

  if (!pengajuan) return err("Pengajuan tidak ditemukan", 404)
  if (pengajuan.status !== "MENUNGGU_APPROVAL_DPMD") {
    return err("Pengajuan tidak dalam status menunggu approval")
  }

  await prisma.$transaction(async (tx) => {
    await tx.pengajuan.update({
      where: { id },
      data: { status: "DALAM_PROSES_OPD" },
    })

    if (pengajuan.tindakLanjuts[0]) {
      await tx.tindakLanjut.update({
        where: { id: pengajuan.tindakLanjuts[0].id },
        data: { status: "REVISION_NEEDED" },
      })
    }

    await tx.adminAction.create({
      data: {
        pengajuanId: id,
        adminId: user.id,
        actionType: "REVISION_REQUEST",
        targetRole: "PETUGAS_OPD",
        catatan: parsed.data.catatan,
      },
    })

    await tx.activityLog.create({
      data: {
        pengajuanId: id,
        userId: user.id,
        userRole: "ADMIN_DPMD",
        action: "Diminta revisi oleh Admin DPMD",
        oldStatus: "MENUNGGU_APPROVAL_DPMD",
        newStatus: "DALAM_PROSES_OPD",
        catatan: parsed.data.catatan,
      },
    })
  })

  if (pengajuan.tindakLanjuts[0]?.petugasOpdId) {
    await createNotificationsForUsers([pengajuan.tindakLanjuts[0].petugasOpdId], {
      type: "REVISION_REQUESTED",
      title: "Diminta Revisi",
      message: `Admin DPMD meminta revisi untuk pengajuan ${pengajuan.tiketNumber}: ${parsed.data.catatan}`,
      pengajuanId: id,
    })
  }

  return ok({ status: "DALAM_PROSES_OPD" }, "Permintaan revisi dikirim")
}
