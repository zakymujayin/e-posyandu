import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"
import { rateLimit } from "@/lib/cache"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

const STATUS_LABELS: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  DALAM_PROSES_OPD: "Dalam Proses OPD",
  MENUNGGU_APPROVAL_DPMD: "Menunggu Approval",
  SELESAI: "Selesai",
  DITOLAK_DESA: "Ditolak Desa",
  DITOLAK_OPD: "Ditolak OPD",
}

export async function GET(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const allowed = await rateLimit(`rl:export:csv:${user.id}`, 3, 300)
  if (!allowed) {
    return new Response(
      JSON.stringify({ success: false, error: "Terlalu banyak permintaan. Coba lagi dalam 5 menit." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  const { searchParams } = new URL(req.url)
  const dari = searchParams.get("dari")
  const sampai = searchParams.get("sampai")
  const opdId = searchParams.get("opdId")

  if (!dari || !sampai) {
    return new Response(
      JSON.stringify({ success: false, error: "Parameter dari dan sampai wajib diisi." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
  const dariDate = new Date(dari)
  const sampaiDate = new Date(sampai)
  const diffDays = Math.ceil((sampaiDate.getTime() - dariDate.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays > 31) {
    return new Response(
      JSON.stringify({ success: false, error: "Rentang tanggal maksimal 31 hari." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const where: Record<string, unknown> = {}
  if (opdId) where.opdId = opdId
  if (dari || sampai) {
    where.submittedAt = {
      ...(dari ? { gte: new Date(dari) } : {}),
      ...(sampai ? { lte: new Date(sampai + "T23:59:59") } : {}),
    }
  }

  const pengajuans = await prisma.pengajuan.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: {
      opd: { select: { name: true } },
      layananJenis: { select: { name: true, isKecamatan: true } },
      desa: { select: { name: true } },
      posyanduUser: { select: { name: true } },
    },
    take: 10000,
  })

  const headers = [
    "No. Tiket", "Tanggal Submit", "Nama Pelapor", "OPD",
    "Jenis Layanan", "Desa", "Posyandu", "Status", "Deadline SOP",
  ]

  const rows = pengajuans.map((p) => [
    p.tiketNumber,
    format(new Date(p.submittedAt), "d MMMM yyyy", { locale: localeId }),
    p.namaPelapor,
    p.opd?.name ?? "Layanan Desa",
    p.layananJenis?.name ?? "Pengaduan",
    p.desa.name,
    p.posyanduUser.name,
    STATUS_LABELS[p.status] ?? p.status,
    format(new Date(p.deadlineAt), "d MMMM yyyy", { locale: localeId }),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => {
      const s = String(cell)
      const escaped = s.replace(/"/g, '""')
      if (/^[=+\-@\t\r]/.test(s)) return `"'${escaped}"`
      return `"${escaped}"`
    }).join(","))
    .join("\n")

  const filename = `laporan-pengajuan-${format(new Date(), "yyyy-MM-dd")}.csv`

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
