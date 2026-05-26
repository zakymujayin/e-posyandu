import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import type { PengajuanStatus } from "@/lib/messages"
import { PageContainer } from "@/components/layout/page-container"
import { FormLabel, MutedText } from "@/components/ui/typography"
import { ClientFilterForm } from "@/components/shared/client-filter-form"

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "MENUNGGU_VERIFIKASI", label: "Menunggu Verifikasi" },
  { value: "DALAM_PROSES_OPD", label: "Dalam Proses OPD" },
  { value: "MENUNGGU_APPROVAL_DPMD", label: "Menunggu Approval" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DITOLAK_DESA", label: "Ditolak Desa" },
  { value: "DITOLAK_OPD", label: "Ditolak OPD" },
]

export default async function PosyanduRiwayatPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; opdId?: string; dari?: string; sampai?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const status = params.status ?? ""
  const opdId = params.opdId ?? ""
  const dari = params.dari ?? ""
  const sampai = params.sampai ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const limit = 10

  const [opds] = await Promise.all([
    prisma.opd.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ])

  const where: Record<string, unknown> = { posyanduUserId: session.user.id }
  if (status) where.status = status
  if (opdId) where.opdId = opdId
  if (dari || sampai) {
    where.submittedAt = {
      ...(dari ? { gte: new Date(dari) } : {}),
      ...(sampai ? { lte: new Date(sampai + "T23:59:59") } : {}),
    }
  }

  const [pengajuans, total] = await Promise.all([
    prisma.pengajuan.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        opd: { select: { name: true } },
        layananJenis: { select: { name: true } },
      },
    }),
    prisma.pengajuan.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)
  const filterQuery = `status=${status}&opdId=${opdId}&dari=${dari}&sampai=${sampai}`

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Riwayat Pengajuan"
        description="Pantau progres dan status verifikasi dari seluruh usulan yang Anda kirimkan."
        backHref="/posyandu"
      />

      {/* Toolbar Filter */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-xs">
        <ClientFilterForm className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <FormLabel htmlFor="riwayat-status">Status</FormLabel>
            <select
              id="riwayat-status"
              name="status"
              defaultValue={status}
              className="min-h-[42px] rounded-lg border border-border bg-background px-3 text-xs md:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-muted/40 transition-all cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel htmlFor="riwayat-opdId">OPD</FormLabel>
            <select
              id="riwayat-opdId"
              name="opdId"
              defaultValue={opdId}
              className="min-h-[42px] rounded-lg border border-border bg-background px-3 text-xs md:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-muted/40 transition-all cursor-pointer"
            >
              <option value="">Semua OPD</option>
              {opds.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel htmlFor="riwayat-dari">Dari Tanggal</FormLabel>
            <input
              id="riwayat-dari"
              type="date"
              name="dari"
              defaultValue={dari}
              className="min-h-[42px] rounded-lg border border-border bg-background px-3 text-xs md:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-muted/40 transition-all cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel htmlFor="riwayat-sampai">Sampai Tanggal</FormLabel>
            <input
              id="riwayat-sampai"
              type="date"
              name="sampai"
              defaultValue={sampai}
              className="min-h-[42px] rounded-lg border border-border bg-background px-3 text-xs md:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-muted/40 transition-all cursor-pointer"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
            <Button variant="outline" size="sm" className="font-bold text-xs md:text-sm" asChild>
              <Link href="/posyandu/riwayat">Reset Filter</Link>
            </Button>
          </div>
        </ClientFilterForm>
      </div>

      {pengajuans.length === 0 ? (
        <EmptyState
          title="Tidak ada pengajuan ditemukan"
          description="Silakan ubah filter atau buat pengajuan baru di halaman beranda."
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={["No. Tiket", "Nama Pelapor", "OPD", "Status", "Tanggal"]}
            dataLength={pengajuans.length}
          >
            {pengajuans.map((p) => (
              <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                <TableCell className="px-4 py-3.5">
                  <Link href={`/posyandu/riwayat/${p.id}`} className="font-mono text-xs md:text-sm font-semibold text-primary hover:underline">
                    {p.tiketNumber}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm text-foreground font-semibold">
                  {p.namaPelapor}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm text-muted-foreground font-medium">
                  {p.opd?.name ?? "Layanan Desa"}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <StatusBadge status={p.status as PengajuanStatus} />
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm font-semibold text-muted-foreground">
                  {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border border-border rounded-lg p-4">
              <MutedText>Halaman {page} dari {totalPages} ({total} data)</MutedText>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1} className="font-semibold text-xs md:text-sm">
                  {page > 1 ? <Link href={`?${filterQuery}&page=${page - 1}`}>&larr; Sebelumnya</Link> : <span>&larr; Sebelumnya</span>}
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages} className="font-semibold text-xs md:text-sm">
                  {page < totalPages ? <Link href={`?${filterQuery}&page=${page + 1}`}>Selanjutnya &rarr;</Link> : <span>Selanjutnya &rarr;</span>}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  )
}
