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

export async function generateDesaTicketNumber(desaId: string): Promise<string> {
  const desa = await prisma.desa.findUnique({
    where: { id: desaId },
    select: { code: true },
  })

  if (!desa) throw new Error("Desa tidak ditemukan")

  // Buang 4 digit kode kabupaten (mis. "3602") → tersisa kode kec+desa
  // yang unik se-kabupaten, mis. "140006".
  const wilayahCode = desa.code.slice(4)
  const year = new Date().getFullYear()

  const counter = await prisma.$transaction(async (tx) => {
    let record = await tx.desaTiketCounter.findUnique({
      where: { desaId_year: { desaId, year } },
    })

    if (!record) {
      record = await tx.desaTiketCounter.create({
        data: { desaId, year, lastSequence: 0 },
      })
    }

    const newSequence = record.lastSequence + 1
    await tx.desaTiketCounter.update({
      where: { id: record.id },
      data: { lastSequence: newSequence },
    })

    return { ...record, lastSequence: newSequence }
  })

  const sequenceStr = String(counter.lastSequence).padStart(4, "0")
  return `DS-${wilayahCode}-${year}-${sequenceStr}`
}

export async function generateKecamatanTicketNumber(kecamatanId: string): Promise<string> {
  const kecamatan = await prisma.kecamatan.findUnique({
    where: { id: kecamatanId },
    select: { code: true },
  })

  if (!kecamatan) throw new Error("Kecamatan tidak ditemukan")

  // Buang 4 digit kode kabupaten (mis. "3602") → tersisa kode kecamatan
  // yang unik se-kabupaten, mis. "14".
  const wilayahCode = kecamatan.code.slice(4)
  const year = new Date().getFullYear()

  const counter = await prisma.$transaction(async (tx) => {
    let record = await tx.kecamatanTiketCounter.findUnique({
      where: { kecamatanId_year: { kecamatanId, year } },
    })

    if (!record) {
      record = await tx.kecamatanTiketCounter.create({
        data: { kecamatanId, year, lastSequence: 0 },
      })
    }

    const newSequence = record.lastSequence + 1
    await tx.kecamatanTiketCounter.update({
      where: { id: record.id },
      data: { lastSequence: newSequence },
    })

    return { ...record, lastSequence: newSequence }
  })

  const sequenceStr = String(counter.lastSequence).padStart(4, "0")
  return `KC-${wilayahCode}-${year}-${sequenceStr}`
}
