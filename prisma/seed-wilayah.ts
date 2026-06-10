import { config } from "dotenv"

config()

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import ExcelJS from "exceljs"
import * as path from "path"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding kecamatan & desa from Excel...")

  const filePath = path.resolve(__dirname, "../docs/DAFTAR NAMA DESA DAN KELURAHAN.xlsx")
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const sheet = workbook.worksheets[0]

  const rows: { colA: string; colB: string; colG: string }[] = []
  sheet.eachRow((row, i) => {
    if (i < 6) return
    const colA = String(row.getCell(1).value || "").trim()
    const colB = String(row.getCell(2).value || "").trim()
    const colG = String(row.getCell(7).value || "").trim()
    if (!colG || colG === "Daftar" || colG === "Desa/Kelurahan" || colB === "TOTAL") return
    if (!/^\d+\.\d+\.\d+$/.test(colA)) return
    rows.push({ colA, colB, colG })
  })

  let kecamatanCount = 0
  let desaCount = 0
  let currentKecId: string | null = null
  let currentKecCode: string | null = null
  let desaSeq = 0

  for (const { colA, colB, colG } of rows) {
    const kecCode = colA.replace(/\./g, "")
    const namaKecamatan = colB
    const namaDesa = colG

    if (kecCode !== currentKecCode) {
      const existingKec = await prisma.kecamatan.findFirst({
        where: { name: { contains: namaKecamatan, mode: "insensitive" } },
      })

      if (existingKec) {
        currentKecId = existingKec.id
        currentKecCode = kecCode
        await prisma.kecamatan.update({
          where: { id: existingKec.id },
          data: { code: kecCode, name: namaKecamatan },
        })
        console.log(`  ↻ Update: ${existingKec.name} → ${namaKecamatan} (${kecCode})`)
      } else {
        const created = await prisma.kecamatan.create({
          data: { name: namaKecamatan, code: kecCode },
        })
        currentKecId = created.id
        currentKecCode = kecCode
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
          data: { name: namaDesa, code: desaCode, kecamatanId: currentKecId },
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
