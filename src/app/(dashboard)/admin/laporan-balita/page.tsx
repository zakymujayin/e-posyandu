import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Baby, CheckCircle2, AlertCircle, Activity } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { LaporanBalitaCharts } from "@/components/admin/laporan-balita-charts"
import { LaporanBalitaExport } from "@/components/admin/laporan-balita-export"

export default async function LaporanBalitaPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const [totalBalita, ditimbangBulanIni] = await Promise.all([
    prisma.balita.count({ where: { isActive: true } }),
    prisma.penimbanganBalita.count({
      where: { bulan: bulanIni, tahun: tahunIni, balita: { isActive: true } },
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
        backHref="/admin"
        actions={<LaporanBalitaExport />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Balita Aktif" value={totalBalita} icon={Baby} colorVariant="primary" />
        <StatCard title={`Ditimbang ${BULAN_LABEL}`} value={ditimbangBulanIni} icon={CheckCircle2} colorVariant="secondary" description={`${persentase}%`} />
        <StatCard title={`Belum ${BULAN_LABEL}`} value={belumDitimbang} icon={AlertCircle} colorVariant="destructive" />
        <StatCard title="Sasaran Posyandu" value={totalBalita} icon={Activity} colorVariant="accent" />
      </div>

      <LaporanBalitaCharts />
    </PageContainer>
  )
}
