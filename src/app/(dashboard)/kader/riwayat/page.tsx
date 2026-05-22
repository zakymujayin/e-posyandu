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

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "MENUNGGU_VERIFIKASI", label: "Menunggu Verifikasi" },
  { value: "DALAM_PROSES_OPD", label: "Dalam Proses OPD" },
  { value: "MENUNGGU_APPROVAL_DPMD", label: "Menunggu Approval" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DITOLAK_DESA", label: "Ditolak Desa" },
  { value: "DITOLAK_OPD", label: "Ditolak OPD" },
]

export default async function KaderRiwayatPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const status = params.status ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const limit = 10

  const where = {
    kaderId: session.user.id,
    ...(status ? { status } : {}),
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

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Riwayat Pengajuan"
        description="Pantau progres dan status verifikasi dari seluruh usulan yang Anda kirimkan."
        backHref="/kader"
      />

      {/* Toolbar Filter */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-xs select-none">
        <form className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Filter Berdasarkan Status
            </FormLabel>
            <select
              name="status"
              defaultValue={status}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="self-end">
            <Button type="submit" size="sm" className="font-semibold tracking-tight">
              Terapkan Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Main Table */}
      {pengajuans.length === 0 ? (
        <EmptyState
          title="Tidak ada pengajuan ditemukan"
          description="Silakan ubah filter status Anda atau buat pengajuan baru di halaman beranda."
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={["No. Tiket", "Nama Pelapor", "OPD", "Status", "Tanggal"]}
            dataLength={pengajuans.length}
          >
            {pengajuans.map((p) => (
              <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                <TableCell className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {p.tiketNumber}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-xs text-foreground font-semibold">
                  {p.namaPelapor}
                </TableCell>
                <TableCell className="px-4 py-3 text-xs text-muted-foreground font-medium">
                  {p.opd.name}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <StatusBadge status={p.status as PengajuanStatus} />
                </TableCell>
                <TableCell className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-medium text-muted-foreground bg-card border border-border rounded-lg p-4 select-none">
              <span>
                Menampilkan Halaman {page} dari {totalPages} ({total} data)
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Button variant="outline" size="sm" asChild className="font-semibold">
                    <Link href={`?status=${status}&page=${page - 1}`}>
                      &larr; Sebelumnya
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="font-semibold">
                    &larr; Sebelumnya
                  </Button>
                )}
                {page < totalPages ? (
                  <Button variant="outline" size="sm" asChild className="font-semibold">
                    <Link href={`?status=${status}&page=${page + 1}`}>
                      Selanjutnya &rarr;
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="font-semibold">
                    Selanjutnya &rarr;
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  )
}