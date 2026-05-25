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
import { FileText, Clock, CheckCircle2, XCircle, Plus, Baby, Scale, AlertCircle } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { SectionTitle } from "@/components/ui/typography"

export default async function PosyanduPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const posyanduUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { posyandu: { include: { desa: { include: { kecamatan: true } } } } },
  })

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [total, dalamProses, selesai, ditolak] = await Promise.all([
    prisma.pengajuan.count({ where: { posyanduUserId: session.user.id } }),
    prisma.pengajuan.count({ where: { posyanduUserId: session.user.id, status: { in: ["MENUNGGU_VERIFIKASI", "DALAM_PROSES_OPD", "MENUNGGU_APPROVAL_DPMD"] } } }),
    prisma.pengajuan.count({ where: { posyanduUserId: session.user.id, status: "SELESAI" } }),
    prisma.pengajuan.count({ where: { posyanduUserId: session.user.id, status: { in: ["DITOLAK_DESA", "DITOLAK_OPD"] } } }),
  ])

  const recentPengajuan = await prisma.pengajuan.findMany({
    where: { posyanduUserId: session.user.id },
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: { opd: { select: { name: true } }, layananJenis: { select: { name: true } } },
  })

  // Balita stats
  const posyanduId = posyanduUser?.posyanduId
  const [totalBalita, ditimbangBulanIni] = await Promise.all([
    posyanduId ? prisma.balita.count({ where: { posyanduId, isActive: true } }) : Promise.resolve(0),
    posyanduId
      ? prisma.penimbanganBalita.count({
          where: { bulan: currentMonth, tahun: currentYear, balita: { posyanduId } },
        })
      : Promise.resolve(0),
  ])
  const belumDitimbang = totalBalita - ditimbangBulanIni

  const stats = [
    { label: "Total Pengajuan", value: total, icon: FileText, variant: "primary" as const },
    { label: "Dalam Proses", value: dalamProses, icon: Clock, variant: "accent" as const },
    { label: "Selesai", value: selesai, icon: CheckCircle2, variant: "secondary" as const },
    { label: "Ditolak", value: ditolak, icon: XCircle, variant: "destructive" as const },
  ]

  const desa = posyanduUser?.posyandu?.desa
  const description = desa
    ? `${desa.name} — ${desa.kecamatan?.name ?? ""}${posyanduUser?.noRegistrasi ? ` · No. Reg: ${posyanduUser.noRegistrasi}` : ""}`
    : "Akun Posyandu"

  return (
    <PageContainer className="space-y-6">
      <HeroWelcome
        userName={posyanduUser?.posyandu?.name ?? session.user.name ?? "Posyandu"}
        roleLabel={MESSAGES.roles[session.user.role]}
        description={description}
      />

      <div className="flex justify-end">
        <Button asChild className="gap-2 font-bold">
          <Link href="/posyandu/layanan">
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

      {/* Balita Summary Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Baby className="w-4 h-4 text-primary" />
            <SectionTitle>Layanan Data Balita</SectionTitle>
          </div>
          <Button variant="link" size="sm" asChild className="text-primary hover:text-primary/80 font-bold px-0">
            <Link href="/posyandu/balita">Lihat Data →</Link>
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{totalBalita}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Total Terdaftar</p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{ditimbangBulanIni}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Ditimbang Bulan Ini</p>
          </div>
          <div className={`rounded-lg px-4 py-3 text-center ${belumDitimbang > 0 ? "bg-amber-500/10" : "bg-muted/40"}`}>
            <p className={`text-2xl font-bold ${belumDitimbang > 0 ? "text-amber-700" : "text-foreground"}`}>{belumDitimbang}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Belum Ditimbang</p>
          </div>
        </div>
        {belumDitimbang > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200/60">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{belumDitimbang} balita belum dicatat penimbangannya bulan ini.</span>
          </div>
        )}
        <Button asChild variant="outline" size="sm" className="w-full font-bold gap-2">
          <Link href="/posyandu/balita/tambah">
            <Scale className="w-4 h-4" />
            Tambah Data Balita
          </Link>
        </Button>
      </div>

      {/* Recent Submissions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary rounded-full shrink-0" />
            <SectionTitle>Pengajuan Terbaru</SectionTitle>
          </div>
          <Button variant="link" size="sm" asChild className="text-primary hover:text-primary/80 font-bold px-0">
            <Link href="/posyandu/riwayat">
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
                <Link href={`/posyandu/riwayat/${p.id}`} className="text-primary hover:underline transition-colors">
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
