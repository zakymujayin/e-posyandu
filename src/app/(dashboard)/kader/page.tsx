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
import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { MESSAGES, type PengajuanStatus } from "@/lib/messages"
import { FileText, Clock, CheckCircle2, XCircle, Plus } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { SectionTitle } from "@/components/ui/typography"

export default async function KaderPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const kader = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { posyandu: { include: { desa: true } } },
  })

  const [total, dalamProses, selesai, ditolak] = await Promise.all([
    prisma.pengajuan.count({ where: { kaderId: session.user.id } }),
    prisma.pengajuan.count({ where: { kaderId: session.user.id, status: { in: ["MENUNGGU_VERIFIKASI", "DALAM_PROSES_OPD", "MENUNGGU_APPROVAL_DPMD"] } } }),
    prisma.pengajuan.count({ where: { kaderId: session.user.id, status: "SELESAI" } }),
    prisma.pengajuan.count({ where: { kaderId: session.user.id, status: { in: ["DITOLAK_DESA", "DITOLAK_OPD"] } } }),
  ])

  const recentPengajuan = await prisma.pengajuan.findMany({
    where: { kaderId: session.user.id },
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: { opd: { select: { name: true } }, layananJenis: { select: { name: true } } },
  })

  const stats = [
    { label: "Total Pengajuan", value: total, icon: FileText, variant: "primary" as const },
    { label: "Dalam Proses", value: dalamProses, icon: Clock, variant: "accent" as const },
    { label: "Selesai", value: selesai, icon: CheckCircle2, variant: "secondary" as const },
    { label: "Ditolak", value: ditolak, icon: XCircle, variant: "destructive" as const },
  ]

  const description = kader?.posyandu
    ? `Posyandu: ${kader.posyandu.name} — ${kader.posyandu.desa?.name}`
    : "Kader Posyandu Desa"

  return (
    <PageContainer className="space-y-6">
      <HeroWelcome
        userName={session.user.name || "Kader"}
        roleLabel={MESSAGES.roles[session.user.role]}
        description={description}
      />

      <div className="flex">
        <Button asChild className="gap-2 font-bold">
          <Link href="/kader/layanan">
            <Plus className="w-4 h-4" />
            Buat Pengajuan Baru
          </Link>
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            title={s.label}
            value={s.value}
            icon={s.icon}
            colorVariant={s.variant}
          />
        ))}
      </div>

      {/* Recent Submissions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary rounded-full shrink-0" />
            <SectionTitle>Pengajuan Terbaru</SectionTitle>
          </div>
          <Button variant="link" size="sm" asChild className="text-primary hover:text-primary/80 font-bold px-0">
            <Link href="/kader/riwayat">
              Lihat Semua
            </Link>
          </Button>
        </div>

        <DataTable
          columns={["No. Tiket", "OPD", "Status", "Waktu"]}
          dataLength={recentPengajuan.length}
          emptyState={
            <EmptyState
              title="Belum ada pengajuan"
              description="Klik tombol Buat Pengajuan Baru untuk mengirimkan usulan pertama Anda."
            />
          }
        >
          {recentPengajuan.map((p) => (
            <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
              <TableCell className="px-4 py-3.5 font-mono text-xs md:text-sm font-semibold">
                <Link href={`/kader/riwayat/${p.id}`} className="text-primary hover:underline transition-colors">
                    {p.tiketNumber}
                  </Link>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-xs md:text-sm text-muted-foreground font-medium">
                {p.opd.name}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <StatusBadge status={p.status as PengajuanStatus} />
              </TableCell>
              <TableCell className="px-4 py-3.5 text-xs md:text-sm font-semibold text-muted-foreground">
                {formatDistanceToNow(new Date(p.submittedAt), { addSuffix: true, locale: localeId })}
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </div>
    </PageContainer>
  )
}
