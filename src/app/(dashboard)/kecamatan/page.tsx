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
import { ClipboardList, Hourglass, CheckCircle2, XCircle, Filter } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { SectionTitle, FormLabel, MutedText } from "@/components/ui/typography"

export default async function KecamatanPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; desaId?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const filterStatus = params.status ?? ""
  const filterDesa = params.desaId ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const limit = 15

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      kecamatanId: true,
      kecamatan: {
        select: {
          name: true,
          desas: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!user?.kecamatanId) {
    return (
      <div className="p-6 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl text-xs font-semibold max-w-lg mx-auto mt-12 text-center">
        Akun Anda belum terdaftar di kecamatan. Hubungi Administrator DPMD.
      </div>
    )
  }

  const desaIds = user.kecamatan?.desas.map((d) => d.id) ?? []

  const where = {
    desaId: filterDesa ? filterDesa : { in: desaIds },
    ...(filterStatus ? { status: filterStatus } : {}),
  }

  const [total, dalamProses, selesai, ditolak] = await Promise.all([
    prisma.pengajuan.count({ where: { desaId: { in: desaIds } } }),
    prisma.pengajuan.count({
      where: {
        desaId: { in: desaIds },
        status: { in: ["MENUNGGU_VERIFIKASI", "DALAM_PROSES_OPD", "MENUNGGU_APPROVAL_DPMD"] },
      },
    }),
    prisma.pengajuan.count({ where: { desaId: { in: desaIds }, status: "SELESAI" } }),
    prisma.pengajuan.count({
      where: {
        desaId: { in: desaIds },
        status: { in: ["DITOLAK_DESA", "DITOLAK_OPD"] },
      },
    }),
  ])

  const [pengajuans, totalFiltered] = await Promise.all([
    prisma.pengajuan.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        opd: { select: { name: true } },
        layananJenis: { select: { name: true } },
        desa: { select: { name: true } },
      },
    }),
    prisma.pengajuan.count({ where }),
  ])

  const totalPages = Math.ceil(totalFiltered / limit)

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <HeroWelcome
        userName={session.user.name || "Petugas"}
        roleLabel={MESSAGES.roles[session.user.role]}
        description={`Panel pemantauan berkas dan pelayanan posyandu — Kecamatan: ${user.kecamatan?.name}`}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pengajuan"
          value={total}
          icon={ClipboardList}
          colorVariant="primary"
          description="Total pengajuan seluruh desa"
        />
        <StatCard
          title="Dalam Proses"
          value={dalamProses}
          icon={Hourglass}
          colorVariant="secondary"
          description="Berkas yang sedang diproses"
        />
        <StatCard
          title="Selesai"
          value={selesai}
          icon={CheckCircle2}
          colorVariant="accent"
          description="Berkas yang sudah disetujui"
        />
        <StatCard
          title="Ditolak"
          value={ditolak}
          icon={XCircle}
          colorVariant="destructive"
          description="Berkas ditolak desa/dinas"
        />
      </div>

      {/* Filters + Table Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 bg-primary rounded-full" />
          <SectionTitle>Data Pengajuan Posyandu</SectionTitle>
        </div>
        <form className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 bg-card border border-border p-4 rounded-2xl shadow-xs">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <FormLabel>Pilih Desa</FormLabel>
          <select
            name="desaId"
            defaultValue={filterDesa}
            className="min-h-[42px] px-3 bg-background border border-border text-foreground rounded-xl text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 hover:bg-muted/40 transition-all cursor-pointer"
          >
            <option value="">Semua Desa</option>
            {user.kecamatan?.desas.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <FormLabel>Pilih Status</FormLabel>
          <select
            name="status"
            defaultValue={filterStatus}
            className="min-h-[42px] px-3 bg-background border border-border text-foreground rounded-xl text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 hover:bg-muted/40 transition-all cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
            <option value="DALAM_PROSES_OPD">Dalam Proses OPD</option>
            <option value="MENUNGGU_APPROVAL_DPMD">Menunggu Approval DPMD</option>
            <option value="SELESAI">Selesai</option>
            <option value="DITOLAK_DESA">Ditolak Desa</option>
            <option value="DITOLAK_OPD">Ditolak OPD</option>
          </select>
        </div>

        <Button type="submit" className="min-h-[42px] px-5 rounded-xl font-bold text-xs md:text-sm gap-2 shrink-0">
          <Filter className="size-3.5" />
          Terapkan Filter
        </Button>
        </form>

        {/* Main Content (Table) */}
        {pengajuans.length === 0 ? (
          <EmptyState title="Tidak ada data pengajuan" description="Gunakan filter lain atau ajukan berkas baru melalui kader." />
        ) : (
          <div className="space-y-4">
            <DataTable
              columns={["No. Tiket", "Pelapor", "OPD Tujuan", "Desa asal", "Status", "Tanggal"]}
              dataLength={pengajuans.length}
            >
              {pengajuans.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="px-4 py-3.5 font-mono text-xs md:text-sm font-bold text-foreground">
                    {p.tiketNumber}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 font-semibold text-foreground text-xs md:text-sm">
                    {p.namaPelapor}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-muted-foreground text-xs md:text-sm font-medium">
                    {p.opd.name}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-muted-foreground text-xs md:text-sm">
                    {p.desa.name}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <StatusBadge status={p.status as PengajuanStatus} />
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-muted-foreground text-xs md:text-sm font-medium">
                    {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border border-border rounded-2xl p-4 select-none">
              <MutedText>
                Menampilkan Halaman {page} dari {totalPages} ({totalFiltered} data)
              </MutedText>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Button variant="outline" size="sm" asChild className="rounded-xl font-semibold text-xs md:text-sm">
                    <Link href={`?desaId=${filterDesa}&status=${filterStatus}&page=${page - 1}`}>
                      &larr; Sebelumnya
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="rounded-xl font-semibold text-xs md:text-sm">
                    &larr; Sebelumnya
                  </Button>
                )}
                {page < totalPages ? (
                  <Button variant="outline" size="sm" asChild className="rounded-xl font-semibold text-xs md:text-sm">
                    <Link href={`?desaId=${filterDesa}&status=${filterStatus}&page=${page + 1}`}>
                      Selanjutnya &rarr;
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="rounded-xl font-semibold text-xs md:text-sm">
                    Selanjutnya &rarr;
                  </Button>
                )}
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}