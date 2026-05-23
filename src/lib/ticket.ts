import { prisma } from "@/lib/prisma"

export async function generateTicketNumber(opdId: string): Promise<string> {
  const opd = await prisma.opd.findUnique({
    where: { id: opdId },
    select: { tiketPrefix: true },
  })

  if (!opd) throw new Error("OPD tidak ditemukan")

  const year = new Date().getFullYear()

  const counter = await prisma.$transaction(async (tx) => {
    let record = await tx.tiketCounter.findUnique({
      where: { opdId_year: { opdId, year } },
    })

    if (!record) {
      record = await tx.tiketCounter.create({
        data: { opdId, year, lastSequence: 0 },
      })
    }

    const newSequence = record.lastSequence + 1
    await tx.tiketCounter.update({
      where: { id: record.id },
      data: { lastSequence: newSequence },
    })

    return { ...record, lastSequence: newSequence }
  })

  const sequenceStr = String(counter.lastSequence).padStart(4, "0")
  return `${opd.tiketPrefix}-${year}-${sequenceStr}`
}
