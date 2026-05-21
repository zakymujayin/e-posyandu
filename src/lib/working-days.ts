import { addBusinessDays } from "date-fns"

export async function calculateDeadline(
  startDate: Date,
  workingDays: number
): Promise<Date> {
  return addBusinessDays(startDate, workingDays)
}

export async function getRemainingWorkingDays(
  startDate: Date,
  deadline: Date
): Promise<number> {
  let count = 0
  let current = new Date(startDate)
  const end = new Date(deadline)
  while (current < end) {
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}