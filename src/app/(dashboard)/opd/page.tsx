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
import { FileSpreadsheet, Clock, CheckCircle2 } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { SectionTitle } from "@/components/ui/typography"

const TABS = [
  { value: "proses", label: "Perlu Ditindaklanjuti", status: "DALAM_PROSES_OPD", icon: FileSpreadsheet, variant: "primary" as const },
  { value: "menunggu", label: "Menunggu Approval", status: "MENUNGGU_APPROVAL_DPMD", icon: Clock, variant: "secondary" as const },
  { value: "selesai", label: "Selesai", status: "SELESAI", icon: CheckCircle2, variant: "accent" as const },
]

export default async function OpdPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const tab = TABS.find((t) => t.value === params.tab) ?? TABS[0]

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { opdId: true, opd: { select: { name: true } } },
  })

  if (!user?.opdId) {
    return (
      <div className="p-5 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl text-xs font-semibold max-w-lg mx-auto mt-12 text-center">
        Akun Anda belum terasosiasi dengan data OPD manapun. Silakan hubungi Administrator DPMD.
      </div>
    )
  }

  const counts = await Promise.all(
    TABS.map((t) => prisma.pengajuan.count({ where: { opdId: user.opdId!, status: t.status } }))
  )

  const pengajuans = await prisma.pengajuan.findMany({
    where: { opdId: user.opdId, status: tab.status },
    orderBy: { submittedAt: "desc" },
    take: 20,
    include: {
      layananJenis: { select: { name: true } },
      desa: { select: { name: true } },
    },
  })

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <HeroWelcome
        userName={session.user.name || "Petugas OPD"}
        roleLabel={MESSAGES.roles[session.user.role]}
        description={`Sistem Pemrosesan Berkas Layanan — Dinas terkait: ${user.opd?.name}`}
      />

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {TABS.map((t, i) => (
          <StatCard
            key={t.value}
            title={t.label}
            value={counts[i]}
            icon={t.icon}
            colorVariant={t.variant}
            description={`Jumlah dokumen dengan status ${t.label.toLowerCase()}.`}
          />
        ))}
      </div>

      {/* Tab Controls + Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary rounded-full" />
            <SectionTitle>{tab.label}</SectionTitle>
          </div>
          <div className="flex bg-muted/60 border border-border p-1 rounded-2xl w-fit select-none shadow-xs overflow-x-auto">
            {TABS.map((t, i) => (
              <Button
                key={t.value}
                variant={tab.value === t.value ? "default" : "ghost"}
                size="sm"
                asChild
                className="rounded-xl font-semibold text-xs md:text-sm whitespace-nowrap"
              >
                <Link href={`?tab=${t.value}`}>
                  {t.label} ({counts[i]})
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Main List */}
        {pengajuans.length === 0 ? (
        <EmptyState
          title={`Tidak ada berkas "${tab.label}"`}
          description="Berkas pengajuan akan otomatis muncul setelah kader mengirimkan usulan baru dan disetujui pihak desa."
        />
      ) : (
          <DataTable
            columns={["No. Tiket", "Nama Pelapor", "Jenis Layanan", "Status", "Tanggal", "Aksi"]}
            dataLength={pengajuans.length}
          >
            {pengajuans.map((p) => (
              <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                <TableCell className="px-4 py-3.5 font-mono text-xs md:text-sm font-semibold text-foreground">
                  {p.tiketNumber}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm text-foreground font-semibold">
                  {p.namaPelapor}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm text-muted-foreground font-medium">
                  {p.layananJenis.name}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <StatusBadge status={p.status as PengajuanStatus} />
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm font-semibold text-muted-foreground">
                  {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <Button variant="outline" size="xs" asChild className="rounded-xl font-semibold text-xs md:text-sm">
                    <Link href={`/opd/tindak-lanjut/${p.id}`}>
                      {tab.value === "proses" ? "Tindak Lanjut" : "Lihat Detail"}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </div>
    </PageContainer>
  )
}