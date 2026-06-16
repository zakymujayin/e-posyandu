import { prisma } from "@/lib/prisma"
import { ok, err } from "@/lib/api-helpers"
import { rateLimit } from "@/lib/cache"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tiketNumber: string }> }
) {
  const { tiketNumber } = await params

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  const allowed = await rateLimit(`rl:tracking:${ip}`, 20, 60)
  if (!allowed) return err("Terlalu banyak permintaan. Coba lagi nanti.", 429)

  try {
    const pengajuan = await prisma.pengajuan.findUnique({
      where: { tiketNumber },
      select: {
        tiketNumber: true,
        namaPelapor: true,
        status: true,
        submittedAt: true,
        deadlineAt: true,
        kategori: true,
        deskripsi: true,
        opd: { select: { name: true } },
        layananJenis: { select: { name: true, isDesa: true, isKecamatan: true } },
        desa: { select: { name: true } },
        activityLogs: {
          orderBy: { createdAt: "asc" },
          select: {
            action: true,
            oldStatus: true,
            newStatus: true,
            createdAt: true,
            userRole: true,
          },
        },
      },
    })

    if (!pengajuan) return err("Nomor tiket tidak ditemukan", 404)

    return ok(pengajuan)
  } catch (e) {
    console.error(e)
    return err("Gagal mengambil data tiket", 500)
  }
}
