import { NextRequest } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidateATSRekap } from "@/lib/cache"

const updateSchema = z.object({
  namaAnak: z.string().min(1).optional(),
  nik: z.string().max(16).regex(/^\d*$/).optional().nullable(),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]).optional(),
  tempatLahir: z.string().min(1).optional(),
  tanggalLahir: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date" }).optional(),
  alamat: z.string().min(1).optional(),
  rtRw: z.string().optional().nullable(),
  namaOrangTua: z.string().min(1).optional(),
  pekerjaanOrangTua: z.string().optional().nullable(),
  noHpOrangTua: z.string().optional().nullable(),
  pendidikanTerakhir: z.enum(["Tidak Sekolah", "PAUD/TK", "SD/MI", "SMP/MTs", "SMA/MA/SMK"]).optional(),
  kelasTerakhir: z.string().optional().nullable(),
  statusSekolah: z.enum(["Putus Sekolah", "Tidak Pernah Sekolah", "Lulus Tidak Melanjutkan"]).optional(),
  alasanTidakSekolah: z.enum(["Ekonomi", "Jarak Sekolah Jauh", "Bekerja/Membantu Orang Tua", "Menikah Dini", "Disabilitas", "Tidak Ada Motivasi", "Lainnya"]).optional(),
  alasanLainnya: z.string().optional().nullable(),
  tahunPutusSekolah: z.number().int().min(2015).max(new Date().getFullYear()).optional().nullable(),
  keinginanSekolah: z.enum(["Ya", "Tidak", "Ragu-ragu"]).optional(),
  programDibutuhkan: z.array(z.string()).optional().nullable(),
  programLainnya: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
})

async function getOwnedRecord(id: string, userId: string) {
  return prisma.anakTidakSekolah.findFirst({
    where: { id, posyanduUserId: userId, isActive: true },
  })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { id } = await params
    const record = await getOwnedRecord(id, user.id)
    if (!record) return err("Data tidak ditemukan", 404)
    return ok(record)
  } catch (e) {
    console.error("[GET /api/ats/:id]", e)
    return err("Gagal mengambil data", 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { id } = await params
    const existing = await getOwnedRecord(id, user.id)
    if (!existing) return err("Data tidak ditemukan", 404)

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid", 422)

    const d = parsed.data
    const statusSekolah = d.statusSekolah ?? existing.statusSekolah
    const alasanTidakSekolah = d.alasanTidakSekolah ?? existing.alasanTidakSekolah

    const updated = await prisma.anakTidakSekolah.update({
      where: { id },
      data: {
        ...d,
        tanggalLahir: d.tanggalLahir ? new Date(d.tanggalLahir) : undefined,
        kelasTerakhir: statusSekolah === "Tidak Pernah Sekolah" ? null : d.kelasTerakhir,
        alasanLainnya: alasanTidakSekolah === "Lainnya" ? d.alasanLainnya : null,
        tahunPutusSekolah: statusSekolah === "Tidak Pernah Sekolah" ? null : d.tahunPutusSekolah,
        programDibutuhkan: d.programDibutuhkan === null ? Prisma.DbNull : d.programDibutuhkan,
        programLainnya: d.programDibutuhkan?.includes("Lainnya") ? d.programLainnya : null,
      },
    })

    invalidateATSRekap().catch(() => {})
    return ok(updated, "Data ATS berhasil diperbarui")
  } catch (e) {
    console.error("[PATCH /api/ats/:id]", e)
    return err("Gagal memperbarui data", 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { id } = await params
    const existing = await getOwnedRecord(id, user.id)
    if (!existing) return err("Data tidak ditemukan", 404)

    await prisma.anakTidakSekolah.update({ where: { id }, data: { isActive: false } })

    invalidateATSRekap().catch(() => {})
    return ok(null, "Data ATS berhasil dihapus")
  } catch (e) {
    console.error("[DELETE /api/ats/:id]", e)
    return err("Gagal menghapus data", 500)
  }
}
