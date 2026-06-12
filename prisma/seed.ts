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
  // 2. Kecamatan & Desa — dari seed-wilayah
  // =====================
  const kecamatan = await prisma.kecamatan.findFirst({ where: { name: "Rangkasbitung" } })
  if (!kecamatan) throw new Error("Kecamatan Rangkasbitung tidak ditemukan — pastikan seed-wilayah sudah dijalankan")
  console.log("✅ Kecamatan:", kecamatan.name, "(", kecamatan.code, ")")

  const desa1 = await prisma.desa.findFirst({ where: { name: "Nameng", kecamatanId: kecamatan.id } })
  const desa2 = await prisma.desa.findFirst({ where: { name: "Rangkasbitung Barat", kecamatanId: kecamatan.id } })
  if (!desa1 || !desa2) throw new Error("Desa tidak ditemukan — pastikan seed-wilayah sudah dijalankan")
  console.log("✅ 2 Desa:", desa1.name, ",", desa2.name)

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
  await prisma.posyandu.upsert({
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
      update: { username: "admin_dpmd", name: "Petugas DPMD" },
      create: {
        id: "719d7d82-a9b1-4d27-ba4e-c84db0cc158f",
        name: "Petugas DPMD",
      email: "admin@dpmd.go.id",
      username: "admin_dpmd",
      password: adminPassword,
      role: "ADMIN_DPMD",
    },
  })
  console.log("✅ Admin created:", admin.email)

  const posyanduPassword = await bcrypt.hash("posyandu123", 12)
  const kader = await prisma.user.upsert({
    where: { id: "b71ddd56-615a-46b8-8b82-c03b4484f13f" },
    update: { username: "posyandu-mawar", email: "posyandu-mawar@example.com", name: "Posyandu Mawar" },
    create: {
      id: "b71ddd56-615a-46b8-8b82-c03b4484f13f",
      name: "Posyandu Mawar",
      email: "posyandu-mawar@example.com",
      username: "posyandu-mawar",
      password: posyanduPassword,
      role: "POSYANDU",
      noRegistrasi: "360214-001",
      posyanduId: posyandu1.id,
      desaId: desa1.id,
      kecamatanId: kecamatan.id,
    },
  })

  let userCount = 2

  const petugasDesaPassword = await bcrypt.hash("petugas123", 12)
  const petugasKecPassword = await bcrypt.hash("kecamatan123", 12)
  const petugasOpdPassword = await bcrypt.hash("opd123", 12)

  // Create users for remaining OPDs
  for (const opd of opds) {
    await prisma.user.upsert({
      where: { email: `opd-${opd.code.toLowerCase()}@example.com` },
      update: { name: `Petugas ${opd.name}` },
      create: {
        name: `Petugas ${opd.name}`,
        email: `opd-${opd.code.toLowerCase()}@example.com`,
        username: `opd_${opd.code.toLowerCase()}`,
        password: petugasOpdPassword,
        role: "PETUGAS_OPD",
        opdId: opd.id,
      },
    })
    userCount++
  }

  // Create users for ALL kecamatan
  const allKecamatan = await prisma.kecamatan.findMany()
  for (const kec of allKecamatan) {
    await prisma.user.upsert({
      where: { email: `kec-${kec.code}@example.com` },
      update: { name: `Petugas Kecamatan ${kec.name}` },
      create: {
        name: `Petugas Kecamatan ${kec.name}`,
        email: `kec-${kec.code}@example.com`,
        username: `kec_${kec.code}`,
        password: petugasKecPassword,
        role: "PETUGAS_KECAMATAN",
        kecamatanId: kec.id,
      },
    })
    userCount++
  }

  // Create users for ALL desa
  const allDesa = await prisma.desa.findMany()
  for (const desa of allDesa) {
    await prisma.user.upsert({
      where: { email: `desa-${desa.code}@example.com` },
      update: { name: `Petugas Desa ${desa.name}` },
      create: {
        name: `Petugas Desa ${desa.name}`,
        email: `desa-${desa.code}@example.com`,
        username: `desa_${desa.code}`,
        password: petugasDesaPassword,
        role: "PETUGAS_DESA",
        desaId: desa.id,
      },
    })
    userCount++
  }

  const petugasDesa = await prisma.user.findFirstOrThrow({
    where: { email: "desa-3602140006@example.com" },
  })

  console.log(`✅ ${userCount} users created (1 admin, 1 posyandu, ${opds.length} OPD, ${allKecamatan.length} kecamatan, ${allDesa.length} desa)`)


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
  // 6b. Layanan Desa (SKTM)
  // =====================
  await prisma.layananJenis.upsert({
    where: { id: "layanan-desa-1" },
    update: {},
    create: {
      id: "layanan-desa-1",
      name: "Surat Keterangan Tidak Mampu (SKTM)",
      description: "Penerbitan surat keterangan tidak mampu untuk keperluan administrasi warga (sekolah, berobat, bantuan sosial)",
      isDesa: true,
      sortOrder: 1,
    },
  })
  console.log("✅ 1 layanan desa created")

  // =====================
  // 6c. Layanan Kecamatan
  // =====================
  await prisma.layananJenis.upsert({
    where: { id: "layanan-kec-1" },
    update: {},
    create: {
      id: "layanan-kec-1",
      name: "Surat Keterangan Domisili",
      description: "Penerbitan surat keterangan domisili warga di wilayah kecamatan",
      isKecamatan: true,
      sortOrder: 1,
    },
  })
  console.log("✅ 1 layanan kecamatan created")

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
  // 7b. Desa Tiket Counters
  // =====================
  await prisma.desaTiketCounter.upsert({
    where: { desaId_year: { desaId: desa1.id, year: 2026 } },
    update: {},
    create: { desaId: desa1.id, year: 2026, lastSequence: 0 },
  })
  console.log("✅ 1 desa tiket counter created")

  // =====================
  // 7b-2. Kecamatan Tiket Counters
  // =====================
  await prisma.kecamatanTiketCounter.upsert({
    where: { kecamatanId_year: { kecamatanId: kecamatan.id, year: 2026 } },
    update: {},
    create: { kecamatanId: kecamatan.id, year: 2026, lastSequence: 0 },
  })
  console.log("✅ 1 kecamatan tiket counter created")

  // =====================
  // 7c. No Registrasi Counter
  // =====================
  await prisma.noRegCounter.upsert({
    where: { kecamatanId: kecamatan.id },
    update: {},
    create: { kecamatanId: kecamatan.id, lastSequence: 1 },
  })
  console.log("✅ No registrasi counter created")

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
      posyanduUserId: kader.id,
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
      userRole: "POSYANDU",
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
      posyanduUserId: kader.id,
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
      userRole: "POSYANDU",
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

  // =====================
  // 10. Sample Data Balita — Posyandu Mawar
  // =====================
  const balita1 = await prisma.balita.upsert({
    where: { id: "3f8c2e1a-1001-4000-a001-000000000001" },
    update: {},
    create: {
      id: "3f8c2e1a-1001-4000-a001-000000000001",
      posyanduId: posyandu1.id,
      posyanduUserId: kader.id,
      namaBalita: "Bayu Aji",
      tanggalLahir: new Date("2024-03-10"),
      jenisKelamin: "LAKI_LAKI",
      namaOrangTua: "Siti Nurhaliza",
      nikOrangTua: "3601015203240001",
      noHpOrangTua: "081234567890",
      alamat: "Kp. Cikaret RT 02/01",
      tahunPencatatan: 2026,
      catatanKesehatan: "Imunisasi lengkap, riwayat sehat",
    },
  })

  const balita2 = await prisma.balita.upsert({
    where: { id: "3f8c2e1a-1001-4000-a001-000000000002" },
    update: {},
    create: {
      id: "3f8c2e1a-1001-4000-a001-000000000002",
      posyanduId: posyandu1.id,
      posyanduUserId: kader.id,
      namaBalita: "Sari Dewi",
      tanggalLahir: new Date("2024-09-22"),
      jenisKelamin: "PEREMPUAN",
      namaOrangTua: "Agus Wijaya",
      nikOrangTua: "3601015209240002",
      noHpOrangTua: "081298765432",
      alamat: "Kp. Pasir Jaya RT 03/02",
      tahunPencatatan: 2026,
    },
  })

  const balita3 = await prisma.balita.upsert({
    where: { id: "3f8c2e1a-1001-4000-a001-000000000003" },
    update: {},
    create: {
      id: "3f8c2e1a-1001-4000-a001-000000000003",
      posyanduId: posyandu1.id,
      posyanduUserId: kader.id,
      namaBalita: "Putra Aditya",
      tanggalLahir: new Date("2023-01-15"),
      jenisKelamin: "LAKI_LAKI",
      namaOrangTua: "Dewi Sartika",
      nikOrangTua: "3601015201230003",
      noHpOrangTua: "087812345678",
      alamat: "Kp. Babakan RT 01/01",
      tahunPencatatan: 2026,
      catatanKesehatan: "Riwayat gizi kurang, dalam pemantauan",
    },
  })

  await prisma.balita.upsert({
    where: { id: "3f8c2e1a-1001-4000-a001-000000000004" },
    update: {},
    create: {
      id: "3f8c2e1a-1001-4000-a001-000000000004",
      posyanduId: posyandu1.id,
      posyanduUserId: kader.id,
      namaBalita: "Maya Sari",
      tanggalLahir: new Date("2024-06-05"),
      jenisKelamin: "PEREMPUAN",
      namaOrangTua: "Rudi Hartono",
      nikOrangTua: "3601015206240004",
      noHpOrangTua: "085612345678",
      alamat: "Kp. Sukamaju RT 04/03",
      tahunPencatatan: 2026,
    },
  })
  console.log("✅ 4 balita created")

  // Penimbangan Bulan Ini (Mei 2026) — 3 dari 4 balita
  await prisma.penimbanganBalita.upsert({
    where: { balitaId_bulan_tahun: { balitaId: balita1.id, bulan: 5, tahun: 2026 } },
    update: {},
    create: {
      id: "4a1b2c3d-2001-5000-b001-000000000001",
      balitaId: balita1.id,
      bulan: 5,
      tahun: 2026,
      beratBadan: 11.5,
      tinggiBadan: 85,
      lingkarKepala: 47,
      statusGizi: "NORMAL",
      keluhanKondisi: "Sehat",
      tindakan: "IMD, vitamin A",
      namaKader: "Posyandu Mawar",
    },
  })

  await prisma.penimbanganBalita.upsert({
    where: { balitaId_bulan_tahun: { balitaId: balita2.id, bulan: 5, tahun: 2026 } },
    update: {},
    create: {
      id: "4a1b2c3d-2001-5000-b001-000000000002",
      balitaId: balita2.id,
      bulan: 5,
      tahun: 2026,
      beratBadan: 9.8,
      tinggiBadan: 78,
      lingkarKepala: 45,
      statusGizi: "NORMAL",
      keluhanKondisi: "Sehat",
      tindakan: "Vitamin A",
      namaKader: "Posyandu Mawar",
    },
  })

  await prisma.penimbanganBalita.upsert({
    where: { balitaId_bulan_tahun: { balitaId: balita3.id, bulan: 5, tahun: 2026 } },
    update: {},
    create: {
      id: "4a1b2c3d-2001-5000-b001-000000000003",
      balitaId: balita3.id,
      bulan: 5,
      tahun: 2026,
      beratBadan: 13.2,
      tinggiBadan: 92,
      lingkarKepala: 49,
      statusGizi: "KURANG",
      keluhanKondisi: "Nafsu makan kurang",
      tindakan: "Konseling gizi, PMT",
      namaKader: "Posyandu Mawar",
    },
  })

  // Balita4 (Maya Sari) — tidak ada penimbangan bulan ini (belum ditimbang)
  console.log("✅ 3 penimbangan balita created")

  // Imunisasi — 2 balita
  await prisma.imunisasiBalita.upsert({
    where: { id: "5d6e7f8a-3001-6000-c001-000000000001" },
    update: {},
    create: {
      id: "5d6e7f8a-3001-6000-c001-000000000001",
      balitaId: balita1.id,
      jenisImunisasi: "Polio 4",
      tanggalPemberian: new Date("2026-05-10"),
      usiaAnak: "26 bulan",
      namaPetugas: "Bidan Desi",
      keterangan: "Lengkap",
    },
  })

  await prisma.imunisasiBalita.upsert({
    where: { id: "5d6e7f8a-3001-6000-c001-000000000002" },
    update: {},
    create: {
      id: "5d6e7f8a-3001-6000-c001-000000000002",
      balitaId: balita1.id,
      jenisImunisasi: "DPT-HB-Hib 4",
      tanggalPemberian: new Date("2026-05-10"),
      usiaAnak: "26 bulan",
      namaPetugas: "Bidan Desi",
      keterangan: "Lengkap",
    },
  })

  await prisma.imunisasiBalita.upsert({
    where: { id: "5d6e7f8a-3001-6000-c001-000000000003" },
    update: {},
    create: {
      id: "5d6e7f8a-3001-6000-c001-000000000003",
      balitaId: balita2.id,
      jenisImunisasi: "Campak Rubella 1",
      tanggalPemberian: new Date("2026-04-15"),
      usiaAnak: "19 bulan",
      namaPetugas: "Bidan Desi",
      keterangan: "Tidak ada efek samping",
    },
  })
  console.log("✅ 3 imunisasi balita created")

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
