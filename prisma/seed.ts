import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import bcrypt from "bcryptjs"

const adapter = new PrismaLibSql({ url: "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // 1. Admin DPMD
  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@dpmd.go.id" },
    update: {},
    create: {
      name: "Admin DPMD",
      email: "admin@dpmd.go.id",
      password: adminPassword,
      role: "ADMIN_DPMD",
    },
  })
  console.log("✅ Admin created:", admin.email)

  // 2. OPD (6 buah)
  const opds = await Promise.all([
    prisma.opd.upsert({
      where: { code: "KES" },
      update: {},
      create: {
        name: "Dinas Kesehatan",
        code: "KES",
        tiketPrefix: "KES",
        description: "Pengelola layanan kesehatan masyarakat",
        icon: "heart-pulse",
        color: "#10B981",
        sortOrder: 1,
      },
    }),
    prisma.opd.upsert({
      where: { code: "PEND" },
      update: {},
      create: {
        name: "Dinas Pendidikan",
        code: "PEND",
        tiketPrefix: "PEND",
        description: "Pengelola layanan pendidikan",
        icon: "book-open",
        color: "#3B82F6",
        sortOrder: 2,
      },
    }),
    prisma.opd.upsert({
      where: { code: "PUPR" },
      update: {},
      create: {
        name: "Dinas Pekerjaan Umum dan Perumahan Rakyat",
        code: "PUPR",
        tiketPrefix: "PUPR",
        description: "Pengelola infrastruktur dan perumahan",
        icon: "building",
        color: "#F97316",
        sortOrder: 3,
      },
    }),
    prisma.opd.upsert({
      where: { code: "PERKIM" },
      update: {},
      create: {
        name: "Dinas Perumahan Rakyat dan Kawasan Permukiman",
        code: "PERKIM",
        tiketPrefix: "PERKIM",
        description: "Pengelola perumahan dan permukiman",
        icon: "home",
        color: "#8B5CF6",
        sortOrder: 4,
      },
    }),
    prisma.opd.upsert({
      where: { code: "SATPOL" },
      update: {},
      create: {
        name: "Satuan Polisi Pamong Praja",
        code: "SATPOL",
        tiketPrefix: "SATPOL",
        description: "Penegakan Perda dan linmas",
        icon: "shield",
        color: "#EF4444",
        sortOrder: 5,
      },
    }),
    prisma.opd.upsert({
      where: { code: "SOSIAL" },
      update: {},
      create: {
        name: "Dinas Sosial",
        code: "SOSIAL",
        tiketPrefix: "SOSIAL",
        description: "Pengelola kesejahteraan sosial",
        icon: "hand-heart",
        color: "#EC4899",
        sortOrder: 6,
      },
    }),
  ])
  console.log(`✅ ${opds.length} OPDs created`)

  // 3. Kecamatan
  const kecamatan = await prisma.kecamatan.upsert({
    where: { code: "KEC_LEBAK" },
    update: {},
    create: {
      name: "Kecamatan Lebak",
      code: "KEC_LEBAK",
    },
  })
  console.log("✅ Kecamatan created:", kecamatan.name)

  // 4. Desa
  const desa1 = await prisma.desa.upsert({
    where: { code: "DS_LEBAK_1" },
    update: {},
    create: {
      name: "Desa Lebak Satu",
      code: "DS_LEBAK_1",
      kecamatanId: kecamatan.id,
    },
  })
  const desa2 = await prisma.desa.upsert({
    where: { code: "DS_LEBAK_2" },
    update: {},
    create: {
      name: "Desa Lebak Dua",
      code: "DS_LEBAK_2",
      kecamatanId: kecamatan.id,
    },
  })
  console.log("✅ 2 Desa created")

  // 5. Posyandu
  const posyandu1 = await prisma.posyandu.upsert({
    where: { code: "POS_LEBAK_1" },
    update: {},
    create: {
      name: "Posyandu Mawar",
      code: "POS_LEBAK_1",
      desaId: desa1.id,
    },
  })
  const posyandu2 = await prisma.posyandu.upsert({
    where: { code: "POS_LEBAK_2" },
    update: {},
    create: {
      name: "Posyandu Melati",
      code: "POS_LEBAK_2",
      desaId: desa2.id,
    },
  })
  console.log("✅ 2 Posyandu created")

  // 6. Users
  const kaderPassword = await bcrypt.hash("kader123", 12)
  const kader = await prisma.user.upsert({
    where: { email: "kader@example.com" },
    update: {},
    create: {
      name: "Siti Aminah",
      email: "kader@example.com",
      password: kaderPassword,
      role: "KADER",
      posyanduId: posyandu1.id,
    },
  })

  const petugasDesaPassword = await bcrypt.hash("petugas123", 12)
  const petugasDesa = await prisma.user.upsert({
    where: { email: "petugas@example.com" },
    update: {},
    create: {
      name: "Ahmad Fauzi",
      email: "petugas@example.com",
      password: petugasDesaPassword,
      role: "PETUGAS_DESA",
      desaId: desa1.id,
    },
  })

  const petugasKecPassword = await bcrypt.hash("kecamatan123", 12)
  const petugasKec = await prisma.user.upsert({
    where: { email: "kecamatan@example.com" },
    update: {},
    create: {
      name: "Budi Santoso",
      email: "kecamatan@example.com",
      password: petugasKecPassword,
      role: "PETUGAS_KECAMATAN",
      kecamatanId: kecamatan.id,
    },
  })

  const opdKesehatan = opds.find((o) => o.code === "KES")!
  const petugasOpdPassword = await bcrypt.hash("opd123", 12)
  const petugasOpd = await prisma.user.upsert({
    where: { email: "opd@example.com" },
    update: {},
    create: {
      name: "Dewi Kusuma",
      email: "opd@example.com",
      password: petugasOpdPassword,
      role: "PETUGAS_OPD",
      opdId: opdKesehatan.id,
    },
  })

  console.log("✅ 4 users created (kader, petugas desa, petugas kecamatan, petugas OPD)")

  // 7. Contoh Jenis Layanan per OPD
  await prisma.layananJenis.upsert({
    where: { id: "layanan-kes-1" },
    update: {},
    create: {
      id: "layanan-kes-1",
      name: "Pengaduan Layanan Kesehatan",
      description: "Pengaduan terkait layanan kesehatan di fasilitas kesehatan",
      opdId: opdKesehatan.id,
      sortOrder: 1,
    },
  })
  await prisma.layananJenis.upsert({
    where: { id: "layanan-kes-2" },
    update: {},
    create: {
      id: "layanan-kes-2",
      name: "Layanan Imunisasi",
      description: "Permohonan layanan imunisasi",
      opdId: opdKesehatan.id,
      sortOrder: 2,
    },
  })

  const opdPend = opds.find((o) => o.code === "PEND")!
  await prisma.layananJenis.upsert({
    where: { id: "layanan-pend-1" },
    update: {},
    create: {
      id: "layanan-pend-1",
      name: "Pengaduan Pendidikan",
      description: "Pengaduan terkait layanan pendidikan",
      opdId: opdPend.id,
      sortOrder: 1,
    },
  })

  console.log("✅ Sample layanan jenis created")
  console.log("🎉 Seeding complete!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
