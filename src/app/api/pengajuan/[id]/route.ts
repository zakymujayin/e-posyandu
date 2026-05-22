import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth()
  if (!user) return response!

  const { id } = await params

  try {
    const pengajuan = await prisma.pengajuan.findUnique({
      where: { id },
      include: {
        opd: { select: { id: true, name: true, color: true, icon: true } },
        layananJenis: { select: { id: true, name: true } },
        desa: { select: { id: true, name: true } },
        posyandu: { select: { id: true, name: true } },
        kader: { select: { id: true, name: true } },
        fieldValues: {
          include: { formField: { select: { fieldLabel: true, fieldType: true, fieldName: true } } },
        },
        attachments: {
          select: {
            id: true, attachmentContext: true, attachmentType: true,
            filePath: true, fileName: true, fileSize: true, mimeType: true,
            videoUrl: true, videoPlatform: true, createdAt: true,
          },
        },
        verifikasiDesa: {
          select: { status: true, catatan: true, verifiedAt: true, petugasDesa: { select: { name: true } } },
        },
        tindakLanjuts: {
          orderBy: { submittedAt: "desc" },
          include: {
            petugasOpd: { select: { name: true } },
            attachments: true,
          },
        },
        adminActions: {
          orderBy: { createdAt: "desc" },
          include: { admin: { select: { name: true } } },
        },
        activityLogs: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!pengajuan) return err("Pengajuan tidak ditemukan", 404)

    // Scope check: non-admin hanya bisa lihat data yang relevan
    const u = await prisma.user.findUnique({ where: { id: user.id } })
    if (user.role === "KADER" && pengajuan.kaderId !== user.id) return err("Akses ditolak", 403)
    if (user.role === "PETUGAS_DESA" && pengajuan.desaId !== u?.desaId) return err("Akses ditolak", 403)
    if (user.role === "PETUGAS_OPD" && pengajuan.opdId !== u?.opdId) return err("Akses ditolak", 403)
    if (user.role === "PETUGAS_KECAMATAN") {
      const desa = await prisma.desa.findUnique({ where: { id: pengajuan.desaId } })
      if (desa?.kecamatanId !== u?.kecamatanId) return err("Akses ditolak", 403)
    }

    return ok(pengajuan)
  } catch (e) {
    console.error(e)
    return err("Gagal mengambil detail pengajuan", 500)
  }
}
