import Link from "next/link"
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
    select: {
      id: true,
      name: true,
      desas: {
        select: {
          id: true,
          posyandus: { select: { id: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const posyanduToDesaMap = new Map<string, string>()
  let totalPosyanduCount = 0
  for (const k of kecamatans) {
    for (const d of k.desas) {
      for (const p of d.posyandus) {
        posyanduToDesaMap.set(p.id, d.id)
        totalPosyanduCount++
      }
    }
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

  const kecamatanRows = kecamatans.map((k) => {
    let totalBalita = 0
    let totalDitimbang = 0
    let posyanduCount = 0
    for (const d of k.desas) {
      posyanduCount += d.posyandus.length
      totalBalita += totalByDesa.get(d.id) ?? 0
      totalDitimbang += ditimbangByDesa.get(d.id) ?? 0
    }
    return {
      id: k.id,
      name: k.name,
      desaCount: k.desas.length,
      posyanduCount,
      totalBalita,
      ditimbang: totalDitimbang,
      belum: totalBalita - totalDitimbang,
    }
  })

  const totalBalita = kecamatanRows.reduce((s, r) => s + r.totalBalita, 0)
  const totalDitimbang = kecamatanRows.reduce((s, r) => s + r.ditimbang, 0)

  const stats = [
    { label: "Total Kecamatan", value: kecamatans.length, icon: Building2, variant: "primary" as const },
    { label: "Total Balita", value: totalBalita, icon: Baby, variant: "accent" as const },
    { label: "Ditimbang Bulan Ini", value: totalDitimbang, icon: CheckCircle2, variant: "secondary" as const },
    { label: "Belum Ditimbang", value: totalBalita - totalDitimbang, icon: AlertCircle, variant: "destructive" as const },
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
        dataLength={kecamatanRows.length}
      >
        {kecamatanRows.map((kec) => {
          const pct = kec.totalBalita > 0 ? Math.round((kec.ditimbang / kec.totalBalita) * 100) : 0
          return (
            <TableRow key={kec.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">
                <Link href={`/admin/rekap-balita/${kec.id}`} className="hover:text-blue-600 hover:underline transition-colors">
                  {kec.name}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-muted-foreground">{kec.desaCount}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-muted-foreground">{kec.posyanduCount}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">{kec.totalBalita}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-emerald-700 font-semibold">{kec.ditimbang}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">
                <span className={kec.belum > 0 ? "text-amber-700 font-semibold" : "text-muted-foreground"}>{kec.belum}</span>
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
