import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { withCache } from "@/lib/cache"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { StatCard } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import { Baby, CheckCircle2, AlertCircle, Scale } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle as AlertCircleIcon } from "lucide-react"

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
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>Akun belum dihubungkan ke desa. Hubungi admin.</AlertDescription>
        </Alert>
      </PageContainer>
    )
  }

  const desa = await prisma.desa.findUnique({
    where: { id: petugasDesa.desaId },
    select: { name: true },
  })

  const desaId = petugasDesa.desaId
  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const rows = await withCache(`rekap:desa:${desaId}:${bulanIni}:${tahunIni}`, 3600, async () => {
    const posyandus = await prisma.posyandu.findMany({
      where: { desaId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    const posyanduIds = posyandus.map((p) => p.id)

    const [totalRows, weighedRows] = await Promise.all([
      prisma.balita.groupBy({
        by: ["posyanduId"],
        where: { posyanduId: { in: posyanduIds }, isActive: true },
        _count: { id: true },
      }),
      prisma.penimbanganBalita.findMany({
        where: {
          bulan: bulanIni,
          tahun: tahunIni,
          balita: { posyanduId: { in: posyanduIds }, isActive: true },
        },
        select: { balitaId: true, balita: { select: { posyanduId: true } } },
        distinct: ["balitaId"],
      }),
    ])

    const totalMap = new Map(totalRows.map((r) => [r.posyanduId, r._count.id]))
    const ditimbangMap = new Map<string, number>()
    for (const row of weighedRows) {
      const pid = row.balita.posyanduId
      ditimbangMap.set(pid, (ditimbangMap.get(pid) ?? 0) + 1)
    }

    return posyandus.map((p) => {
      const total = totalMap.get(p.id) ?? 0
      const ditimbang = ditimbangMap.get(p.id) ?? 0
      return { ...p, total, ditimbang, belum: total - ditimbang }
    })
  })

  const totalBalita = rows.reduce((s, r) => s + r.total, 0)
  const totalDitimbang = rows.reduce((s, r) => s + r.ditimbang, 0)

  const stats = [
    { label: "Total Posyandu", value: rows.length, icon: Scale, variant: "primary" as const },
    { label: "Total Balita", value: totalBalita, icon: Baby, variant: "accent" as const },
    { label: "Ditimbang Bulan Ini", value: totalDitimbang, icon: CheckCircle2, variant: "secondary" as const },
    { label: "Belum Ditimbang", value: totalBalita - totalDitimbang, icon: AlertCircle, variant: "destructive" as const },
  ]

  const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][bulanIni - 1]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={desa?.name ?? "Desa"}
        description={`Status penimbangan balita per posyandu — ${BULAN_LABEL} ${tahunIni}`}
        backHref="/petugas-desa"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} title={s.label} value={s.value} icon={s.icon} colorVariant={s.variant} />
        ))}
      </div>

      <DataTable
        columns={["Posyandu", "Total Balita", "Ditimbang", "Belum Ditimbang", "Status"]}
        dataLength={rows.length}
      >
        {rows.map((r) => {
          const pct = r.total > 0 ? Math.round((r.ditimbang / r.total) * 100) : 0
          return (
            <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">
                <Link href={`/petugas-desa/rekap-balita/${r.id}`} className="hover:text-blue-600 hover:underline transition-colors">
                  {r.name}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">{r.total}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-emerald-700 font-semibold">{r.ditimbang}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">
                <span className={r.belum > 0 ? "text-amber-700 font-semibold" : "text-muted-foreground"}>{r.belum}</span>
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
