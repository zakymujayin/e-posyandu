import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidateRekap } from "@/lib/cache"

const createSchema = z.object({
  bulan: z.number().int().min(1).max(12),
  tahun: z.number().int().min(2000),
  beratBadan: z.number().positive().optional().nullable(),
  tinggiBadan: z.number().positive().optional().nullable(),
  lingkarKepala: z.number().positive().optional().nullable(),
  statusGizi: z.string().optional().nullable(),
  keluhanKondisi: z.string().optional().nullable(),
  tindakan: z.string().optional().nullable(),
  namaKader: z.string().optional().nullable(),
})

async function checkBalitaAccess(balitaId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { posyanduId: true } })
  if (!user?.posyanduId) return false
  const balita = await prisma.balita.findFirst({ where: { id: balitaId, posyanduId: user.posyanduId } })
  return !!balita
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { id } = await params
    if (!(await checkBalitaAccess(id, user.id))) {
      return err("Data tidak ditemukan", 404)
    }

    const { searchParams } = new URL(req.url)
    const tahun = searchParams.get("tahun") ? parseInt(searchParams.get("tahun")!) : new Date().getFullYear()

    const penimbangans = await prisma.penimbanganBalita.findMany({
      where: { balitaId: id, tahun },
      orderBy: { bulan: "asc" },
    })

    return ok(penimbangans)
  } catch (e) {
    console.error("[GET /api/balita/[id]/penimbangan]", e)
    return err("Gagal mengambil data penimbangan", 500)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { id } = await params
    if (!(await checkBalitaAccess(id, user.id))) {
      return err("Data tidak ditemukan", 404)
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid", 422)

    const now = new Date()
    if (
      parsed.data.tahun > now.getFullYear() ||
      (parsed.data.tahun === now.getFullYear() && parsed.data.bulan > now.getMonth() + 1)
    ) {
      return err("Tidak dapat mencatat penimbangan di bulan mendatang", 422)
    }

    const existing = await prisma.penimbanganBalita.findUnique({
      where: { balitaId_bulan_tahun: { balitaId: id, bulan: parsed.data.bulan, tahun: parsed.data.tahun } },
    })
    if (existing) {
      return err("Data penimbangan bulan ini sudah ada", 409)
    }

    const penimbangan = await prisma.penimbanganBalita.create({
      data: { ...parsed.data, balitaId: id },
    })

    invalidateRekap(parsed.data.bulan, parsed.data.tahun).catch(() => {})
    return ok(penimbangan, "Data penimbangan berhasil disimpan")
  } catch (e) {
    console.error("[POST /api/balita/[id]/penimbangan]", e)
    return err("Gagal menyimpan data penimbangan", 500)
  }
}
