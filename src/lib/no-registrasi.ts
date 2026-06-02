import { prisma } from "@/lib/prisma"

export async function generateNoRegistrasi(kecamatanId: string): Promise<string> {
  const kecamatan = await prisma.kecamatan.findUnique({
    where: { id: kecamatanId },
    select: { code: true },
  })

  if (!kecamatan) throw new Error("Kecamatan tidak ditemukan")

  const counter = await prisma.$transaction(async (tx) => {
    let record = await tx.noRegCounter.findUnique({
      where: { kecamatanId },
    })

    if (!record) {
      record = await tx.noRegCounter.create({
        data: { kecamatanId, lastSequence: 0 },
      })
    }

    const newSequence = record.lastSequence + 1
    await tx.noRegCounter.update({
      where: { id: record.id },
      data: { lastSequence: newSequence },
    })

    return { ...record, lastSequence: newSequence }
  })

  const seq = String(counter.lastSequence).padStart(3, "0")
  return `${kecamatan.code}-${seq}`
}
