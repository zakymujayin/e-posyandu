import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { type Prisma } from "@prisma/client"
import { ClipboardList, CheckCircle2, Clock, XCircle } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { LaporanExport } from "@/components/admin/laporan-export"
import { LaporanCharts } from "@/components/admin/laporan-charts-wrapper"
import { LaporanFilter } from "@/components/admin/laporan-filter"
import { SectionTitle } from "@/components/ui/typography"

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string; opdId?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const params = await searchParams
  const now = new Date()
  const startThisMonth = startOfMonth(now)
  const endThisMonth = endOfMonth(now)
  const startLastMonth = startOfMonth(subMonths(now, 1))
  const endLastMonth = endOfMonth(subMonths(now, 1))

  const where: Prisma.PengajuanWhereInput = {
    ...(params.opdId ? { opdId: params.opdId } : {}),
    ...(params.dari || params.sampai
      ? {
          submittedAt: {
            ...(params.dari ? { gte: new Date(params.dari) } : {}),
            ...(params.sampai ? { lte: new Date(params.sampai + "T23:59:59") } : {}),
          },
        }
      : {}),
  }

  const STATUS_LABELS: Record<string, string> = {
    MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
    DITOLAK_DESA: "Ditolak Desa",
    DALAM_PROSES_OPD: "Dalam Proses OPD",
    DITOLAK_OPD: "Ditolak OPD",
    MENUNGGU_APPROVAL_DPMD: "Menunggu Approval",
    SELESAI: "Selesai",
  }

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
    allOpds,
    monthlyData,
  ] = await Promise.all([
    prisma.pengajuan.count({ where }),
    prisma.pengajuan.count({ where: { ...where, status: "SELESAI" } }),
    prisma.pengajuan.count({ where: { ...where, status: { in: ["DITOLAK_DESA", "DITOLAK_OPD"] } } }),
    prisma.pengajuan.count({ where: { ...where, status: { notIn: ["SELESAI", "DITOLAK_DESA", "DITOLAK_OPD"] } } }),
    prisma.pengajuan.count({ where: { ...where, submittedAt: { gte: startThisMonth, lte: endThisMonth } } }),
    prisma.pengajuan.count({ where: { ...where, submittedAt: { gte: startLastMonth, lte: endLastMonth } } }),
    prisma.pengajuan.groupBy({
      by: ["opdId"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.pengajuan.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.pengajuan.groupBy({
      by: ["layananJenisId"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.opd.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const start = startOfMonth(subMonths(now, 11 - i))
        const end = endOfMonth(subMonths(now, 11 - i))
        return prisma.pengajuan
          .count({ where: { ...where, submittedAt: { gte: start, lte: end } } })
          .then((count) => ({ month: format(start, "MMM", { locale: localeId }), count }))
      })
    ),
  ])

  const opdIds = byOpd.map((r) => r.opdId).filter(Boolean) as string[]
  const layananIds = byLayanan.map((r) => r.layananJenisId).filter(Boolean) as string[]

  const [opdNames, layananNames] = await Promise.all([
    prisma.opd.findMany({ where: { id: { in: opdIds } }, select: { id: true, name: true } }),
    prisma.layananJenis.findMany({ where: { id: { in: layananIds } }, select: { id: true, name: true } }),
  ])

  const opdMap = Object.fromEntries(opdNames.map((o) => [o.id, o.name]))
  const layananMap = Object.fromEntries(layananNames.map((l) => [l.id, l.name]))

  const selesaiPct = totalAll > 0 ? Math.round((totalSelesai / totalAll) * 100) : 0
  const trend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0

  const isFiltered = !!(params.dari || params.sampai || params.opdId)

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Laporan & Statistik"
        description={`Data per ${format(now, "d MMMM yyyy", { locale: localeId })}${isFiltered ? " · filter aktif" : ""}`}
        backHref="/admin"
        actions={<LaporanExport />}
      />

      <LaporanFilter opds={allOpds} current={params} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Pengajuan" value={totalAll} icon={ClipboardList} colorVariant="primary" />
        <StatCard title="Selesai" value={totalSelesai} icon={CheckCircle2} colorVariant="secondary" description={`${selesaiPct}% dari total`} />
        <StatCard title="Sedang Berjalan" value={totalBerjalan} icon={Clock} colorVariant="accent" />
        <StatCard title="Ditolak" value={totalDitolak} icon={XCircle} colorVariant="destructive" />
      </div>

      {/* Monthly Comparison */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-4 bg-primary rounded-full shrink-0" />
          <SectionTitle>Perbandingan Bulanan</SectionTitle>
        </div>
        <div className="flex gap-8">
          <div>
            <p className="text-xs text-muted-foreground">Bulan ini ({format(now, "MMMM", { locale: localeId })})</p>
            <p className="text-3xl font-bold text-foreground mt-1">{thisMonth}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bulan lalu ({format(subMonths(now, 1), "MMMM", { locale: localeId })})</p>
            <p className="text-3xl font-bold text-muted-foreground/70 mt-1">{lastMonth}</p>
          </div>
          {lastMonth > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Tren</p>
              <p className={`text-3xl font-bold mt-1 ${trend >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {trend >= 0 ? "+" : ""}{trend}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <LaporanCharts
        monthlyData={monthlyData}
        byStatus={byStatus.map((r) => ({ status: STATUS_LABELS[r.status] ?? r.status, count: r._count.id }))}
        byOpd={byOpd.map((r) => ({ name: r.opdId ? (opdMap[r.opdId] ?? r.opdId) : "Layanan Desa", count: r._count.id }))}
      />

      {/* By Layanan */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-4 bg-primary rounded-full shrink-0" />
          <SectionTitle>Layanan Paling Banyak Diajukan</SectionTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-[12px] font-extrabold text-muted-foreground/90 uppercase tracking-widest">Layanan</th>
                <th className="px-4 py-3 text-right text-[12px] font-extrabold text-muted-foreground/90 uppercase tracking-widest">Jumlah</th>
                <th className="px-4 py-3 text-right text-[12px] font-extrabold text-muted-foreground/90 uppercase tracking-widest">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byLayanan.map((row) => (
                <tr key={row.layananJenisId ?? "pengaduan"} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">{row.layananJenisId ? (layananMap[row.layananJenisId] ?? row.layananJenisId) : "Pengaduan"}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold">{row._count.id}</td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
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
