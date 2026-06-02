import { prisma } from "@/lib/prisma"
import { getRemainingWorkingDays } from "@/lib/working-days"
import { sendDeadlineReminderEmail } from "@/lib/email"
import { differenceInCalendarDays } from "date-fns"
import { ok, err } from "@/lib/api-helpers"
import type { NotificationType } from "@/lib/notifications"

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

  // Pre-fetch handler user maps to avoid N+1 in loop
  const desaIds = [...new Set(pengajuans.filter((p) => p.status === "MENUNGGU_VERIFIKASI").map((p) => p.desa.id))]
  const opdIds = [...new Set(pengajuans.filter((p) => p.status === "DALAM_PROSES_OPD" && p.opdId).map((p) => p.opdId!))]

  const [petugasDesas, petugasOpds] = await Promise.all([
    desaIds.length > 0
      ? prisma.user.findMany({
          where: { role: "PETUGAS_DESA", desaId: { in: desaIds }, isActive: true },
          select: { id: true, desaId: true },
        })
      : [],
    opdIds.length > 0
      ? prisma.user.findMany({
          where: { role: "PETUGAS_OPD", opdId: { in: opdIds }, isActive: true },
          select: { id: true, opdId: true, email: true, name: true },
        })
      : [],
  ])

  const desaHandlers = new Map<string, string[]>()
  for (const u of petugasDesas) {
    if (!u.desaId) continue
    const arr = desaHandlers.get(u.desaId) ?? []
    arr.push(u.id)
    desaHandlers.set(u.desaId, arr)
  }
  const opdHandlers = new Map<string, { id: string; email: string; name: string }[]>()
  for (const u of petugasOpds) {
    if (!u.opdId) continue
    const arr = opdHandlers.get(u.opdId) ?? []
    arr.push(u)
    opdHandlers.set(u.opdId, arr)
  }

  // Collect batching data
  const notifiedH2Ids: string[] = []
  const notifDatas: { userId: string; type: NotificationType; title: string; message: string; pengajuanId: string }[] = []
  const bypassActions: { id: string; tiketNumber: string; newStatus: string; oldStatus: string; posyanduUserId: string }[] = []

  let processed = 0
  const now = new Date()

  for (const p of pengajuans) {
    const remaining = await getRemainingWorkingDays(now, p.deadlineAt)
    const calendarDays = differenceInCalendarDays(now, p.submittedAt)

    // H-2 notification
    if (remaining <= 2 && remaining > 0 && !p.notifiedH2) {
      const handlerIds =
        p.status === "MENUNGGU_VERIFIKASI"
          ? desaHandlers.get(p.desa.id) ?? []
          : opdHandlers.get(p.opdId ?? "")?.map((u) => u.id) ?? []

      const allIds = [...adminIds, ...handlerIds]
      for (const uid of allIds) {
        notifDatas.push({
          userId: uid,
          type: "SOP_WARNING_H2",
          title: "Peringatan SOP H-2",
          message: `Pengajuan ${p.tiketNumber} mendekati batas waktu (sisa ${remaining} hari kerja).`,
          pengajuanId: p.id,
        })
      }

      notifiedH2Ids.push(p.id)

      // Email to OPD handlers (only for DALAM_PROSES_OPD status)
      if (p.status === "DALAM_PROSES_OPD" && p.opdId) {
        const officers = opdHandlers.get(p.opdId)
        if (officers) {
          await Promise.allSettled(
            officers.map((o) => sendDeadlineReminderEmail(o.email, o.name, p.tiketNumber, remaining, p.id))
          )
        }
      }
    }

    // SOP expired notification
    if (remaining <= 0) {
      for (const uid of adminIds) {
        notifDatas.push({
          userId: uid,
          type: "SOP_EXPIRED",
          title: "SOP Habis",
          message: `Pengajuan ${p.tiketNumber} telah melewati batas waktu SOP 7 hari kerja.`,
          pengajuanId: p.id,
        })
      }
    }

    // Auto-bypass: 10 hari kalender
    if (calendarDays >= 10 && !p.autoBypassAt) {
      const newStatus = p.status === "MENUNGGU_VERIFIKASI" ? "DALAM_PROSES_OPD" : "SELESAI"
      bypassActions.push({
        id: p.id,
        tiketNumber: p.tiketNumber,
        newStatus,
        oldStatus: p.status,
        posyanduUserId: p.posyanduUser.id,
      })
    }

    processed++
  }

  // Batch: notifiedH2 updates
  if (notifiedH2Ids.length > 0) {
    await prisma.pengajuan.updateMany({
      where: { id: { in: notifiedH2Ids } },
      data: { notifiedH2: true },
    })
  }

  // Batch: auto-bypass updates + activity logs
  if (bypassActions.length > 0) {
    const menyusul = bypassActions.filter((a) => a.newStatus === "DALAM_PROSES_OPD")
    const selesai = bypassActions.filter((a) => a.newStatus === "SELESAI")

    await prisma.$transaction(async (tx) => {
      if (menyusul.length > 0) {
        await tx.pengajuan.updateMany({
          where: { id: { in: menyusul.map((a) => a.id) } },
          data: { status: "DALAM_PROSES_OPD", autoBypassAt: now },
        })
      }
      if (selesai.length > 0) {
        await tx.pengajuan.updateMany({
          where: { id: { in: selesai.map((a) => a.id) } },
          data: { status: "SELESAI", autoBypassAt: now, completedAt: now },
        })
      }

      const allBypass = [...menyusul, ...selesai]
      await tx.activityLog.createMany({
        data: allBypass.map((a) => ({
          pengajuanId: a.id,
          userId: null,
          userRole: "SISTEM" as const,
          action: "Auto-bypass oleh sistem",
          oldStatus: a.oldStatus,
          newStatus: a.newStatus,
        })),
      })
    })

    // Auto-bypass notifications
    for (const a of bypassActions) {
      const notifyIds = [a.posyanduUserId, ...adminIds]
      for (const uid of notifyIds) {
        notifDatas.push({
          userId: uid,
          type: "AUTO_BYPASS",
          title: "Auto-Bypass Sistem",
          message: `Pengajuan ${a.tiketNumber} otomatis diproses ke tahap berikutnya karena melewati 10 hari kalender.`,
          pengajuanId: a.id,
        })
      }
    }
  }

  // Batch: all notifications with createMany
  if (notifDatas.length > 0) {
    await prisma.notification.createMany({ data: notifDatas })
  }

  return ok({ processed }, `SOP check selesai: ${processed} pengajuan diproses`)
}
