import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import ExcelJS from "exceljs"
import * as path from "path"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Seeding data inti E-Posyandu...\n")

  // =============================================
  // 1. KECAMATAN + DESA from Excel
  // =============================================
  console.log("📌 1/6 Seeding Kecamatan & Desa...")

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path.resolve(__dirname, "../docs/DAFTAR NAMA DESA DAN KELURAHAN.xlsx"))
  const ws = wb.worksheets[0]

  const rows: { colA: string; colB: string; colG: string }[] = []
  ws.eachRow((row, i) => {
    if (i < 6) return
    const colA = String(row.getCell(1).value || "").trim()
    const colB = String(row.getCell(2).value || "").trim()
    const colG = String(row.getCell(7).value || "").trim()
    if (!colG || colG === "Daftar" || colG === "Desa/Kelurahan" || colB === "TOTAL") return
    if (!colA.includes(".")) return
    rows.push({ colA, colB, colG })
  })

  let kecCount = 0
  let desaCount = 0
  let currentKecId: string | null = null
  let currentKecCode = ""
  let desaSeq = 0

  for (const { colA, colB, colG } of rows) {
    const kecCode = colA.replace(/\./g, "")

    if (kecCode !== currentKecCode) {
      const existing = await prisma.kecamatan.upsert({
        where: { code: kecCode },
        update: { name: colB },
        create: { name: colB, code: kecCode },
      })
      currentKecId = existing.id
      currentKecCode = kecCode
      desaSeq = 0
      kecCount++
    }

    desaSeq++
    const desaCode = `${kecCode}${String(desaSeq).padStart(4, "0")}`

    await prisma.desa.upsert({
      where: { code: desaCode },
      update: { name: colG, kecamatanId: currentKecId! },
      create: { name: colG, code: desaCode, kecamatanId: currentKecId! },
    })
    desaCount++
  }

  console.log(`   ✅ ${kecCount} Kecamatan, ${desaCount} Desa/Kelurahan`)

  // =============================================
  // 2. OPD
  // =============================================
  console.log("📌 2/6 Seeding OPD...")

  const opds = [
    { code: "DINKES", name: "Dinas Kesehatan", icon: "Activity", desc: "Pelayanan kesehatan, imunisasi, gizi, dan KB", sortOrder: 1 },
    { code: "DINDIK", name: "Dinas Pendidikan", icon: "GraduationCap", desc: "Pelayanan pendidikan, beasiswa, dan sekolah", sortOrder: 2 },
    { code: "DPUPR", name: "Dinas Pekerjaan Umum dan Penataan Ruang", icon: "Building2", desc: "Infrastruktur, jalan, dan tata ruang", sortOrder: 3 },
    { code: "DPERKIM", name: "Dinas Perumahan dan Kawasan Permukiman", icon: "Home", desc: "Perumahan layak huni dan sanitasi", sortOrder: 4 },
    { code: "POLPP", name: "Satuan Polisi Pamong Praja", icon: "Shield", desc: "Ketertiban umum dan Perlindungan Masyarakat", sortOrder: 5 },
    { code: "DINSOS", name: "Dinas Sosial", icon: "Users", desc: "Bantuan sosial, PKH, dan kesejahteraan", sortOrder: 6 },
  ]

  const opdRecords = []
  for (const opd of opds) {
    const record = await prisma.opd.upsert({
      where: { code: opd.code },
      update: { name: opd.name, description: opd.desc, sortOrder: opd.sortOrder },
      create: { name: opd.name, code: opd.code, icon: opd.icon, description: opd.desc, sortOrder: opd.sortOrder, tiketPrefix: opd.code },
    })
    opdRecords.push(record)
  }
  console.log(`   ✅ ${opdRecords.length} OPD`)

  // =============================================
  // 3. LAYANAN JENIS
  // =============================================
  console.log("📌 3/6 Seeding Layanan...")

  const dinkes = opdRecords.find((o) => o.code === "DINKES")!
  const dindik = opdRecords.find((o) => o.code === "DINDIK")!

  const layanans = [
    { name: "Pelayanan Kesehatan Dasar", opdId: dinkes.id, sortOrder: 1 },
    { name: "Pelayanan Imunisasi & Gizi", opdId: dinkes.id, sortOrder: 2 },
    { name: "Pelayanan Pendidikan", opdId: dindik.id, sortOrder: 3 },
    { name: "Surat Keterangan Tidak Mampu (SKTM)", opdId: null, isDesa: true, sortOrder: 4 },
    { name: "Surat Keterangan Domisili", opdId: null, isKecamatan: true, sortOrder: 5 },
  ]

  for (const l of layanans) {
    await prisma.layananJenis.upsert({
      where: { id: `layanan-${l.sortOrder}` },
      update: { name: l.name, opdId: l.opdId, isDesa: l.isDesa ?? false, isKecamatan: l.isKecamatan ?? false },
      create: { id: `layanan-${l.sortOrder}`, name: l.name, opdId: l.opdId, isDesa: l.isDesa ?? false, isKecamatan: l.isKecamatan ?? false, sortOrder: l.sortOrder },
    })
  }
  console.log(`   ✅ ${layanans.length} Layanan`)

  // =============================================
  // 4. USERS
  // =============================================
  console.log("📌 4/6 Seeding Users...")

  const adminPw = await bcrypt.hash("admin123", 12)
  const opdPw = await bcrypt.hash("opd123", 12)
  const kecPw = await bcrypt.hash("kecamatan123", 12)
  const desaPw = await bcrypt.hash("petugas123", 12)

  let userCount = 0

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@dpmd.go.id" },
    update: { username: "admin_dpmd", name: "Administrator DPMD" },
    create: {
      name: "Administrator DPMD",
      email: "admin@dpmd.go.id",
      username: "admin_dpmd",
      password: adminPw,
      role: "ADMIN_DPMD",
    },
  })
  userCount++

  // PETUGAS_OPD
  for (const opd of opdRecords) {
    await prisma.user.upsert({
      where: { email: `opd-${opd.code.toLowerCase()}@example.com` },
      update: { name: `Petugas ${opd.name}` },
      create: {
        name: `Petugas ${opd.name}`,
        email: `opd-${opd.code.toLowerCase()}@example.com`,
        username: `opd_${opd.code.toLowerCase()}`,
        password: opdPw,
        role: "PETUGAS_OPD",
        opdId: opd.id,
      },
    })
    userCount++
  }

  // PETUGAS_KECAMATAN
  const allKecamatan = await prisma.kecamatan.findMany()
  for (const kec of allKecamatan) {
    await prisma.user.upsert({
      where: { email: `kec-${kec.code}@example.com` },
      update: { name: `Petugas Kecamatan ${kec.name}` },
      create: {
        name: `Petugas Kecamatan ${kec.name}`,
        email: `kec-${kec.code}@example.com`,
        username: `kec_${kec.code}`,
        password: kecPw,
        role: "PETUGAS_KECAMATAN",
        kecamatanId: kec.id,
      },
    })
    userCount++
  }

  // PETUGAS_DESA
  const allDesa = await prisma.desa.findMany({ include: { kecamatan: true } })
  for (const desa of allDesa) {
    await prisma.user.upsert({
      where: { email: `desa-${desa.code}@example.com` },
      update: { name: `Petugas Desa ${desa.name}` },
      create: {
        name: `Petugas Desa ${desa.name}`,
        email: `desa-${desa.code}@example.com`,
        username: `desa_${desa.code}`,
        password: desaPw,
        role: "PETUGAS_DESA",
        desaId: desa.id,
        kecamatanId: desa.kecamatan.id,
      },
    })
    userCount++
  }

  console.log(`   ✅ ${userCount} Users (1 admin + 6 opd + ${allKecamatan.length} kec + ${allDesa.length} desa)`)

  // =============================================
  // 5. COUNTERS
  // =============================================
  console.log("📌 5/6 Seeding Counters...")

  for (const kec of allKecamatan) {
    await prisma.noRegCounter.upsert({
      where: { kecamatanId: kec.id },
      update: {},
      create: { kecamatanId: kec.id, lastSequence: 0 },
    })
  }

  const currentYear = new Date().getFullYear()
  for (const opd of opdRecords) {
    await prisma.tiketCounter.upsert({
      where: { opdId_year: { opdId: opd.id, year: currentYear } },
      update: {},
      create: { opdId: opd.id, year: currentYear, lastSequence: 0 },
    })
  }

  console.log(`   ✅ ${allKecamatan.length} NoRegCounter + ${opdRecords.length} TiketCounter`)

  // =============================================
  // 6. DONE
  // =============================================
  console.log("\n🎉 Seed produksi selesai!")
  console.log("   Kredensial login:")
  console.log("   Admin   : admin_dpmd / admin123")
  console.log("   OPD     : opd_dinkes   / opd123")
  console.log("   Kec     : kec_360209   / kecamatan123")
  console.log("   Desa    : desa_3602090001 / petugas123")
  console.log("\n   ⚠️  Segera ganti password admin setelah login pertama.")
}

main()
  .catch((e) => {
    console.error("❌ Seed production failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
