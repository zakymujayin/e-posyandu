import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { StatCard } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import { Baby, CheckCircle2, AlertCircle, MapPin } from "lucide-react"

export default async function RekapBalitaKecDetailPage({
  params,
}: {
  params: Promise<{ kecId: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const { kecId } = await params
  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const kecamatan = await prisma.kecamatan.findUnique({
    where: { id: kecId },
    select: { name: true },
  })
  if (!kecamatan) redirect("/admin/rekap-balita")

  const desas = await prisma.desa.findMany({
    where: { kecamatanId: kecId },
    select: { id: true, name: true, posyandus: { select: { id: true } } },
    orderBy: { name: "asc" },
  })

  const posyanduToDesaMap = new Map<string, string>()
  for (const d of desas) {
    for (const p of d.posyandus) posyanduToDesaMap.set(p.id, d.id)
  }
  const allPosyanduIds = Array.from(posyanduToDesaMap.keys())

  const [totalRows, weighedRows] = await Promise.all([
    prisma.balita.groupBy({
      by: ["posyanduId"],
      where: { posyanduId: { in: allPosyanduIds }, isActive: true },
      _count: { id: true },
    }),
    prisma.penimbanganBalita.findMany({
      where: {
        bulan: bulanIni,
        tahun: tahunIni,
        balita: { posyanduId: { in: allPosyanduIds }, isActive: true },
      },
      select: { balitaId: true, balita: { select: { posyanduId: true } } },
      distinct: ["balitaId"],
    }),
  ])

  const totalByDesa = new Map<string, number>()
  for (const row of totalRows) {
    const desaId = posyanduToDesaMap.get(row.posyanduId)
    if (desaId) totalByDesa.set(desaId, (totalByDesa.get(desaId) ?? 0) + row._count.id)
  }

  const ditimbangByDesa = new Map<string, number>()
  for (const row of weighedRows) {
    const desaId = posyanduToDesaMap.get(row.balita.posyanduId)
    if (desaId) ditimbangByDesa.set(desaId, (ditimbangByDesa.get(desaId) ?? 0) + 1)
  }

  const rows = desas.map((d) => {
    const total = totalByDesa.get(d.id) ?? 0
    const ditimbang = ditimbangByDesa.get(d.id) ?? 0
    return { ...d, total, ditimbang, belum: total - ditimbang }
  })

  const totalBalita = rows.reduce((s, r) => s + r.total, 0)
  const totalDitimbang = rows.reduce((s, r) => s + r.ditimbang, 0)

  const stats = [
    { label: "Total Desa", value: desas.length, icon: MapPin, variant: "primary" as const },
    { label: "Total Balita", value: totalBalita, icon: Baby, variant: "accent" as const },
    { label: "Ditimbang Bulan Ini", value: totalDitimbang, icon: CheckCircle2, variant: "secondary" as const },
    { label: "Belum Ditimbang", value: totalBalita - totalDitimbang, icon: AlertCircle, variant: "destructive" as const },
  ]

  const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][bulanIni - 1]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={kecamatan.name}
        description={`Status penimbangan balita per desa — ${BULAN_LABEL} ${tahunIni}`}
        backHref="/admin/rekap-balita"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} title={s.label} value={s.value} icon={s.icon} colorVariant={s.variant} />
        ))}
      </div>

      <DataTable columns={["Desa", "Total Posyandu", "Total Balita", "Ditimbang", "Belum", "Status"]} dataLength={rows.length}>
        {rows.map((r) => {
          const pct = r.total > 0 ? Math.round((r.ditimbang / r.total) * 100) : 0
          return (
            <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">
                <Link href={`/admin/rekap-balita/${kecId}/${r.id}`} className="hover:text-blue-600 hover:underline transition-colors">
                  {r.name}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-muted-foreground">{r.posyandus.length}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">{r.total}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-emerald-700 font-semibold">{r.ditimbang}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">
                <span className={r.belum > 0 ? "text-amber-700 font-semibold" : "text-muted-foreground"}>{r.belum}</span>
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <Badge className={`text-xs ${
                  pct === 100
                    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                    : pct >= 50
                    ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`} variant="outline">{pct}% ditimbang</Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </DataTable>
    </PageContainer>
  )
}
