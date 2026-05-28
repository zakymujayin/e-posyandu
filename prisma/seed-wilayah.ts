import { config } from "dotenv"

config()

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import * as XLSX from "xlsx"
import * as path from "path"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function normalizeKecName(name: string): string {
  return name.replace(/^Kecamatan\s+/i, "").trim()
}

async function main() {
  console.log("🌱 Seeding kecamatan & desa dari Excel...")

  const filePath = path.resolve(__dirname, "../docs/DAFTAR NAMA DESA DAN KELURAHAN.xlsx")
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const rows: (string | null)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  let kecamatanCount = 0
  let desaCount = 0

  let currentKecId: string | null = null
  let currentKecCode: string | null = null
  let currentKecName: string | null = null
  let desaSeq = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const kodeKemendagri = row[0] ? String(row[0]).trim() : null
    const namaKecamatan = row[1] ? String(row[1]).trim() : null
    const namaDesa = row[6] ? String(row[6]).trim() : null

    if (!namaDesa) continue

    const isTotal = namaKecamatan === "TOTAL"
    if (isTotal) break

    if (kodeKemendagri && /^\d+\.\d+\.\d+$/.test(kodeKemendagri) && namaKecamatan) {
      const kecCode = kodeKemendagri.replace(/\./g, "")

      const existingKec = await prisma.kecamatan.findFirst({
        where: { name: { contains: namaKecamatan, mode: "insensitive" } },
      })

      if (existingKec) {
        currentKecId = existingKec.id
        currentKecCode = kecCode
        currentKecName = namaKecamatan
        await prisma.kecamatan.update({
          where: { id: existingKec.id },
          data: { code: kecCode, name: namaKecamatan },
        })
        console.log(`  ↻ Update kecamatan: ${existingKec.name} → ${namaKecamatan} (${kecCode})`)
      } else {
        const created = await prisma.kecamatan.create({
          data: { name: namaKecamatan, code: kecCode },
        })
        currentKecId = created.id
        currentKecCode = kecCode
        currentKecName = namaKecamatan
        console.log(`  + Kecamatan: ${namaKecamatan} (${kecCode})`)
      }
      kecamatanCount++
      desaSeq = 0
    }

    if (currentKecId && currentKecCode) {
      desaSeq++
      const desaCode = `${currentKecCode}${String(desaSeq).padStart(4, "0")}`

      const existingDesa = await prisma.desa.findFirst({
        where: { name: namaDesa, kecamatanId: currentKecId },
      })

      if (existingDesa) {
        await prisma.desa.update({
          where: { id: existingDesa.id },
          data: { code: desaCode },
        })
      } else {
        await prisma.desa.create({
          data: {
            name: namaDesa,
            code: desaCode,
            kecamatanId: currentKecId,
          },
        })
        desaCount++
      }
    }
  }

  console.log(`✅ Seeded: ${kecamatanCount} kecamatan, ${desaCount} desa baru`)
}

main()
  .catch((e) => {
    console.error("❌ Seed wilayah failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
