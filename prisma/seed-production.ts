import { config } from "dotenv"

config()

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🚀 Seeding data inti E-Posyandu...\n")

  // =============================================
  // 1. OPD (6)
  // =============================================
  console.log("📌 1/5 Seeding OPD...")

  const opds = await Promise.all([
    prisma.opd.upsert({
      where: { code: "DINKES" },
      update: {},
      create: {
        id: "00d01909-6206-49ad-81a9-046aec459dc3",
        name: "Dinas Kesehatan",
        code: "DINKES",
        tiketPrefix: "DINKES",
        description: "Pelayanan kesehatan, imunisasi, gizi, dan KB",
        icon: "heart-pulse",
        color: "#10B981",
        sortOrder: 1,
      },
    }),
    prisma.opd.upsert({
      where: { code: "DINDIK" },
      update: {},
      create: {
        id: "64965d81-22a8-4957-ab6e-393c95fd2660",
        name: "Dinas Pendidikan",
        code: "DINDIK",
        tiketPrefix: "DINDIK",
        description: "Pelayanan pendidikan, beasiswa, dan sekolah",
        icon: "book-open",
        color: "#3B82F6",
        sortOrder: 2,
      },
    }),
    prisma.opd.upsert({
      where: { code: "DPUPR" },
      update: {},
      create: {
        id: "c56a698c-b28f-4302-a4d6-005f7bb980b8",
        name: "Dinas Pekerjaan Umum dan Penataan Ruang",
        code: "DPUPR",
        tiketPrefix: "DPUPR",
        description: "Infrastruktur, jalan, dan tata ruang",
        icon: "building",
        color: "#F97316",
        sortOrder: 3,
      },
    }),
    prisma.opd.upsert({
      where: { code: "DPERKIM" },
      update: {},
      create: {
        id: "8756cb98-1a43-4190-9e0d-0d9339e877b7",
        name: "Dinas Perumahan dan Kawasan Permukiman",
        code: "DPERKIM",
        tiketPrefix: "DPERKIM",
        description: "Perumahan layak huni dan sanitasi",
        icon: "home",
        color: "#8B5CF6",
        sortOrder: 4,
      },
    }),
    prisma.opd.upsert({
      where: { code: "POLPP" },
      update: {},
      create: {
        id: "ede442a3-60fb-412c-96f8-29b1f16786fd",
        name: "Satuan Polisi Pamong Praja",
        code: "POLPP",
        tiketPrefix: "POLPP",
        description: "Ketertiban umum dan perlindungan masyarakat",
        icon: "shield",
        color: "#EF4444",
        sortOrder: 5,
      },
    }),
    prisma.opd.upsert({
      where: { code: "DINSOS" },
      update: {},
      create: {
        id: "67f5a49a-fa47-484e-b4c2-158d9141c1a4",
        name: "Dinas Sosial",
        code: "DINSOS",
        tiketPrefix: "DINSOS",
        description: "Bantuan sosial, PKH, dan kesejahteraan",
        icon: "hand-heart",
        color: "#EC4899",
        sortOrder: 6,
      },
    }),
  ])
  console.log(`   ✅ ${opds.length} OPD`)

  const opdDinkes = opds.find((o) => o.code === "DINKES")!
  const opdDindik = opds.find((o) => o.code === "DINDIK")!

  // =============================================
  // 2. LAYANAN JENIS (5)
  // =============================================
  console.log("📌 2/5 Seeding Layanan Jenis...")

  const layanans = [
    { id: "layanan-kes-1", name: "Pengaduan Layanan Kesehatan", opdId: opdDinkes.id, sortOrder: 1 },
    { id: "layanan-kes-2", name: "Layanan Imunisasi", opdId: opdDinkes.id, sortOrder: 2 },
    { id: "layanan-pend-1", name: "Pengaduan Pendidikan", opdId: opdDindik.id, sortOrder: 3 },
    { id: "layanan-desa-1", name: "Surat Keterangan Tidak Mampu (SKTM)", opdId: null, isDesa: true, sortOrder: 4 },
    { id: "layanan-kec-1", name: "Surat Keterangan Domisili", opdId: null, isKecamatan: true, sortOrder: 5 },
  ]

  for (const l of layanans) {
    await prisma.layananJenis.upsert({
      where: { id: l.id },
      update: { name: l.name, opdId: l.opdId, isDesa: l.isDesa ?? false, isKecamatan: l.isKecamatan ?? false, sortOrder: l.sortOrder },
      create: { id: l.id, name: l.name, opdId: l.opdId, isDesa: l.isDesa ?? false, isKecamatan: l.isKecamatan ?? false, sortOrder: l.sortOrder },
    })
  }
  console.log(`   ✅ ${layanans.length} Layanan Jenis`)

  // =============================================
  // 3. USERS
  // =============================================
  console.log("📌 3/5 Seeding Users...")

  const allKecamatan = await prisma.kecamatan.findMany({ orderBy: { code: "asc" } })
  const allDesa = await prisma.desa.findMany({ include: { kecamatan: true }, orderBy: { code: "asc" } })

  if (allKecamatan.length === 0 || allDesa.length === 0) {
    throw new Error("Wilayah kosong — jalankan seed-wilayah.ts terlebih dahulu")
  }

  const adminPw = await bcrypt.hash("admin123", 12)
  const opdPw = await bcrypt.hash("opd123", 12)
  const kecPw = await bcrypt.hash("kecamatan123", 12)
  const desaPw = await bcrypt.hash("petugas123", 12)
  const posyanduPw = await bcrypt.hash("posyandu123", 12)

  let userCount = 0

  // Admin DPMD
  await prisma.user.upsert({
    where: { email: "admin@dpmd.go.id" },
    update: { username: "admin_dpmd", name: "Administrator DPMD" },
    create: {
      id: "719d7d82-a9b1-4d27-ba4e-c84db0cc158f",
      name: "Administrator DPMD",
      email: "admin@dpmd.go.id",
      username: "admin_dpmd",
      password: adminPw,
      role: "ADMIN_DPMD",
    },
  })
  userCount++

  // PETUGAS_OPD (6)
  for (const opd of opds) {
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

  // PETUGAS_KECAMATAN (28)
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

  // PETUGAS_DESA (345)
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

  console.log(`   ✅ ${userCount} Users (1 admin, ${opds.length} OPD, ${allKecamatan.length} kec, ${allDesa.length} desa) — POSYANDU di bawah`)

  // =============================================
  // 4. POSYANDU + POSYANDU USER
  // =============================================
  console.log("📌 4/5 Seeding Posyandu...")

  const desaNameng = await prisma.desa.findFirst({
    where: { name: "Nameng" },
    include: { kecamatan: true },
  })

  if (!desaNameng) {
    throw new Error("Desa Nameng tidak ditemukan — pastikan seed-wilayah.ts sudah dijalankan")
  }

  const posyanduNameng = await prisma.posyandu.upsert({
    where: { code: "POS_NAMENG_1" },
    update: {},
    create: {
      id: "2c532614-35c9-4dde-92ad-c6a384665c51",
      name: "Posyandu Nameng",
      code: "POS_NAMENG_1",
      desaId: desaNameng.id,
    },
  })

  const posyanduUser = await prisma.user.upsert({
    where: { email: "posyandu-nameng@example.com" },
    update: { username: "posyandu-nameng", name: "Posyandu Nameng" },
    create: {
      id: "b71ddd56-615a-46b8-8b82-c03b4484f13f",
      name: "Posyandu Nameng",
      email: "posyandu-nameng@example.com",
      username: "posyandu-nameng",
      password: posyanduPw,
      role: "POSYANDU",
      noRegistrasi: `${desaNameng.kecamatan.code}-001`,
      posyanduId: posyanduNameng.id,
      desaId: desaNameng.id,
      kecamatanId: desaNameng.kecamatan.id,
    },
  })

  console.log(`   ✅ 1 Posyandu (${posyanduNameng.name}) + 1 Akun Posyandu (${posyanduUser.username})`)

  // =============================================
  // 5. COUNTERS
  // =============================================
  console.log("📌 5/5 Seeding Counters...")

  const currentYear = new Date().getFullYear()

  // NoRegCounter — per kecamatan
  for (const kec of allKecamatan) {
    await prisma.noRegCounter.upsert({
      where: { kecamatanId: kec.id },
      update: {},
      create: { kecamatanId: kec.id, lastSequence: posyanduUser.noRegistrasi ? parseInt(posyanduUser.noRegistrasi.split("-")[1]) : 0 },
    })
  }
  console.log(`   ✅ ${allKecamatan.length} NoRegCounter`)

  // TiketCounter — per OPD per tahun
  for (const opd of opds) {
    await prisma.tiketCounter.upsert({
      where: { opdId_year: { opdId: opd.id, year: currentYear } },
      update: {},
      create: { opdId: opd.id, year: currentYear, lastSequence: 0 },
    })
  }
  console.log(`   ✅ ${opds.length} TiketCounter`)

  // DesaTiketCounter — per desa per tahun
  for (const desa of allDesa) {
    await prisma.desaTiketCounter.upsert({
      where: { desaId_year: { desaId: desa.id, year: currentYear } },
      update: {},
      create: { desaId: desa.id, year: currentYear, lastSequence: 0 },
    })
  }
  console.log(`   ✅ ${allDesa.length} DesaTiketCounter`)

  // KecamatanTiketCounter — per kecamatan per tahun
  for (const kec of allKecamatan) {
    await prisma.kecamatanTiketCounter.upsert({
      where: { kecamatanId_year: { kecamatanId: kec.id, year: currentYear } },
      update: {},
      create: { kecamatanId: kec.id, year: currentYear, lastSequence: 0 },
    })
  }
  console.log(`   ✅ ${allKecamatan.length} KecamatanTiketCounter`)

  // =============================================
  // DONE
  // =============================================
  console.log("\n🎉 Seed produksi selesai!")
  console.log("   Kredensial login:")
  console.log("   Admin    : admin_dpmd         / admin123")
  console.log("   OPD      : opd_dinkes         / opd123")
  console.log("   Kecamatan: kec_360214         / kecamatan123")
  console.log("   Desa     : desa_3602140006    / petugas123")
  console.log("   Posyandu : posyandu-nameng    / posyandu123")
  console.log("\n   ⚠️  Segera ganti password admin setelah login pertama.")
  console.log("   Kredensial lengkap semua user ada di docs/DAFTAR USER E-POSYANDU.xlsx")
}

main()
  .catch((e) => {
    console.error("❌ Seed production failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
