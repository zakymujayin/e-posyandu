import { NextRequest } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidateATSRekap } from "@/lib/cache"

const createSchema = z.object({
  namaAnak: z.string().min(1),
  nik: z.string().max(16).regex(/^\d*$/).optional().nullable(),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]),
  tempatLahir: z.string().min(1),
  tanggalLahir: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date" }),
  alamat: z.string().min(1),
  rtRw: z.string().optional().nullable(),
  namaOrangTua: z.string().min(1),
  pekerjaanOrangTua: z.string().optional().nullable(),
  noHpOrangTua: z.string().optional().nullable(),
  pendidikanTerakhir: z.enum(["Tidak Sekolah", "PAUD/TK", "SD/MI", "SMP/MTs", "SMA/MA/SMK"]),
  kelasTerakhir: z.string().optional().nullable(),
  statusSekolah: z.enum(["Putus Sekolah", "Tidak Pernah Sekolah", "Lulus Tidak Melanjutkan"]),
  alasanTidakSekolah: z.enum(["Ekonomi", "Jarak Sekolah Jauh", "Bekerja/Membantu Orang Tua", "Menikah Dini", "Disabilitas", "Tidak Ada Motivasi", "Lainnya"]),
  alasanLainnya: z.string().optional().nullable(),
  tahunPutusSekolah: z.number().int().min(2015).max(new Date().getFullYear()).optional().nullable(),
  keinginanSekolah: z.enum(["Ya", "Tidak", "Ragu-ragu"]),
  programDibutuhkan: z.array(z.string()).optional().nullable(),
  programLainnya: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
}).refine(
  (d) => d.alasanTidakSekolah !== "Lainnya" || (d.alasanLainnya && d.alasanLainnya.length > 0),
  { message: "Alasan lainnya wajib diisi", path: ["alasanLainnya"] }
).refine(
  (d) => !(d.programDibutuhkan?.includes("Lainnya")) || (d.programLainnya && d.programLainnya.length > 0),
  { message: "Program lainnya wajib diisi", path: ["programLainnya"] }
)

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const statusSekolah = searchParams.get("statusSekolah") ?? ""
    const pendidikanTerakhir = searchParams.get("pendidikanTerakhir") ?? ""
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = 10

    const userWithPosyandu = await prisma.user.findUnique({
      where: { id: user.id },
      select: { posyanduId: true },
    })
    if (!userWithPosyandu?.posyanduId) return err("Posyandu tidak ditemukan", 404)

    const where = {
      posyanduId: userWithPosyandu.posyanduId,
      isActive: true,
      ...(search ? { namaAnak: { contains: search, mode: "insensitive" as const } } : {}),
      ...(statusSekolah ? { statusSekolah } : {}),
      ...(pendidikanTerakhir ? { pendidikanTerakhir } : {}),
    }

    const [total, records] = await Promise.all([
      prisma.anakTidakSekolah.count({ where }),
      prisma.anakTidakSekolah.findMany({
        where,
        orderBy: { namaAnak: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return ok({ data: records, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  } catch (e) {
    console.error("[GET /api/ats]", e)
    return err("Gagal mengambil data ATS", 500)
  }
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid", 422)

    const userWithPosyandu = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        posyanduId: true,
        posyandu: { select: { desaId: true, desa: { select: { kecamatanId: true } } } },
      },
    })
    if (!userWithPosyandu?.posyanduId) return err("Akun belum terdaftar di posyandu", 400)

    const desaId = userWithPosyandu.posyandu?.desaId
    const kecamatanId = userWithPosyandu.posyandu?.desa?.kecamatanId
    if (!desaId || !kecamatanId) return err("Data wilayah posyandu tidak lengkap", 400)

    const d = parsed.data
    const record = await prisma.anakTidakSekolah.create({
      data: {
        posyanduId: userWithPosyandu.posyanduId,
        posyanduUserId: user.id,
        namaAnak: d.namaAnak,
        nik: d.nik ?? null,
        jenisKelamin: d.jenisKelamin,
        tempatLahir: d.tempatLahir,
        tanggalLahir: new Date(d.tanggalLahir),
        alamat: d.alamat,
        rtRw: d.rtRw ?? null,
        desaId,
        kecamatanId,
        namaOrangTua: d.namaOrangTua,
        pekerjaanOrangTua: d.pekerjaanOrangTua ?? null,
        noHpOrangTua: d.noHpOrangTua ?? null,
        pendidikanTerakhir: d.pendidikanTerakhir,
        kelasTerakhir: d.statusSekolah === "Tidak Pernah Sekolah" ? null : (d.kelasTerakhir ?? null),
        statusSekolah: d.statusSekolah,
        alasanTidakSekolah: d.alasanTidakSekolah,
        alasanLainnya: d.alasanTidakSekolah === "Lainnya" ? (d.alasanLainnya ?? null) : null,
        tahunPutusSekolah: d.statusSekolah === "Tidak Pernah Sekolah" ? null : (d.tahunPutusSekolah ?? null),
        keinginanSekolah: d.keinginanSekolah,
        programDibutuhkan: d.programDibutuhkan ?? Prisma.DbNull,
        programLainnya: d.programDibutuhkan?.includes("Lainnya") ? (d.programLainnya ?? null) : null,
        keterangan: d.keterangan ?? null,
      },
    })

    invalidateATSRekap().catch(() => {})
    return ok(record, "Data ATS berhasil disimpan")
  } catch (e) {
    console.error("[POST /api/ats]", e)
    return err("Gagal menyimpan data ATS", 500)
  }
}
