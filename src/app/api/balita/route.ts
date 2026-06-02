import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidateRekap, invalidatePattern } from "@/lib/cache"

const createSchema = z.object({
  namaBalita: z.string().min(1),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]),
  tanggalLahir: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date" }),
  namaOrangTua: z.string().min(1),
  nikOrangTua: z.string().optional().nullable(),
  noHpOrangTua: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  tahunPencatatan: z.number().int().optional(),
  catatanKesehatan: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = 10

    const userWithPosyandu = await prisma.user.findUnique({
      where: { id: user.id },
      select: { posyanduId: true },
    })

    if (!userWithPosyandu?.posyanduId) {
      return err("Posyandu tidak ditemukan", 404)
    }

    const where = {
      posyanduId: userWithPosyandu.posyanduId,
      isActive: true,
      ...(search ? { namaBalita: { contains: search, mode: "insensitive" as const } } : {}),
    }

    const [total, balitas] = await Promise.all([
      prisma.balita.count({ where }),
      prisma.balita.findMany({
        where,
        orderBy: { namaBalita: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          penimbangans: {
            orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
            take: 1,
          },
        },
      }),
    ])

    return ok({ data: balitas, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  } catch (e) {
    console.error("[GET /api/balita]", e)
    return err("Gagal mengambil data balita", 500)
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
      select: { posyanduId: true },
    })
    if (!userWithPosyandu?.posyanduId) {
      return err("Akun posyandu tidak terdaftar di posyandu", 400)
    }

    const balita = await prisma.balita.create({
      data: {
        ...parsed.data,
        tanggalLahir: new Date(parsed.data.tanggalLahir),
        tahunPencatatan: parsed.data.tahunPencatatan ?? new Date().getFullYear(),
        posyanduId: userWithPosyandu.posyanduId,
        posyanduUserId: user.id,
      },
    })

    const now = new Date()
    invalidateRekap(now.getMonth() + 1, now.getFullYear()).catch(() => {})
    invalidatePattern("laporan:balita-statistik*")
    return ok(balita, "Data balita berhasil disimpan")
  } catch (e) {
    console.error("[POST /api/balita]", e)
    return err("Gagal menyimpan data balita", 500)
  }
}
