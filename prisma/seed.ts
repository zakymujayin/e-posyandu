import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "postgresql://zhev@localhost:5432/e_posyandu" })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // =====================
  // 1. OPD (6 buah)
  // =====================
  const opds = await Promise.all([
    prisma.opd.upsert({
      where: { code: "DINKES" },
      update: {},
      create: {
        id: "00d01909-6206-49ad-81a9-046aec459dc3",
        name: "Dinas Kesehatan",
        code: "DINKES",
        tiketPrefix: "DINKES",
        description: "Layanan kesehatan primer dan preventif.",
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
        description: "Layanan pendidikan anak usia dini berkualitas.",
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
        name: "Dinas Pekerjaan Umum dan Perumahan Rakyat",
        code: "DPUPR",
        tiketPrefix: "DPUPR",
        description: "Layanan air bersih, sanitasi dan lingkungan sehat.",
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
        name: "Dinas Perumahan Rakyat dan Kawasan Permukiman",
        code: "DPERKIM",
        tiketPrefix: "DPERKIM",
        description: "Layanan perumahan layak huni untuk masyarakat.",
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
        description: "Layanan keamanan dan perlindungan masyarakat.",
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
        description: "Layanan kesejahteraan sosial untuk keluarga rentan.",
        icon: "hand-heart",
        color: "#EC4899",
        sortOrder: 6,
      },
    }),
  ])
  console.log(`✅ ${opds.length} OPDs created`)

  const opdKesehatan = opds.find((o) => o.code === "DINKES")!
  const opdPend = opds.find((o) => o.code === "DINDIK")!

  // =====================
  // 2. Kecamatan
  // =====================
  const kecamatan = await prisma.kecamatan.upsert({
    where: { code: "KEC_LEBAK" },
    update: {},
    create: {
      id: "3d59ec39-9819-4638-a69c-a02a5e122af5",
      name: "Kecamatan Rangkasbitung",
      code: "KEC_LEBAK",
    },
  })
  console.log("✅ Kecamatan created:", kecamatan.name)

  // =====================
  // 3. Desa
  // =====================
  const desa1 = await prisma.desa.upsert({
    where: { code: "DS_LEBAK_1" },
    update: {},
    create: {
      id: "4496ad10-e0f7-49c0-8475-0d90901d4d70",
      name: "Nameng",
      code: "DS_LEBAK_1",
      kecamatanId: kecamatan.id,
    },
  })
  const desa2 = await prisma.desa.upsert({
    where: { code: "DS_LEBAK_2" },
    update: {},
    create: {
      id: "826d597a-9e7b-4846-a387-0159054365d4",
      name: "Rangkasbitung Barat",
      code: "DS_LEBAK_2",
      kecamatanId: kecamatan.id,
    },
  })
  console.log("✅ 2 Desa created")

  // =====================
  // 4. Posyandu
  // =====================
  const posyandu1 = await prisma.posyandu.upsert({
    where: { code: "POS_LEBAK_1" },
    update: {},
    create: {
      id: "2c532614-35c9-4dde-92ad-c6a384665c51",
      name: "Posyandu Mawar",
      code: "POS_LEBAK_1",
      desaId: desa1.id,
    },
  })
  const posyandu2 = await prisma.posyandu.upsert({
    where: { code: "POS_LEBAK_2" },
    update: {},
    create: {
      id: "6908ece3-d5d8-454b-aa7c-e958d6994ba9",
      name: "Posyandu Melati",
      code: "POS_LEBAK_2",
      desaId: desa2.id,
    },
  })
  console.log("✅ 2 Posyandu created")

  // =====================
  // 5. Users
  // =====================
  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@dpmd.go.id" },
    update: { username: "admin_dpmd" },
    create: {
      id: "719d7d82-a9b1-4d27-ba4e-c84db0cc158f",
      name: "Rin Rin Fauziah",
      email: "admin@dpmd.go.id",
      username: "admin_dpmd",
      password: adminPassword,
      role: "ADMIN_DPMD",
    },
  })
  console.log("✅ Admin created:", admin.email)

  const kaderPassword = await bcrypt.hash("kader123", 12)
  const kader = await prisma.user.upsert({
    where: { email: "kader@example.com" },
    update: { username: "kader" },
    create: {
      id: "b71ddd56-615a-46b8-8b82-c03b4484f13f",
      name: "Siti Aminah",
      email: "kader@example.com",
      username: "kader",
      password: kaderPassword,
      role: "KADER",
      posyanduId: posyandu1.id,
    },
  })

  const petugasDesaPassword = await bcrypt.hash("petugas123", 12)
  const petugasDesa = await prisma.user.upsert({
    where: { email: "petugas@example.com" },
    update: { username: "petugas_desa" },
    create: {
      id: "d808c564-a474-435f-8ff6-e3f8f1b612da",
      name: "Ahmad Fauzi",
      email: "petugas@example.com",
      username: "petugas_desa",
      password: petugasDesaPassword,
      role: "PETUGAS_DESA",
      desaId: desa1.id,
    },
  })

  const petugasKecPassword = await bcrypt.hash("kecamatan123", 12)
  const petugasKec = await prisma.user.upsert({
    where: { email: "kecamatan@example.com" },
    update: { username: "petugas_kec" },
    create: {
      id: "d4eda4bf-66a7-4bb8-bda4-628672dbf53c",
      name: "Budi Santoso",
      email: "kecamatan@example.com",
      username: "petugas_kec",
      password: petugasKecPassword,
      role: "PETUGAS_KECAMATAN",
      kecamatanId: kecamatan.id,
    },
  })

  const petugasOpdPassword = await bcrypt.hash("opd123", 12)
  const petugasOpd = await prisma.user.upsert({
    where: { email: "opd@example.com" },
    update: { username: "petugas_opd" },
    create: {
      id: "50574e17-ef50-4730-aca6-965d9f2568ca",
      name: "Dewi Kusuma",
      email: "opd@example.com",
      username: "petugas_opd",
      password: petugasOpdPassword,
      role: "PETUGAS_OPD",
      opdId: opdKesehatan.id,
    },
  })

  console.log("✅ 5 users created (admin, kader, petugas desa, petugas kec, petugas OPD)")

  // =====================
  // 6. Layanan Jenis
  // =====================
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
  console.log("✅ 3 layanan jenis created")

  // =====================
  // 7. Tiket Counters
  // =====================
  for (const opd of opds) {
    await prisma.tiketCounter.upsert({
      where: { opdId_year: { opdId: opd.id, year: 2026 } },
      update: {},
      create: {
        opdId: opd.id,
        year: 2026,
        lastSequence: 0,
      },
    })
  }
  console.log("✅ 6 tiket counters created")

  // =====================
  // 8. Sample Pengajuan — DINKES
  // =====================
  const tglKes = new Date("2026-05-22T11:44:44.622Z")
  const deadlineKes = new Date(tglKes.getTime() + 10 * 24 * 60 * 60 * 1000)

  const pengajuan1 = await prisma.pengajuan.upsert({
    where: { tiketNumber: "DINKES-2026-00001" },
    update: {},
    create: {
      id: "dfbd549b-6b24-42f3-aa68-ea60731b0d8f",
      tiketNumber: "DINKES-2026-00001",
      kaderId: kader.id,
      posyanduId: posyandu1.id,
      desaId: desa1.id,
      opdId: opdKesehatan.id,
      layananJenisId: "layanan-kes-2",
      kategori: "PENGADUAN",
      namaPelapor: "Zaky",
      alamatPelapor: "Nameng",
      deskripsi: "Pelayanan Kesehatan kurang",
      status: "MENUNGGU_VERIFIKASI",
      submittedAt: tglKes,
      deadlineAt: deadlineKes,
    },
  })

  await prisma.pengajuanAttachment.upsert({
    where: { id: "cfee6782-de9c-4984-b82f-4fe29c9adb26" },
    update: {},
    create: {
      id: "cfee6782-de9c-4984-b82f-4fe29c9adb26",
      pengajuanId: pengajuan1.id,
      uploadedById: kader.id,
      attachmentContext: "PENGAJUAN",
      attachmentType: "FILE",
      filePath: "/uploads/Screenshot from 2026-05-22 18-06-51-1779450278075.png",
      fileName: "Screenshot from 2026-05-22 18-06-51.png",
      fileSize: 48243,
      mimeType: "image/png",
    },
  })

  await prisma.activityLog.upsert({
    where: { id: "1400113b-1229-4c99-bb92-13644f6a4700" },
    update: {},
    create: {
      id: "1400113b-1229-4c99-bb92-13644f6a4700",
      pengajuanId: pengajuan1.id,
      userId: kader.id,
      userRole: "KADER",
      action: "Pengajuan dibuat",
      newStatus: "MENUNGGU_VERIFIKASI",
      createdAt: tglKes,
    },
  })

  await prisma.notification.upsert({
    where: { id: "4366c0da-43fd-49a9-b536-3412aa1a9db7" },
    update: {},
    create: {
      id: "4366c0da-43fd-49a9-b536-3412aa1a9db7",
      userId: petugasDesa.id,
      pengajuanId: pengajuan1.id,
      type: "NEW_SUBMISSION",
      title: "Pengajuan Baru",
      message: "Pengajuan baru DINKES-2026-00001 menunggu verifikasi.",
      isRead: true,
      readAt: new Date("2026-05-22T12:17:36.195Z"),
      createdAt: tglKes,
    },
  })

  // Update tiket counter
  await prisma.tiketCounter.update({
    where: { opdId_year: { opdId: opdKesehatan.id, year: 2026 } },
    data: { lastSequence: 1 },
  })

  console.log("✅ Sample pengajuan DINKES-2026-00001 created")

  // =====================
  // 9. Sample Pengajuan — DINDIK
  // =====================
  const tglPend = new Date("2026-05-22T12:20:27.308Z")
  const deadlinePend = new Date(tglPend.getTime() + 10 * 24 * 60 * 60 * 1000)

  const pengajuan2 = await prisma.pengajuan.upsert({
    where: { tiketNumber: "DINDIK-2026-00001" },
    update: {},
    create: {
      id: "7e4f51a1-7808-482e-9aab-983c4eff7a9c",
      tiketNumber: "DINDIK-2026-00001",
      kaderId: kader.id,
      posyanduId: posyandu1.id,
      desaId: desa1.id,
      opdId: opdPend.id,
      layananJenisId: "layanan-pend-1",
      kategori: "PENGADUAN",
      namaPelapor: "Rin Rin",
      alamatPelapor: "Nameng",
      deskripsi: "Infrastruktur sekolah kurang",
      status: "MENUNGGU_VERIFIKASI",
      submittedAt: tglPend,
      deadlineAt: deadlinePend,
    },
  })

  await prisma.pengajuanAttachment.upsert({
    where: { id: "9780e394-36bb-4df7-80d7-c7c4cfd48cbe" },
    update: {},
    create: {
      id: "9780e394-36bb-4df7-80d7-c7c4cfd48cbe",
      pengajuanId: pengajuan2.id,
      uploadedById: kader.id,
      attachmentContext: "PENGAJUAN",
      attachmentType: "FILE",
      filePath: "/uploads/Screenshot 2026-05-22 at 19-18-56 E-Posyandu — DPMD Kabupaten Lebak-1779452423941.png",
      fileName: "Screenshot 2026-05-22 at 19-18-56 E-Posyandu — DPMD Kabupaten Lebak.png",
      fileSize: 396942,
      mimeType: "image/png",
    },
  })

  await prisma.activityLog.upsert({
    where: { id: "899eb956-50fa-4621-9bc0-739e99f7856a" },
    update: {},
    create: {
      id: "899eb956-50fa-4621-9bc0-739e99f7856a",
      pengajuanId: pengajuan2.id,
      userId: kader.id,
      userRole: "KADER",
      action: "Pengajuan dibuat",
      newStatus: "MENUNGGU_VERIFIKASI",
      createdAt: tglPend,
    },
  })

  await prisma.notification.upsert({
    where: { id: "756067a6-0f56-419b-9cde-d4f83839b1ab" },
    update: {},
    create: {
      id: "756067a6-0f56-419b-9cde-d4f83839b1ab",
      userId: petugasDesa.id,
      pengajuanId: pengajuan2.id,
      type: "NEW_SUBMISSION",
      title: "Pengajuan Baru",
      message: "Pengajuan baru DINDIK-2026-00001 menunggu verifikasi.",
      isRead: true,
      readAt: new Date("2026-05-23T05:03:09.447Z"),
      createdAt: tglPend,
    },
  })

  await prisma.tiketCounter.update({
    where: { opdId_year: { opdId: opdPend.id, year: 2026 } },
    data: { lastSequence: 1 },
  })

  console.log("✅ Sample pengajuan DINDIK-2026-00001 created")

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
