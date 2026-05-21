import { prisma } from "@/lib/prisma"

export type NotificationType =
  | "NEW_SUBMISSION"
  | "VERIFIED"
  | "REJECTED_DESA"
  | "REJECTED_OPD"
  | "OPD_RECEIVED"
  | "FOLLOWUP_SUBMITTED"
  | "FOLLOWUP_APPROVED"
  | "REVISION_REQUESTED"
  | "SOP_WARNING_H2"
  | "SOP_EXPIRED"
  | "ADMIN_WARNING"
  | "BYPASS_MANUAL"
  | "AUTO_BYPASS"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  pengajuanId?: string
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      pengajuanId: params.pengajuanId,
    },
  })
}

export async function createNotificationsForUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
): Promise<void> {
  await Promise.all(
    userIds.map((userId) =>
      createNotification({ ...params, userId })
    )
  )
}

export async function notifyPengajuanBaru(kaderId: string, pengajuanId: string, tiketNumber: string): Promise<void> {
  const kader = await prisma.user.findUnique({
    where: { id: kaderId },
    include: { posyandu: { include: { desa: true } } },
  })

  if (!kader?.posyandu?.desa) return

  const petugasDesaIds = await prisma.user.findMany({
    where: {
      role: "PETUGAS_DESA",
      desaId: kader.posyandu.desa.id,
      isActive: true,
    },
    select: { id: true },
  })

  const title = "Pengajuan Baru"
  const message = `Pengajuan baru ${tiketNumber} menunggu verifikasi.`

  await createNotificationsForUsers(
    petugasDesaIds.map((u) => u.id),
    { type: "NEW_SUBMISSION", title, message, pengajuanId }
  )
}
