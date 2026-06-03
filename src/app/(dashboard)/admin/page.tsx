import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { HeroWelcome } from "@/components/shared/hero-welcome"
import { StatCard } from "@/components/shared/stat-card"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { MESSAGES, type PengajuanStatus } from "@/lib/messages"
import { ClipboardList, AlertTriangle, FileSpreadsheet, Hourglass, CheckCircle2, XCircle } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { SectionTitle, MutedText, FormLabel } from "@/components/ui/typography"

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const filterStatus = params.status ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const limit = 15

  const [total, menungguVerifikasi, dalamProses, menungguApproval, selesai, ditolak] = await Promise.all([
    prisma.pengajuan.count(),
    prisma.pengajuan.count({ where: { status: "MENUNGGU_VERIFIKASI" } }),
    prisma.pengajuan.count({ where: { status: "DALAM_PROSES_OPD" } }),
    prisma.pengajuan.count({ where: { status: "MENUNGGU_APPROVAL_DPMD" } }),
    prisma.pengajuan.count({ where: { status: "SELESAI" } }),
    prisma.pengajuan.count({ where: { status: { in: ["DITOLAK_DESA", "DITOLAK_OPD"] } } }),
  ])

  const alertItems = await prisma.pengajuan.findMany({
    where: { status: "MENUNGGU_APPROVAL_DPMD" },
    orderBy: { submittedAt: "asc" },
    take: 5,
    select: { id: true, tiketNumber: true, opd: { select: { name: true } }, submittedAt: true },
  })

  const where = filterStatus ? { status: filterStatus } : {}
  const [pengajuans, totalFiltered] = await Promise.all([
    prisma.pengajuan.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        opd: { select: { name: true } },
        layananJenis: { select: { name: true, isKecamatan: true } },
        desa: { select: { name: true } },
      },
    }),
    prisma.pengajuan.count({ where }),
  ])

  const totalPages = Math.ceil(totalFiltered / limit)

  const summaryCards = [
    { label: "Total Pengajuan", value: total, icon: ClipboardList, color: "primary" as const, desc: "Seluruh berkas masuk" },
    { label: "Menunggu Verifikasi", value: menungguVerifikasi, icon: Hourglass, color: "info" as const, desc: "Menunggu tinjauan desa" },
    { label: "Menunggu Approval", value: menungguApproval, icon: AlertTriangle, color: "warning" as const, desc: "Perlu persetujuan DPMD", urgent: menungguApproval > 0 },
    { label: "Dalam Proses OPD", value: dalamProses, icon: FileSpreadsheet, color: "accent" as const, desc: "Sedang diproses dinas" },
    { label: "Selesai", value: selesai, icon: CheckCircle2, color: "secondary" as const, desc: "Berkas selesai diproses" },
    { label: "Ditolak", value: ditolak, icon: XCircle, color: "destructive" as const, desc: "Berkas ditolak sistem" },
  ]

  const STATUS_OPTIONS = [
    { value: "", label: "Semua Status" },
    { value: "MENUNGGU_VERIFIKASI", label: "Menunggu Verifikasi" },
    { value: "DALAM_PROSES_OPD", label: "Dalam Proses OPD" },
    { value: "MENUNGGU_APPROVAL_DPMD", label: "Menunggu Approval DPMD" },
    { value: "SELESAI", label: "Selesai" },
    { value: "DITOLAK_DESA", label: "Ditolak Desa" },
    { value: "DITOLAK_OPD", label: "Ditolak OPD" },
  ]

  return (
    <PageContainer className="space-y-6">
      <HeroWelcome
        userName={session.user.name || "Administrator"}
        roleLabel={MESSAGES.roles[session.user.role]}
        description="Pantau dan verifikasi pengajuan posyandu tingkat kabupaten."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((s) => (
          <StatCard
            key={s.label}
            title={s.label}
            value={s.value}
            icon={s.icon}
            colorVariant={s.color}
            description={s.desc}
            className={s.urgent ? "border-amber-500/30 bg-amber-500/5 shadow-sm" : ""}
          />
        ))}
      </div>

      {/* Alert — Perlu Approval */}
      {alertItems.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
            <h2 className="font-bold text-amber-800 text-sm md:text-base">
              Terdapat {menungguApproval} pengajuan menunggu approval Anda
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {alertItems.map((p) => (
              <Link
                key={p.id}
                href={`/admin/pengajuan/${p.id}`}
                className="flex items-center justify-between text-xs md:text-sm bg-card border border-border/60 rounded-lg px-4 py-3 hover:bg-muted/40 hover:border-primary/40 transition-all font-semibold"
              >
                <span className="font-mono text-primary">{p.tiketNumber}</span>
                <span className="truncate max-w-[150px]">{p.opd?.name ?? "Layanan Desa"}</span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filter + Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary rounded-full"></span>
            <SectionTitle>Semua Berkas Pengajuan</SectionTitle>
          </div>
          <form className="flex items-end gap-2 w-full sm:w-auto">
            <div className="flex flex-col gap-1.5">
              <FormLabel htmlFor="admin-filter-status" className="sr-only">Filter Status</FormLabel>
              <select
                id="admin-filter-status"
                name="status"
                defaultValue={filterStatus}
                className="min-h-[42px] rounded-lg border border-border bg-background px-3 text-xs md:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-muted/40 transition-all cursor-pointer w-full sm:w-48"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" className="font-bold text-xs md:text-sm rounded-md">
              Filter
            </Button>
          </form>
        </div>

        {pengajuans.length === 0 ? (
          <EmptyState
            title="Tidak ada berkas pengajuan"
            description="Belum ada berkas pengajuan yang sesuai dengan status filter saat ini."
          />
        ) : (
          <>
            <DataTable
              columns={["No. Tiket", "Pelapor", "Tujuan Instansi", "Desa", "Status", "Tanggal", "Aksi"]}
              dataLength={pengajuans.length}
            >
              {pengajuans.map((p) => (
                <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                  <TableCell className="px-4 py-3.5 font-mono text-xs md:text-sm font-semibold">
                  <Link href={`/admin/pengajuan/${p.id}`} className="text-primary hover:underline transition-colors">
                    {p.tiketNumber}
                  </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-xs md:text-sm text-foreground font-semibold">
                    {p.namaPelapor}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-xs md:text-sm text-muted-foreground font-medium">
                    {p.opd?.name ?? (p.layananJenis?.isKecamatan ? "Kecamatan" : "Desa")}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-xs md:text-sm text-muted-foreground font-medium">
                    {p.desa.name}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <StatusBadge status={p.status as PengajuanStatus} />
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-xs md:text-sm font-semibold text-muted-foreground">
                    {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Button variant="outline" size="xs" asChild className="font-semibold text-xs md:text-sm">
                      <Link href={`/admin/pengajuan/${p.id}`} className="font-bold">Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>

            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
                <MutedText>Halaman {page} dari {totalPages}</MutedText>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Button variant="outline" size="sm" asChild className="font-semibold text-xs md:text-sm px-3">
                      <Link href={`?status=${filterStatus}&page=${page - 1}`}>&larr; Prev</Link>
                    </Button>
                  )}
                  {page < totalPages && (
                    <Button variant="outline" size="sm" asChild className="font-semibold text-xs md:text-sm px-3">
                      <Link href={`?status=${filterStatus}&page=${page + 1}`}>Next &rarr;</Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  )
}