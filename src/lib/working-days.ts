import { addDays, isWeekend } from "date-fns"
import { prisma } from "@/lib/prisma"
import { withCache } from "@/lib/cache"

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
  const fromYear = from.getFullYear()
  const toYear = to.getFullYear()
  const years = fromYear === toYear ? [fromYear] : [fromYear, toYear]

  const allKeys: string[] = []
  for (const year of years) {
    const dates = await withCache<string[]>(
      `public_holidays:${year}`,
      86400 * 30,
      async () => {
        const rows = await prisma.publicHoliday.findMany({
          where: {
            date: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31T23:59:59`) },
          },
          select: { date: true },
        })
        return rows.map((r) => formatDateKey(r.date))
      }
    )
    allKeys.push(...dates)
  }
  return new Set(allKeys)
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
