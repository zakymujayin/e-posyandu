import { addDays, isWeekend } from "date-fns"
import { prisma } from "@/lib/prisma"

export async function calculateDeadline(
  startDate: Date,
  workingDays: number
): Promise<Date> {
  let remaining = workingDays
  let current = new Date(startDate)

  while (remaining > 0) {
    current = addDays(current, 1)
    if (await isWorkingDay(current)) {
      remaining--
    }
  }

  return current
}

export async function isWorkingDay(date: Date): Promise<boolean> {
  if (isWeekend(date)) return false

  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const holiday = await prisma.publicHoliday.findFirst({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  })

  return !holiday
}

export async function getRemainingWorkingDays(
  startDate: Date,
  deadline: Date
): Promise<number> {
  let count = 0
  let current = new Date(startDate)
  const end = new Date(deadline)

  while (current < end) {
    current = addDays(current, 1)
    if (await isWorkingDay(current)) {
      count++
    }
  }

  return count
}

export async function getTotalWorkingDays(
  startDate: Date,
  endDate: Date
): Promise<number> {
  return getRemainingWorkingDays(startDate, endDate)
}
