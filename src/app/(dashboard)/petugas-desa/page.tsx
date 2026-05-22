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
import { ShieldAlert, CheckCircle2, XOctagon, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageContainer } from "@/components/layout/page-container"
import { SectionTitle, MutedText } from "@/components/ui/typography"

export default async function PetugasDesaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const tab = params.tab === "sudah" ? "sudah" : "perlu"

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { desaId: true, desa: { select: { name: true } } },
  })

  if (!user?.desaId) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Akun Anda belum terasosiasi dengan data desa manapun. Silakan hubungi Administrator DPMD.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const [menunggu, totalVerifikasi, totalDitolak] = await Promise.all([
    prisma.pengajuan.count({ where: { desaId: user.desaId, status: "MENUNGGU_VERIFIKASI" } }),
    prisma.pengajuan.count({ where: { desaId: user.desaId, status: { not: "MENUNGGU_VERIFIKASI" } } }),
    prisma.pengajuan.count({ where: { desaId: user.desaId, status: { in: ["DITOLAK_DESA", "DITOLAK_OPD"] } } }),
  ])

  const wherePerlu = { desaId: user.desaId, status: "MENUNGGU_VERIFIKASI" }
  const whereSudah = {
    desaId: user.desaId,
    status: { notIn: ["MENUNGGU_VERIFIKASI"] },
  }

  const pengajuans = await prisma.pengajuan.findMany({
    where: tab === "perlu" ? wherePerlu : whereSudah,
    orderBy: { submittedAt: "desc" },
    take: 20,
    include: {
      opd: { select: { name: true } },
      layananJenis: { select: { name: true } },
    },
  })

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <HeroWelcome
        userName={session.user.name || "Petugas Desa"}
        roleLabel={MESSAGES.roles[session.user.role]}
        description={`Sistem Verifikasi Berkas Posyandu — Wilayah Administrasi: ${user.desa?.name}`}
      />

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Perlu Verifikasi"
          value={menunggu}
          icon={ShieldAlert}
          colorVariant={menunggu > 0 ? "destructive" : "primary"}
          description="Berkas baru yang menunggu divalidasi oleh Anda."
        />
        <StatCard
          title="Sudah Diproses"
          value={totalVerifikasi}
          icon={CheckCircle2}
          colorVariant="secondary"
          description="Total berkas yang telah dikirim ke OPD terkait."
        />
        <StatCard
          title="Total Ditolak"
          value={totalDitolak}
          icon={XOctagon}
          colorVariant="accent"
          description="Berkas yang dikembalikan karena ketidaksesuaian data."
        />
      </div>

      {/* Tab Controls + Section Title */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary rounded-full" />
            <SectionTitle>
              {tab === "perlu" ? "Berkas Perlu Diverifikasi" : "Riwayat Berkas Diproses"}
            </SectionTitle>
          </div>
          <div className="flex bg-muted/60 border border-border p-1 rounded-lg w-fit shadow-xs">
            <Button
              variant={tab === "perlu" ? "default" : "ghost"}
              size="sm"
              asChild
              className="font-semibold text-xs md:text-sm"
            >
              <Link href="?tab=perlu">Perlu Diverifikasi ({menunggu})</Link>
            </Button>
            <Button
              variant={tab === "sudah" ? "default" : "ghost"}
              size="sm"
              asChild
              className="font-semibold text-xs md:text-sm"
            >
              <Link href="?tab=sudah">Sudah Diproses</Link>
            </Button>
          </div>
        </div>

        {/* Main List */}
        {pengajuans.length === 0 ? (
          <EmptyState
            title={tab === "perlu" ? "Belum ada berkas baru" : "Tidak ada riwayat berkas"}
            description={
              tab === "perlu"
                ? "Seluruh pengajuan dari kader posyandu di wilayah Anda telah selesai diverifikasi."
                : "Belum ada pengajuan posyandu yang selesai Anda proses saat ini."
            }
          />
        ) : (
          <DataTable
            columns={["No. Tiket", "Nama Pelapor", "OPD Tujuan", "Status", "Tanggal", "Aksi"]}
            dataLength={pengajuans.length}
          >
            {pengajuans.map((p) => (
              <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                <TableCell className="px-4 py-3.5 font-mono text-xs md:text-sm font-semibold">
                  <Link href={`/petugas-desa/verifikasi/${p.id}`} className="text-primary hover:underline transition-colors">
                    {p.tiketNumber}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm text-foreground font-semibold">
                  {p.namaPelapor}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm text-muted-foreground font-medium">
                  {p.opd.name}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <StatusBadge status={p.status as PengajuanStatus} />
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs md:text-sm font-semibold text-muted-foreground">
                  {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <Button variant="outline" size="xs" asChild className="font-semibold text-xs md:text-sm">
                    <Link href={`/petugas-desa/verifikasi/${p.id}`}>
                      {tab === "perlu" ? "Verifikasi Berkas" : "Lihat Detail"}
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