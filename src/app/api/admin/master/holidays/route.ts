import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function GET() {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const holidays = await prisma.publicHoliday.findMany({
    orderBy: { date: "asc" },
  })
  return ok(holidays)
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  try {
    const body = await req.json()
    const { date, name } = body

    if (!date || !name) return err("Tanggal dan nama hari libur wajib diisi", 400)

    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) return err("Format tanggal tidak valid", 400)

    // normalize ke tengah hari untuk hindari timezone shift
    parsed.setUTCHours(0, 0, 0, 0)

    const exists = await prisma.publicHoliday.findUnique({ where: { date: parsed } })
    if (exists) return err("Tanggal ini sudah terdaftar sebagai hari libur", 409)

    const holiday = await prisma.publicHoliday.create({
      data: { date: parsed, name },
    })

    return ok(holiday)
  } catch {
    return err("Gagal menambahkan hari libur", 500)
  }
}
