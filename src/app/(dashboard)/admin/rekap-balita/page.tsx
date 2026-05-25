import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { StatCard } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import { Baby, CheckCircle2, AlertCircle, Building2 } from "lucide-react"

export default async function RekapBalitaAdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const kecamatans = await prisma.kecamatan.findMany({
    include: {
      desas: {
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
      },
    },
    orderBy: { name: "asc" },
  })

  const allBalitas = kecamatans.flatMap((k) => k.desas.flatMap((d) => d.posyandus.flatMap((p) => p.balitas)))
  const totalDitimbang = allBalitas.filter((b) => b.penimbangans.length > 0).length

  const stats = [
    { label: "Total Kecamatan", value: kecamatans.length, icon: Building2, variant: "primary" as const },
    { label: "Total Balita", value: allBalitas.length, icon: Baby, variant: "accent" as const },
    { label: "Ditimbang Bulan Ini", value: totalDitimbang, icon: CheckCircle2, variant: "secondary" as const },
    { label: "Belum Ditimbang", value: allBalitas.length - totalDitimbang, icon: AlertCircle, variant: "destructive" as const },
  ]

  const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][bulanIni - 1]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Rekap Data Balita"
        description={`Status penimbangan balita seluruh kecamatan — ${BULAN_LABEL} ${tahunIni}`}
        backHref="/admin"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} title={s.label} value={s.value} icon={s.icon} colorVariant={s.variant} />
        ))}
      </div>

      <DataTable
        columns={["Kecamatan", "Desa", "Posyandu", "Total Balita", "Ditimbang", "Belum", "Status"]}
        dataLength={kecamatans.length}
      >
        {kecamatans.map((kec) => {
          const balitas = kec.desas.flatMap((d) => d.posyandus.flatMap((p) => p.balitas))
          const total = balitas.length
          const ditimbang = balitas.filter((b) => b.penimbangans.length > 0).length
          const belum = total - ditimbang
          const pct = total > 0 ? Math.round((ditimbang / total) * 100) : 0
          const totalPosyandu = kec.desas.reduce((s, d) => s + d.posyandus.length, 0)
          return (
            <TableRow key={kec.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">{kec.name}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-muted-foreground">{kec.desas.length}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-muted-foreground">{totalPosyandu}</TableCell>
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
                  {pct}%
                </Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </DataTable>
    </PageContainer>
  )
}
