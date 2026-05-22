import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { PageContainer } from "@/components/layout/page-container"

export default async function LaporanPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const now = new Date()
  const startThisMonth = startOfMonth(now)
  const endThisMonth = endOfMonth(now)
  const startLastMonth = startOfMonth(subMonths(now, 1))
  const endLastMonth = endOfMonth(subMonths(now, 1))

  const [
    totalAll,
    totalSelesai,
    totalDitolak,
    totalBerjalan,
    thisMonth,
    lastMonth,
    byOpd,
    byStatus,
    byLayanan,
  ] = await Promise.all([
    prisma.pengajuan.count(),
    prisma.pengajuan.count({ where: { status: "SELESAI" } }),
    prisma.pengajuan.count({ where: { status: { in: ["DITOLAK_DESA", "DITOLAK_OPD"] } } }),
    prisma.pengajuan.count({ where: { status: { notIn: ["SELESAI", "DITOLAK_DESA", "DITOLAK_OPD"] } } }),
    prisma.pengajuan.count({ where: { submittedAt: { gte: startThisMonth, lte: endThisMonth } } }),
    prisma.pengajuan.count({ where: { submittedAt: { gte: startLastMonth, lte: endLastMonth } } }),
    prisma.pengajuan.groupBy({
      by: ["opdId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.pengajuan.groupBy({
      by: ["status"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.pengajuan.groupBy({
      by: ["layananJenisId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ])

  const opdIds = byOpd.map((r) => r.opdId)
  const layananIds = byLayanan.map((r) => r.layananJenisId)

  const [opdNames, layananNames] = await Promise.all([
    prisma.opd.findMany({ where: { id: { in: opdIds } }, select: { id: true, name: true } }),
    prisma.layananJenis.findMany({ where: { id: { in: layananIds } }, select: { id: true, name: true } }),
  ])

  const opdMap = Object.fromEntries(opdNames.map((o) => [o.id, o.name]))
  const layananMap = Object.fromEntries(layananNames.map((l) => [l.id, l.name]))

  const selesaiPct = totalAll > 0 ? Math.round((totalSelesai / totalAll) * 100) : 0
  const trend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0

  const STATUS_LABELS: Record<string, string> = {
    MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
    DITOLAK_DESA: "Ditolak Desa",
    DALAM_PROSES_OPD: "Dalam Proses OPD",
    DITOLAK_OPD: "Ditolak OPD",
    MENUNGGU_APPROVAL_DPMD: "Menunggu Approval",
    SELESAI: "Selesai",
  }

  return (
    <PageContainer className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan & Statistik</h1>
        <p className="text-sm text-gray-500">
          Data per {format(now, "d MMMM yyyy", { locale: localeId })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Pengajuan", value: totalAll, color: "text-gray-900" },
          { label: "Selesai", value: totalSelesai, sub: `${selesaiPct}%`, color: "text-green-600" },
          { label: "Sedang Berjalan", value: totalBerjalan, color: "text-blue-600" },
          { label: "Ditolak", value: totalDitolak, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub} dari total</p>}
          </div>
        ))}
      </div>

      {/* Monthly Comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Perbandingan Bulanan</h2>
        <div className="flex gap-8">
          <div>
            <p className="text-xs text-gray-500">Bulan ini ({format(now, "MMMM", { locale: localeId })})</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{thisMonth}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Bulan lalu ({format(subMonths(now, 1), "MMMM", { locale: localeId })})</p>
            <p className="text-3xl font-bold text-gray-400 mt-1">{lastMonth}</p>
          </div>
          {lastMonth > 0 && (
            <div>
              <p className="text-xs text-gray-500">Tren</p>
              <p className={`text-3xl font-bold mt-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                {trend >= 0 ? "+" : ""}{trend}%
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Distribusi Status</h2>
          <div className="space-y-2">
            {byStatus.map((row) => {
              const pct = totalAll > 0 ? Math.round((row._count.id / totalAll) * 100) : 0
              return (
                <div key={row.status}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{STATUS_LABELS[row.status] ?? row.status}</span>
                    <span className="font-medium">{row._count.id} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By OPD */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Pengajuan per OPD</h2>
          <div className="space-y-2">
            {byOpd.map((row) => {
              const pct = totalAll > 0 ? Math.round((row._count.id / totalAll) * 100) : 0
              return (
                <div key={row.opdId}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="truncate max-w-[180px]">{opdMap[row.opdId] ?? row.opdId}</span>
                    <span className="font-medium shrink-0">{row._count.id}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* By Layanan */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Layanan Paling Banyak Diajukan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Layanan</th>
                <th className="px-4 py-2 text-right font-medium">Jumlah</th>
                <th className="px-4 py-2 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byLayanan.map((row) => (
                <tr key={row.layananJenisId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{layananMap[row.layananJenisId] ?? row.layananJenisId}</td>
                  <td className="px-4 py-2 text-right font-medium">{row._count.id}</td>
                  <td className="px-4 py-2 text-right text-gray-500">
                    {totalAll > 0 ? Math.round((row._count.id / totalAll) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  )
}
