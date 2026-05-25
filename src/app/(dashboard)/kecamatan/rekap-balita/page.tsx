import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { StatCard } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import { Baby, CheckCircle2, AlertCircle, MapPin } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function RekapBalitaKecamatanPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "PETUGAS_KECAMATAN") redirect("/login")

  const petugas = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kecamatanId: true },
  })

  if (!petugas?.kecamatanId) {
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Akun belum dihubungkan ke kecamatan. Hubungi admin.</AlertDescription>
        </Alert>
      </PageContainer>
    )
  }

  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const desas = await prisma.desa.findMany({
    where: { kecamatanId: petugas.kecamatanId },
    include: {
      posyandus: {
        include: {
          balitas: {
            where: { isActive: true },
            include: {
              penimbangans: { where: { bulan: bulanIni, tahun: tahunIni } },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const allBalitas = desas.flatMap((d) => d.posyandus.flatMap((p) => p.balitas))
  const totalDitimbang = allBalitas.filter((b) => b.penimbangans.length > 0).length

  const stats = [
    { label: "Total Desa", value: desas.length, icon: MapPin, variant: "primary" as const },
    { label: "Total Balita", value: allBalitas.length, icon: Baby, variant: "accent" as const },
    { label: "Ditimbang Bulan Ini", value: totalDitimbang, icon: CheckCircle2, variant: "secondary" as const },
    { label: "Belum Ditimbang", value: allBalitas.length - totalDitimbang, icon: AlertCircle, variant: "destructive" as const },
  ]

  const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][bulanIni - 1]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Rekap Data Balita"
        description={`Status penimbangan balita per desa — ${BULAN_LABEL} ${tahunIni}`}
        backHref="/kecamatan"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} title={s.label} value={s.value} icon={s.icon} colorVariant={s.variant} />
        ))}
      </div>

      <DataTable
        columns={["Desa", "Total Posyandu", "Total Balita", "Ditimbang", "Belum", "Status"]}
        dataLength={desas.length}
      >
        {desas.map((d) => {
          const balitas = d.posyandus.flatMap((p) => p.balitas)
          const total = balitas.length
          const ditimbang = balitas.filter((b) => b.penimbangans.length > 0).length
          const belum = total - ditimbang
          const pct = total > 0 ? Math.round((ditimbang / total) * 100) : 0
          return (
            <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">{d.name}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-muted-foreground">{d.posyandus.length}</TableCell>
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
