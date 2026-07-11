import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"
import { rateLimit } from "@/lib/cache"
import { createWorkbook, styleHeaderRow, workbookToBuffer } from "@/lib/excel"
import { format } from "date-fns"

const ROLE_LABELS: Record<string, string> = {
  POSYANDU: "Akun Posyandu",
  PETUGAS_DESA: "Petugas Desa",
  PETUGAS_KECAMATAN: "Petugas Kecamatan",
  PETUGAS_OPD: "Petugas OPD",
  ADMIN_DPMD: "Admin DPMD",
}

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const allowed = await rateLimit(`rl:export:users:${user.id}`, 3, 300)
  if (!allowed) {
    return new Response(
      JSON.stringify({ success: false, error: "Terlalu banyak permintaan. Coba lagi dalam 5 menit." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get("role")
  const isActiveParam = searchParams.get("isActive")

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (isActiveParam === "true") where.isActive = true
  else if (isActiveParam === "false") where.isActive = false

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      username: true,
      role: true,
      desa: { select: { name: true, kecamatan: { select: { name: true } } } },
      kecamatan: { select: { name: true } },
      opd: { select: { name: true } },
      posyandu: { select: { name: true, desa: { select: { name: true, kecamatan: { select: { name: true } } } } } },
    },
    take: 10000,
  })

  const headers = ["Nama", "Username", "Password", "Role", "Wilayah Kerja"]

  const rows = users.map((u) => {
    const wilayah = u.opd?.name
      ?? (u.desa ? `${u.desa.name}, Kec. ${u.desa.kecamatan.name}` : null)
      ?? (u.kecamatan ? `Kec. ${u.kecamatan.name}` : null)
      ?? (u.posyandu ? `${u.posyandu.name}, Desa ${u.posyandu.desa.name}, Kec. ${u.posyandu.desa.kecamatan.name}` : null)
      ?? "Pusat Kabupaten"

    return [
      u.name,
      u.username ?? "",
      "posyandu123",
      ROLE_LABELS[u.role] || u.role,
      wilayah,
    ]
  })

  const wb = createWorkbook()
  const ws = wb.addWorksheet("Daftar Pengguna")

  ws.columns = headers.map((h, i) => ({
    header: h,
    key: String(i),
    width: i === 0 ? 28 : i === 4 ? 36 : 20,
  }))

  styleHeaderRow(ws.getRow(1))

  rows.forEach((row) => {
    const rowObj: Record<string, string> = {}
    row.forEach((cell, i) => { rowObj[String(i)] = cell })
    ws.addRow(rowObj)
  })

  const buffer = await workbookToBuffer(wb)
  const filename = `daftar-pengguna-${format(new Date(), "yyyy-MM-dd")}.xlsx`

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
