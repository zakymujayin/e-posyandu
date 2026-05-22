import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { createNotificationsForUsers } from "@/lib/notifications"
import { sendStatusChangeEmail } from "@/lib/email"

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  catatan: z.string().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(["PETUGAS_DESA"])
  if (!user) return response!

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err("Data tidak valid")

  const { action, catatan } = parsed.data

  if (action === "REJECT" && !catatan?.trim()) {
    return err("Alasan penolakan wajib diisi")
  }

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id },
    include: { kader: { select: { id: true, email: true, name: true } } },
  })

  if (!pengajuan) return err("Pengajuan tidak ditemukan", 404)
  if (pengajuan.status !== "MENUNGGU_VERIFIKASI") {
    return err("Pengajuan tidak dalam status menunggu verifikasi")
  }

  const petugasDesa = await prisma.user.findUnique({ where: { id: user.id } })
  if (petugasDesa?.desaId !== pengajuan.desaId) return err("Akses ditolak", 403)

  const newStatus = action === "APPROVE" ? "DALAM_PROSES_OPD" : "DITOLAK_DESA"

  await prisma.$transaction(async (tx) => {
    await tx.pengajuan.update({
      where: { id },
      data: { status: newStatus },
    })

    await tx.verifikasiDesa.create({
      data: {
        pengajuanId: id,
        petugasDesaId: user.id,
        status: action,
        catatan,
      },
    })

    await tx.activityLog.create({
      data: {
        pengajuanId: id,
        userId: user.id,
        userRole: "PETUGAS_DESA",
        action: action === "APPROVE" ? "Pengajuan diverifikasi" : "Pengajuan ditolak oleh Desa",
        oldStatus: "MENUNGGU_VERIFIKASI",
        newStatus,
        catatan,
      },
    })
  })

  if (action === "APPROVE") {
    // Notif ke OPD terkait
    const opdUsers = await prisma.user.findMany({
      where: { role: "PETUGAS_OPD", opdId: pengajuan.opdId, isActive: true },
      select: { id: true },
    })
    await createNotificationsForUsers(
      opdUsers.map((u) => u.id),
      {
        type: "OPD_RECEIVED",
        title: "Pengajuan Baru Masuk",
        message: `Pengajuan ${pengajuan.tiketNumber} telah diverifikasi dan menunggu tindak lanjut.`,
        pengajuanId: id,
      }
    )
  } else {
    // Notif ke kader
    await createNotificationsForUsers([pengajuan.kaderId], {
      type: "REJECTED_DESA",
      title: "Pengajuan Ditolak",
      message: `Pengajuan ${pengajuan.tiketNumber} ditolak oleh Petugas Desa. Alasan: ${catatan}`,
      pengajuanId: id,
    })
  }

  // Email to kader (fire-and-forget)
  sendStatusChangeEmail(
    pengajuan.kader.email,
    pengajuan.kader.name,
    pengajuan.tiketNumber,
    action === "APPROVE" ? "Dalam Proses OPD" : "Ditolak Desa",
    id,
    "KADER"
  ).catch(() => {})

  return ok({ status: newStatus }, action === "APPROVE" ? "Pengajuan diverifikasi" : "Pengajuan ditolak")
}
