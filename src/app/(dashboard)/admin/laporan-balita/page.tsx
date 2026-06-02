import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Baby, CheckCircle2, AlertCircle, Activity } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { LaporanBalitaExport } from "@/components/admin/laporan-balita-export"
import { LaporanBalitaFilters } from "@/components/admin/laporan-balita-filters"
import { LaporanBalitaCharts } from "@/components/admin/laporan-balita-charts-wrapper"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle as AlertCircleIcon } from "lucide-react"

export default async function LaporanBalitaPage({
  searchParams,
}: {
  searchParams: Promise<{ kecId?: string; desaId?: string; posyanduId?: string }>
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN_DPMD", "PETUGAS_KECAMATAN", "PETUGAS_DESA"].includes(session.user.role)) redirect("/login")

  const role = session.user.role as "ADMIN_DPMD" | "PETUGAS_KECAMATAN" | "PETUGAS_DESA"
  const { kecId: rawKecId, desaId: rawDesaId, posyanduId: rawPosyanduId } = await searchParams

  // Fetch role-scoped IDs
  let userKecamatanId: string | undefined
  let userDesaId: string | undefined

  if (role === "PETUGAS_KECAMATAN") {
    const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { kecamatanId: true } })
    if (!u?.kecamatanId) {
      return <PageContainer><Alert variant="destructive"><AlertCircleIcon className="h-4 w-4" /><AlertDescription>Akun belum dihubungkan ke kecamatan.</AlertDescription></Alert></PageContainer>
    }
    userKecamatanId = u.kecamatanId
  } else if (role === "PETUGAS_DESA") {
    const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { desaId: true } })
    if (!u?.desaId) {
      return <PageContainer><Alert variant="destructive"><AlertCircleIcon className="h-4 w-4" /><AlertDescription>Akun belum dihubungkan ke desa.</AlertDescription></Alert></PageContainer>
    }
    userDesaId = u.desaId
  }

  // Build filter options
  const kecamatans = role === "ADMIN_DPMD"
    ? await prisma.kecamatan.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    : []

  const desaWhere: Record<string, unknown> = {}
  if (role === "PETUGAS_KECAMATAN" && userKecamatanId) {
    desaWhere.kecamatanId = userKecamatanId
  } else if (role === "ADMIN_DPMD" && rawKecId) {
    desaWhere.kecamatanId = rawKecId
  }
  const desas = Object.keys(desaWhere).length > 0
    ? await prisma.desa.findMany({ where: desaWhere, select: { id: true, name: true }, orderBy: { name: "asc" } })
    : []

  const posyanduWhere: Record<string, unknown> = {}
  if (role === "PETUGAS_DESA" && userDesaId) {
    posyanduWhere.desaId = userDesaId
  } else if (rawDesaId) {
    posyanduWhere.desaId = rawDesaId
  }
  const posyandus = Object.keys(posyanduWhere).length > 0
    ? await prisma.posyandu.findMany({ where: posyanduWhere, select: { id: true, name: true }, orderBy: { name: "asc" } })
    : []

  // Build stat filter
  const filter: Record<string, unknown> = {}
  if (rawPosyanduId) {
    filter.id = rawPosyanduId
  } else if (rawDesaId) {
    filter.desaId = rawDesaId
  } else if (rawKecId) {
    filter.desa = { kecamatanId: rawKecId }
  } else if (role === "PETUGAS_KECAMATAN" && userKecamatanId) {
    filter.desa = { kecamatanId: userKecamatanId }
  } else if (role === "PETUGAS_DESA" && userDesaId) {
    filter.desaId = userDesaId
  }

  const posyanduFiltered = Object.keys(filter).length > 0
    ? await prisma.posyandu.findMany({ where: filter, select: { id: true } })
    : null

  const balitaWhere: Record<string, unknown> = {}
  if (posyanduFiltered !== null) {
    const ids = posyanduFiltered.map(p => p.id)
    balitaWhere.posyanduId = ids.length > 0 ? { in: ids } : "__none__"
  }
  balitaWhere.isActive = true

  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const [totalBalita, ditimbangBulanIni] = await Promise.all([
    prisma.balita.count({ where: balitaWhere }),
    prisma.penimbanganBalita.count({
      where: { bulan: bulanIni, tahun: tahunIni, balita: balitaWhere },
    }),
  ])

  const belumDitimbang = totalBalita - ditimbangBulanIni
  const persentase = totalBalita > 0 ? Math.round((ditimbangBulanIni / totalBalita) * 100) : 0
  const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][bulanIni - 1]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Laporan Data Balita"
        description={`Data per ${format(now, "d MMMM yyyy", { locale: localeId })}`}
        backHref={role === "ADMIN_DPMD" ? "/admin" : role === "PETUGAS_KECAMATAN" ? "/kecamatan" : "/petugas-desa"}
        actions={<LaporanBalitaExport kecId={rawKecId} desaId={rawDesaId} posyanduId={rawPosyanduId} />}
      />

      {role === "ADMIN_DPMD" && kecamatans.length > 0 && (
        <LaporanBalitaFilters
          role={role}
          kecamatans={kecamatans}
          desas={desas}
          posyandus={posyandus}
        />
      )}
      {role === "PETUGAS_KECAMATAN" && (
        <LaporanBalitaFilters
          role={role}
          kecamatans={[]}
          desas={desas}
          posyandus={posyandus}
          defaultKecId={userKecamatanId}
        />
      )}
      {role === "PETUGAS_DESA" && (
        <LaporanBalitaFilters
          role={role}
          kecamatans={[]}
          desas={[]}
          posyandus={posyandus}
          defaultDesaId={userDesaId}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Balita Aktif" value={totalBalita} icon={Baby} colorVariant="primary" />
        <StatCard title={`Ditimbang ${BULAN_LABEL}`} value={ditimbangBulanIni} icon={CheckCircle2} colorVariant="secondary" description={`${persentase}%`} />
        <StatCard title={`Belum ${BULAN_LABEL}`} value={belumDitimbang} icon={AlertCircle} colorVariant="destructive" />
        <StatCard title="Sasaran Posyandu" value={totalBalita} icon={Activity} colorVariant="accent" />
      </div>

      <LaporanBalitaCharts kecId={rawKecId} desaId={rawDesaId} posyanduId={rawPosyanduId} />
    </PageContainer>
  )
}
