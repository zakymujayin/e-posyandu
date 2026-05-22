import { prisma } from "@/lib/prisma"
import { ok, err } from "@/lib/api-helpers"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tiketNumber: string }> }
) {
  const { tiketNumber } = await params

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
        layananJenis: { select: { name: true } },
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
