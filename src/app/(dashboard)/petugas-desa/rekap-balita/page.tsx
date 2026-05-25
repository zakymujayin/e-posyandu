import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { StatCard } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import { Baby, CheckCircle2, AlertCircle, Scale } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function RekapBalitaDesaPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "PETUGAS_DESA") redirect("/login")

  const petugasDesa = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { desaId: true },
  })

  if (!petugasDesa?.desaId) {
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Akun belum dihubungkan ke desa. Hubungi admin.</AlertDescription>
        </Alert>
      </PageContainer>
    )
  }

  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const posyandus = await prisma.posyandu.findMany({
    where: { desaId: petugasDesa.desaId },
    include: {
      balitas: {
        where: { isActive: true },
        include: {
          penimbangans: { where: { bulan: bulanIni, tahun: tahunIni } },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const totalBalita = posyandus.reduce((s, p) => s + p.balitas.length, 0)
  const totalDitimbang = posyandus.reduce(
    (s, p) => s + p.balitas.filter((b) => b.penimbangans.length > 0).length,
    0
  )
  const totalBelum = totalBalita - totalDitimbang

  const stats = [
    { label: "Total Posyandu", value: posyandus.length, icon: Scale, variant: "primary" as const },
    { label: "Total Balita", value: totalBalita, icon: Baby, variant: "accent" as const },
    { label: "Ditimbang Bulan Ini", value: totalDitimbang, icon: CheckCircle2, variant: "secondary" as const },
    { label: "Belum Ditimbang", value: totalBelum, icon: AlertCircle, variant: "destructive" as const },
  ]

  const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][bulanIni - 1]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Rekap Data Balita"
        description={`Status penimbangan balita per posyandu — ${BULAN_LABEL} ${tahunIni}`}
        backHref="/petugas-desa"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} title={s.label} value={s.value} icon={s.icon} colorVariant={s.variant} />
        ))}
      </div>

      <DataTable
        columns={["Posyandu", "Total Balita", "Ditimbang", "Belum Ditimbang", "Status"]}
        dataLength={posyandus.length}
      >
        {posyandus.map((p) => {
          const total = p.balitas.length
          const ditimbang = p.balitas.filter((b) => b.penimbangans.length > 0).length
          const belum = total - ditimbang
          const pct = total > 0 ? Math.round((ditimbang / total) * 100) : 0
          return (
            <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">{p.name}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">{total}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-emerald-700 font-semibold">{ditimbang}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">
                <span className={belum > 0 ? "text-amber-700 font-semibold" : "text-muted-foreground"}>{belum}</span>
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <Badge
                  className={`text-xs ${
                    pct === 100
                      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                      : pct >= 50
                      ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                  variant="outline"
                >
                  {pct}% ditimbang
                </Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </DataTable>
    </PageContainer>
  )
}
