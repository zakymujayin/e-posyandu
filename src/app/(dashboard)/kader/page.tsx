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
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  HeartPulse,
  BookOpen,
  Building,
  Home as HomeIcon,
  Shield,
  HandHeart,
  HelpCircle
} from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { SectionTitle, CardTitle, MutedText } from "@/components/ui/typography"

const OPD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "heart-pulse": HeartPulse,
  "book-open": BookOpen,
  "building": Building,
  "home": HomeIcon,
  "shield": Shield,
  "hand-heart": HandHeart,
}

export default async function KaderPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const kader = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { posyandu: { include: { desa: true } } },
  })

  const opds = await prisma.opd.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
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
      {/* Page Header */}
      <HeroWelcome
        userName={session.user.name || "Kader"}
        roleLabel={MESSAGES.roles[session.user.role]}
        description={description}
      />

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

      {/* OPD Services Grid */}
      <div className="space-y-4">
        <div className="select-none">
          <SectionTitle>Buat Pengajuan Baru</SectionTitle>
          <MutedText className="mt-1">
            Pilih OPD yang sesuai dengan jenis layanan atau pengaduan masyarakat:
          </MutedText>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {opds.map((opd) => {
            const OpdIcon = OPD_ICONS[opd.icon || ""] || HelpCircle
            return (
              <Link
                key={opd.id}
                href={`/kader/ajukan/${opd.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-lg bg-card p-5 border border-border transition-all duration-300 hover:shadow-md hover:border-primary/20"
              >
                {/* Colored left bar for category identifier */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[4px] transition-all duration-300 group-hover:w-[6px]"
                  style={{ backgroundColor: opd.color || "var(--primary)" }}
                />
                
                <div className="space-y-4">
                  {/* Soft tinted backdrop background with solid icon */}
                  <div
                    className="size-12 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                    style={{
                      backgroundColor: opd.color ? `${opd.color}15` : "rgba(var(--primary), 0.08)",
                      color: opd.color || "var(--primary)"
                    }}
                  >
                    <OpdIcon className="size-6" />
                  </div>

                  <div className="space-y-1">
                    <CardTitle className="group-hover:text-primary transition-colors duration-200">
                      {opd.name}
                    </CardTitle>
                    {opd.description && (
                      <MutedText className="line-clamp-2 leading-relaxed mt-1">
                        {opd.description}
                      </MutedText>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-primary dark:text-primary-foreground mt-4 group-hover:translate-x-1 transition-transform duration-200">
                  <span>Pilih Layanan</span>
                  <ArrowRight className="size-3" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Submissions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between select-none">
          <SectionTitle>Pengajuan Terbaru</SectionTitle>
          <Button variant="link" size="sm" asChild className="text-primary hover:text-primary/80 font-semibold px-0">
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
              description="Pilih salah satu OPD di atas untuk mengirimkan usulan pertama Anda."
            />
          }
        >
          {recentPengajuan.map((p) => (
            <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
              <TableCell className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                {p.tiketNumber}
              </TableCell>
              <TableCell className="px-4 py-3 text-xs text-muted-foreground font-medium">
                {p.opd.name}
              </TableCell>
              <TableCell className="px-4 py-3">
                <StatusBadge status={p.status as PengajuanStatus} />
              </TableCell>
              <TableCell className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                {formatDistanceToNow(new Date(p.submittedAt), { addSuffix: true, locale: localeId })}
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </div>
    </PageContainer>
  )
}