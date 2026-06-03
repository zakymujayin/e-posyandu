import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { generateTicketNumber, generateDesaTicketNumber, generateKecamatanTicketNumber } from "@/lib/ticket"
import { calculateDeadline } from "@/lib/working-days"
import { notifyPengajuanBaru } from "@/lib/notifications"
import { sendNewPengajuanEmail } from "@/lib/email"
import { rateLimit } from "@/lib/cache"
import { stripHtml } from "@/lib/sanitize"

const createSchema = z.object({
  opdId: z.string().optional(),
  kategori: z.enum(["PENGADUAN", "PERMOHONAN"]).default("PENGADUAN"),
  layananJenisId: z.string().optional(),
  namaPelapor: z.string().min(1, "Nama pelapor wajib diisi").transform(stripHtml),
  nikPelapor: z.string().optional().transform((v) => v ? stripHtml(v) : v),
  noHpPelapor: z.string().optional().transform((v) => v ? stripHtml(v) : v),
  alamatPelapor: z.string().min(1, "Alamat wajib diisi").transform(stripHtml),
  deskripsi: z.string().min(20, "Deskripsi minimal 20 karakter").transform(stripHtml),
  lokasiLat: z.number().optional().nullable(),
  lokasiLng: z.number().optional().nullable(),
  fieldValues: z.array(z.object({
      formFieldId: z.string(),
      fieldValue: z.string().transform(stripHtml),
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
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  const ENABLE_LAYANAN_FEATURE = false

  try {
    const allowed = await rateLimit(`rl:pengajuan:${user.id}`, 5, 600)
    if (!allowed) return err("Terlalu banyak pengajuan. Coba lagi dalam beberapa menit.", 429)

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Data tidak valid")
    }

    const data = parsed.data

    let isDesa = false
    let isKecamatan = false
    if (data.layananJenisId) {
      const layanan = await prisma.layananJenis.findUnique({
        where: { id: data.layananJenisId },
        select: { isDesa: true, isKecamatan: true },
      })
      isDesa = layanan?.isDesa ?? false
      isKecamatan = layanan?.isKecamatan ?? false
    }

    if (!data.opdId && !data.layananJenisId) {
      isDesa = true
    }

    if (!data.opdId && !isDesa && !isKecamatan && data.kategori !== "PENGADUAN") {
      return err("OPD wajib dipilih untuk permohonan layanan non-desa/non-kecamatan")
    }

    if (ENABLE_LAYANAN_FEATURE && data.kategori === "PERMOHONAN" && !data.layananJenisId) {
      return err("Pilih layanan untuk permohonan")
    }

    // Ambil posyandu dan desa dari user
    const posyanduUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, posyanduId: true, posyandu: { select: { desaId: true, desa: { select: { kecamatanId: true } } } } },
    })

    if (!posyanduUser?.posyanduId || !posyanduUser.posyandu?.desaId) {
      return err("Akun posyandu tidak terdaftar di posyandu")
    }

    const tiketNumber = data.opdId
      ? await generateTicketNumber(data.opdId)
      : isKecamatan
        ? await generateKecamatanTicketNumber(posyanduUser.posyandu!.desa.kecamatanId)
        : await generateDesaTicketNumber(posyanduUser.posyandu.desaId)
    const deadlineAt = await calculateDeadline(new Date(), 7)

    const initialStatus = isKecamatan ? "DALAM_PROSES_KECAMATAN" : "MENUNGGU_VERIFIKASI"

    const pengajuan = await prisma.pengajuan.create({
      data: {
        tiketNumber,
        posyanduUserId: user.id,
        posyanduId: posyanduUser.posyanduId,
        desaId: posyanduUser.posyandu.desaId,
        opdId: data.opdId ?? null,
        kategori: data.kategori,
        layananJenisId: data.layananJenisId ?? null,
        namaPelapor: data.namaPelapor,
        nikPelapor: data.nikPelapor,
        noHpPelapor: data.noHpPelapor,
        alamatPelapor: data.alamatPelapor,
        deskripsi: data.deskripsi,
        lokasiLat: data.lokasiLat ?? null,
        lokasiLng: data.lokasiLng ?? null,
        status: initialStatus,
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
            userRole: "POSYANDU",
            action: "Pengajuan dibuat",
            newStatus: initialStatus,
          },
        },
      },
    })

    if (isKecamatan) {
      const kecamatanId = posyanduUser.posyandu!.desa.kecamatanId
      const petugasKec = await prisma.user.findMany({
        where: { role: "PETUGAS_KECAMATAN", kecamatanId, isActive: true },
        select: { id: true, email: true, name: true },
      })

      const title = "Pengajuan Baru (Kecamatan)"
      const message = `Pengajuan baru ${tiketNumber} menunggu verifikasi kecamatan.`

      await Promise.all(
        petugasKec.map((u) =>
          prisma.notification.create({
            data: { userId: u.id, type: "NEW_SUBMISSION", title, message, pengajuanId: pengajuan.id },
          })
        )
      )

      try {
        const kecamatan = await prisma.kecamatan.findUnique({ where: { id: kecamatanId }, select: { name: true } })
        await Promise.allSettled(
          petugasKec.map((o) => sendNewPengajuanEmail(o.email, o.name, tiketNumber, `${posyanduUser.name} (Kec. ${kecamatan?.name ?? "-"})`))
        )
      } catch (e) { console.error("[email] Failed to notify kecamatan officers:", e) }
    } else {
      await notifyPengajuanBaru(user.id, pengajuan.id, tiketNumber)

      try {
        const officers = await prisma.user.findMany({
          where: { role: "PETUGAS_DESA", desaId: posyanduUser.posyandu!.desaId, isActive: true },
          select: { email: true, name: true },
        })
        await Promise.allSettled(
          officers.map((o) => sendNewPengajuanEmail(o.email, o.name, tiketNumber, posyanduUser.name ?? "Posyandu"))
        )
      } catch (e) { console.error("[email] Failed to notify desa officers:", e) }
    }

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
  if (user.role === "POSYANDU") {
    where.posyanduUserId = user.id
  } else if (user.role === "PETUGAS_DESA") {
    if (!user.desaId) return err("User tidak terdaftar di desa", 400)
    where.desaId = user.desaId
  } else if (user.role === "PETUGAS_KECAMATAN") {
    if (!user.kecamatanId) return err("User tidak terdaftar di kecamatan", 400)
    where.desa = { kecamatanId: user.kecamatanId }
  } else if (user.role === "PETUGAS_OPD") {
    if (!user.opdId) return err("User tidak terdaftar di OPD", 400)
    where.opdId = user.opdId
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
          layananJenis: { select: { name: true, isKecamatan: true } },
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
