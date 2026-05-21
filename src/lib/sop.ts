import { prisma } from "@/lib/prisma"
import { getRemainingWorkingDays } from "@/lib/working-days"
import { differenceInCalendarDays } from "date-fns"

export type SopStatus = "NORMAL" | "WARNING" | "EXPIRED"

export interface SopInfo {
  submittedAt: Date
  deadlineAt: Date
  remainingDays: number
  totalDays: number
  sopStatus: SopStatus
  calendarDaysPassed: number
  isAutoBypassEligible: boolean
}

export async function getSopInfo(pengajuanId: string): Promise<SopInfo | null> {
  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id: pengajuanId },
    select: {
      submittedAt: true,
      deadlineAt: true,
      sopExpiredAt: true,
      autoBypassAt: true,
    },
  })

  if (!pengajuan) return null

  const remainingDays = await getRemainingWorkingDays(new Date(), pengajuan.deadlineAt)
  const totalDays = 7

  const calendarDaysPassed = differenceInCalendarDays(new Date(), pengajuan.submittedAt)

  let sopStatus: SopStatus = "NORMAL"
  if (remainingDays <= 0) {
    sopStatus = "EXPIRED"
  } else if (remainingDays <= 2) {
    sopStatus = "WARNING"
  }

  const isAutoBypassEligible = calendarDaysPassed >= 10 && !pengajuan.autoBypassAt

  return {
    submittedAt: pengajuan.submittedAt,
    deadlineAt: pengajuan.deadlineAt,
    remainingDays,
    totalDays,
    sopStatus,
    calendarDaysPassed,
    isAutoBypassEligible,
  }
}

export function formatSopStatus(sopStatus: SopStatus): string {
  switch (sopStatus) {
    case "NORMAL": return "Dalam batas waktu"
    case "WARNING": return "Hampir habis"
    case "EXPIRED": return "SOP habis"
  }
}
