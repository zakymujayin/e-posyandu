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
  { value: "DALAM_PROSES_OPD", label: "Dalam Proses" },
  { value: "MENUNGGU_APPROVAL_DPMD", label: "Menunggu Approval" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DITOLAK_OPD", label: "Ditolak OPD" },
]

export default async function TindakLanjutListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; dari?: string; sampai?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PETUGAS_OPD") redirect("/login")

  const petugasOpd = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { opdId: true },
  })
  if (!petugasOpd?.opdId) redirect("/opd")

  const params = await searchParams
  const status = params.status ?? ""
  const dari = params.dari ?? ""
  const sampai = params.sampai ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const limit = 15

  const where: Record<string, unknown> = { opdId: petugasOpd.opdId }
  if (status) {
    where.status = status
  } else {
    // Default: show only active/relevant statuses for OPD
    where.status = { in: ["DALAM_PROSES_OPD", "MENUNGGU_APPROVAL_DPMD", "SELESAI", "DITOLAK_OPD"] }
  }
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
        layananJenis: { select: { name: true } },
        desa: { select: { name: true } },
        kader: { select: { name: true } },
      },
    }),
    prisma.pengajuan.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)
  const filterQuery = `status=${status}&dari=${dari}&sampai=${sampai}`

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Tindak Lanjut Pengajuan"
        description="Pantau dan proses seluruh pengajuan yang masuk ke OPD Anda."
        backHref="/opd"
      />

      {/* Filter */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-xs">
        <ClientFilterForm className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <FormLabel htmlFor="opd-status">Status</FormLabel>
            <select
              id="opd-status"
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
            <FormLabel htmlFor="opd-dari">Dari Tanggal</FormLabel>
            <input
              id="opd-dari"
              type="date"
              name="dari"
              defaultValue={dari}
              className="min-h-[42px] rounded-lg border border-border bg-background px-3 text-xs md:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-muted/40 transition-all cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel htmlFor="opd-sampai">Sampai Tanggal</FormLabel>
            <input
              id="opd-sampai"
              type="date"
              name="sampai"
              defaultValue={sampai}
              className="min-h-[42px] rounded-lg border border-border bg-background px-3 text-xs md:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-muted/40 transition-all cursor-pointer"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex gap-2 lg:items-end">
            <Button variant="outline" size="sm" className="font-bold text-xs md:text-sm" asChild>
              <Link href="/opd/tindak-lanjut">Reset Filter</Link>
            </Button>
          </div>
        </ClientFilterForm>
      </div>

      {pengajuans.length === 0 ? (
        <EmptyState
          title="Tidak ada pengajuan ditemukan"
          description="Coba ubah filter atau belum ada pengajuan yang masuk ke OPD Anda."
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={["No. Tiket", "Nama Pelapor", "Desa", "Kader", "Status", "Tanggal", "Aksi"]}
            dataLength={pengajuans.length}
          >
            {pengajuans.map((p) => (
              <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                <TableCell className="px-4 py-3.5">
                  <Link href={`/opd/tindak-lanjut/${p.id}`} className="font-mono text-xs md:text-sm font-semibold text-primary hover:underline">
                    {p.tiketNumber}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm text-foreground font-semibold">
                  {p.namaPelapor}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm text-muted-foreground font-medium">
                  {p.desa.name}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm text-muted-foreground font-medium">
                  {p.kader.name}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <StatusBadge status={p.status as PengajuanStatus} />
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm font-semibold text-muted-foreground">
                  {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Button variant="outline" size="sm" asChild className="font-semibold text-xs h-8 rounded-lg">
                    <Link href={`/opd/tindak-lanjut/${p.id}`}>Lihat</Link>
                  </Button>
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
