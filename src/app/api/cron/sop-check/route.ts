import { prisma } from "@/lib/prisma"
import { getRemainingWorkingDays } from "@/lib/working-days"
import { createNotificationsForUsers } from "@/lib/notifications"
import { sendDeadlineReminderEmail } from "@/lib/email"
import { differenceInCalendarDays } from "date-fns"
import { ok, err } from "@/lib/api-helpers"

const ACTIVE_STATUSES = ["MENUNGGU_VERIFIKASI", "DALAM_PROSES_OPD", "MENUNGGU_APPROVAL_DPMD"]

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return err("Unauthorized", 401)
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN_DPMD", isActive: true },
    select: { id: true },
  })
  const adminIds = admins.map((a) => a.id)

  const pengajuans = await prisma.pengajuan.findMany({
    where: { status: { in: ACTIVE_STATUSES } },
    include: {
      posyanduUser: { select: { id: true } },
      desa: { select: { id: true } },
    },
  })

  let processed = 0
  const now = new Date()

  for (const p of pengajuans) {
    const remaining = await getRemainingWorkingDays(now, p.deadlineAt)
    const calendarDays = differenceInCalendarDays(now, p.submittedAt)

    // H-2 notification
    if (remaining <= 2 && remaining > 0 && !p.notifiedH2) {
      const petugasIds = await getHandlerIds(p)
      await createNotificationsForUsers([...adminIds, ...petugasIds], {
        type: "SOP_WARNING_H2",
        title: "Peringatan SOP H-2",
        message: `Pengajuan ${p.tiketNumber} mendekati batas waktu (sisa ${remaining} hari kerja).`,
        pengajuanId: p.id,
      })
      await prisma.pengajuan.update({ where: { id: p.id }, data: { notifiedH2: true } })

      // Email to handlers
      if (p.status === "DALAM_PROSES_OPD" && p.opdId) {
        try {
          const officers = await prisma.user.findMany({
            where: { role: "PETUGAS_OPD", opdId: p.opdId, isActive: true },
            select: { email: true, name: true },
          })
          await Promise.allSettled(
            officers.map((o) => sendDeadlineReminderEmail(o.email, o.name, p.tiketNumber, remaining, p.id))
          )
        } catch {}
      }
    }

    // SOP expired notification
    if (remaining <= 0) {
      await createNotificationsForUsers(adminIds, {
        type: "SOP_EXPIRED",
        title: "SOP Habis",
        message: `Pengajuan ${p.tiketNumber} telah melewati batas waktu SOP 7 hari kerja.`,
        pengajuanId: p.id,
      })
    }

    // Auto-bypass: 10 hari kalender
    if (calendarDays >= 10 && !p.autoBypassAt) {
      const newStatus = p.status === "MENUNGGU_VERIFIKASI" ? "DALAM_PROSES_OPD" : "SELESAI"
      await prisma.$transaction(async (tx) => {
        await tx.pengajuan.update({
          where: { id: p.id },
          data: {
            status: newStatus,
            autoBypassAt: now,
            ...(newStatus === "SELESAI" ? { completedAt: now } : {}),
          },
        })
        await tx.activityLog.create({
          data: {
            pengajuanId: p.id,
            userId: null,
            userRole: "SISTEM",
            action: "Auto-bypass oleh sistem",
            oldStatus: p.status,
            newStatus,
          },
        })
      })

      const notifyIds = [p.posyanduUserId, ...adminIds]
      await createNotificationsForUsers(notifyIds, {
        type: "AUTO_BYPASS",
        title: "Auto-Bypass Sistem",
        message: `Pengajuan ${p.tiketNumber} otomatis diproses ke tahap berikutnya karena melewati 10 hari kalender.`,
        pengajuanId: p.id,
      })
    }

    processed++
  }

  return ok({ processed }, `SOP check selesai: ${processed} pengajuan diproses`)
}

async function getHandlerIds(p: { desaId: string; opdId: string | null; status: string }): Promise<string[]> {
  if (p.status === "MENUNGGU_VERIFIKASI") {
    const users = await prisma.user.findMany({
      where: { role: "PETUGAS_DESA", desaId: p.desaId, isActive: true },
      select: { id: true },
    })
    return users.map((u) => u.id)
  }
  if (p.status === "DALAM_PROSES_OPD" && p.opdId) {
    const users = await prisma.user.findMany({
      where: { role: "PETUGAS_OPD", opdId: p.opdId, isActive: true },
      select: { id: true },
    })
    return users.map((u) => u.id)
  }
  return []
}
