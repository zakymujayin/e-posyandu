import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { createNotificationsForUsers } from "@/lib/notifications"
import { sendStatusChangeEmail } from "@/lib/email"

const schema = z.object({
  catatan: z.string().min(1, "Alasan penolakan wajib diisi"),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(["PETUGAS_OPD"])
  if (!user) return response!

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id },
    include: { kader: { select: { id: true, email: true, name: true } } },
  })

  if (!pengajuan) return err("Pengajuan tidak ditemukan", 404)
  if (pengajuan.status !== "DALAM_PROSES_OPD") {
    return err("Pengajuan tidak dalam status proses OPD")
  }

  const opd = await prisma.user.findUnique({ where: { id: user.id }, select: { opdId: true } })
  if (opd?.opdId !== pengajuan.opdId) return err("Akses ditolak", 403)

  await prisma.$transaction(async (tx) => {
    await tx.pengajuan.update({
      where: { id },
      data: { status: "DITOLAK_OPD" },
    })
    await tx.activityLog.create({
      data: {
        pengajuanId: id,
        userId: user.id,
        userRole: "PETUGAS_OPD",
        action: "Pengajuan ditolak oleh OPD",
        oldStatus: "DALAM_PROSES_OPD",
        newStatus: "DITOLAK_OPD",
        catatan: parsed.data.catatan,
      },
    })
  })

  await createNotificationsForUsers([pengajuan.kaderId], {
    type: "REJECTED_OPD",
    title: "Pengajuan Ditolak OPD",
    message: `Pengajuan ${pengajuan.tiketNumber} ditolak oleh OPD. Alasan: ${parsed.data.catatan}`,
    pengajuanId: id,
  })

  sendStatusChangeEmail(
    pengajuan.kader.email,
    pengajuan.kader.name,
    pengajuan.tiketNumber,
    "Ditolak OPD",
    id,
    "KADER"
  ).catch(() => {})

  return ok({ status: "DITOLAK_OPD" }, "Pengajuan berhasil ditolak")
}
