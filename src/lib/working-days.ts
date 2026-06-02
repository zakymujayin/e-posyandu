import { addDays, isWeekend, startOfDay } from "date-fns"
import { prisma } from "@/lib/prisma"

export async function calculateDeadline(
  startDate: Date,
  workingDays: number
): Promise<Date> {
  const endDate = addDays(startDate, workingDays * 3 + 10)
  const holidaySet = await fetchHolidaySet(startDate, endDate)

  let remaining = workingDays
  let current = new Date(startDate)

  while (remaining > 0) {
    current = addDays(current, 1)
    if (isWorkingDay(current, holidaySet)) {
      remaining--
    }
  }

  return current
}

export function isWorkingDay(date: Date, holidaySet: Set<string>): boolean {
  if (isWeekend(date)) return false
  const key = formatDateKey(date)
  return !holidaySet.has(key)
}

async function fetchHolidaySet(from: Date, to: Date): Promise<Set<string>> {
  const holidays = await prisma.publicHoliday.findMany({
    where: {
      date: {
        gte: startOfDay(from),
        lte: to,
      },
    },
    select: { date: true },
  })

  return new Set(holidays.map((h) => formatDateKey(h.date)))
}

function formatDateKey(date: Date): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export async function getRemainingWorkingDays(
  startDate: Date,
  deadline: Date
): Promise<number> {
  const holidaySet = await fetchHolidaySet(startDate, deadline)

  let count = 0
  let current = new Date(startDate)
  const end = new Date(deadline)

  while (current < end) {
    current = addDays(current, 1)
    if (isWorkingDay(current, holidaySet)) {
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
