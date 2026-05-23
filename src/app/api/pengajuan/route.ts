import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { generateTicketNumber } from "@/lib/ticket"
import { calculateDeadline } from "@/lib/working-days"
import { notifyPengajuanBaru } from "@/lib/notifications"
import { sendNewPengajuanEmail } from "@/lib/email"

const createSchema = z.object({
  opdId: z.string().min(1, "OPD wajib dipilih"),
  kategori: z.enum(["PENGADUAN", "PERMOHONAN"]).default("PENGADUAN"),
  layananJenisId: z.string().optional(),
  namaPelapor: z.string().min(1, "Nama pelapor wajib diisi"),
  nikPelapor: z.string().optional(),
  noHpPelapor: z.string().optional(),
  alamatPelapor: z.string().min(1, "Alamat wajib diisi"),
  deskripsi: z.string().min(20, "Deskripsi minimal 20 karakter"),
  lokasiLat: z.number().optional(),
  lokasiLng: z.number().optional(),
  fieldValues: z.array(z.object({
    formFieldId: z.string(),
    fieldValue: z.string(),
  })).optional().default([]),
  attachments: z.array(z.object({
    attachmentType: z.enum(["FILE", "VIDEO_LINK"]),
    filePath: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
    videoUrl: z.string().optional(),
    videoPlatform: z.string().optional(),
  })).optional().default([]),
})

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(["KADER"])
  if (!user) return response!

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Data tidak valid")
    }

    const data = parsed.data

    if (data.kategori === "PERMOHONAN" && !data.layananJenisId) {
      return err("Pilih layanan untuk permohonan")
    }

    // Ambil posyandu dan desa dari user
    const kader = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, posyanduId: true, posyandu: { select: { desaId: true } } },
    })

    if (!kader?.posyanduId || !kader.posyandu?.desaId) {
      return err("Kader tidak terdaftar di posyandu")
    }

    const tiketNumber = await generateTicketNumber(data.opdId)
    const deadlineAt = await calculateDeadline(new Date(), 7)

    const pengajuan = await prisma.pengajuan.create({
      data: {
        tiketNumber,
        kaderId: user.id,
        posyanduId: kader.posyanduId,
        desaId: kader.posyandu.desaId,
        opdId: data.opdId,
        kategori: data.kategori,
        layananJenisId: data.layananJenisId ?? null,
        namaPelapor: data.namaPelapor,
        nikPelapor: data.nikPelapor,
        noHpPelapor: data.noHpPelapor,
        alamatPelapor: data.alamatPelapor,
        deskripsi: data.deskripsi,
        lokasiLat: data.lokasiLat ?? null,
        lokasiLng: data.lokasiLng ?? null,
        deadlineAt,
        fieldValues: {
          create: data.fieldValues.map((fv) => ({
            formFieldId: fv.formFieldId,
            fieldValue: fv.fieldValue,
          })),
        },
        attachments: {
          create: data.attachments.map((att) => ({
            uploadedById: user.id,
            attachmentContext: "PENGAJUAN",
            attachmentType: att.attachmentType,
            filePath: att.filePath,
            fileName: att.fileName,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            videoUrl: att.videoUrl,
            videoPlatform: att.videoPlatform,
          })),
        },
        activityLogs: {
          create: {
            userId: user.id,
            userRole: "KADER",
            action: "Pengajuan dibuat",
            newStatus: "MENUNGGU_VERIFIKASI",
          },
        },
      },
    })

    await notifyPengajuanBaru(user.id, pengajuan.id, tiketNumber)

    // Send email to Petugas Desa
    try {
      const officers = await prisma.user.findMany({
        where: { role: "PETUGAS_DESA", desaId: kader.posyandu!.desaId, isActive: true },
        select: { email: true, name: true },
      })
      await Promise.allSettled(
        officers.map((o) => sendNewPengajuanEmail(o.email, o.name, tiketNumber, kader.name ?? "Kader"))
      )
    } catch (_) {}

    return ok({ id: pengajuan.id, tiketNumber }, "Pengajuan berhasil dikirim")
  } catch (e) {
    console.error(e)
    return err("Gagal membuat pengajuan", 500)
  }
}

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (!user) return response!

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const opdId = searchParams.get("opdId")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 10

  // Scope filter by role
  const where: Record<string, unknown> = {}
  if (user.role === "KADER") {
    where.kaderId = user.id
  } else if (user.role === "PETUGAS_DESA") {
    const u = await prisma.user.findUnique({ where: { id: user.id }, select: { desaId: true } })
    if (!u?.desaId) return err("User tidak terdaftar di desa", 400)
    where.desaId = u.desaId
  } else if (user.role === "PETUGAS_KECAMATAN") {
    const u = await prisma.user.findUnique({ where: { id: user.id }, select: { kecamatanId: true } })
    if (!u?.kecamatanId) return err("User tidak terdaftar di kecamatan", 400)
    where.desa = { kecamatanId: u.kecamatanId }
  } else if (user.role === "PETUGAS_OPD") {
    const u = await prisma.user.findUnique({ where: { id: user.id }, select: { opdId: true } })
    if (!u?.opdId) return err("User tidak terdaftar di OPD", 400)
    where.opdId = u.opdId
  }

  if (status) where.status = status
  if (opdId) where.opdId = opdId

  try {
    const [items, total] = await Promise.all([
      prisma.pengajuan.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          tiketNumber: true,
          namaPelapor: true,
          status: true,
          submittedAt: true,
          deadlineAt: true,
          opd: { select: { name: true, color: true } },
          layananJenis: { select: { name: true } },
          desa: { select: { name: true } },
        },
      }),
      prisma.pengajuan.count({ where }),
    ])

    return ok({ items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    console.error(e)
    return err("Gagal mengambil data pengajuan", 500)
  }
}
