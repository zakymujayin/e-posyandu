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
import { Button } from "@/components/ui/button"
import { GraduationCap, UserX, BookOpen, CheckCircle2, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function RekapATSDesaPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "PETUGAS_DESA") redirect("/login")

  const petugas = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { desaId: true },
  })

  if (!petugas?.desaId) {
    return (
      <PageContainer>
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Akun belum dihubungkan ke desa. Hubungi admin.</AlertDescription></Alert>
      </PageContainer>
    )
  }

  const desa = await prisma.desa.findUnique({ where: { id: petugas.desaId }, select: { name: true } })

  const rows = await withCache(`rekap:ats:desa:${petugas.desaId}`, 3600, async () => {
    const posyandus = await prisma.posyandu.findMany({ where: { desaId: petugas.desaId!, isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })
    const posyanduIds = posyandus.map((p) => p.id)
    const grouped = await prisma.anakTidakSekolah.groupBy({
      by: ["posyanduId", "statusSekolah"],
      where: { posyanduId: { in: posyanduIds }, isActive: true },
      _count: { id: true },
    })
    return posyandus.map((p) => {
      const pRows = grouped.filter((r) => r.posyanduId === p.id)
      const getCount = (s: string) => pRows.find((r) => r.statusSekolah === s)?._count.id ?? 0
      return { posyanduId: p.id, posyanduName: p.name, total: pRows.reduce((acc, r) => acc + r._count.id, 0), putus: getCount("Putus Sekolah"), tidakPernah: getCount("Tidak Pernah Sekolah"), lulus: getCount("Lulus Tidak Melanjutkan") }
    })
  })

  const totalAll = rows.reduce((s, r) => s + r.total, 0)
  const totalPutus = rows.reduce((s, r) => s + r.putus, 0)
  const totalTidakPernah = rows.reduce((s, r) => s + r.tidakPernah, 0)
  const totalLulus = rows.reduce((s, r) => s + r.lulus, 0)

  return (
    <PageContainer className="space-y-6">
      <PageHeader title={`Rekap ATS — Desa ${desa?.name ?? ""}`} description="Data anak tidak sekolah per posyandu" backHref="/petugas-desa" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total ATS" value={totalAll} icon={GraduationCap} colorVariant="primary" />
        <StatCard title="Putus Sekolah" value={totalPutus} icon={UserX} colorVariant="destructive" />
        <StatCard title="Tidak Pernah Sekolah" value={totalTidakPernah} icon={BookOpen} colorVariant="accent" />
        <StatCard title="Lulus Tdk Lanjut" value={totalLulus} icon={CheckCircle2} colorVariant="secondary" />
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm" className="gap-2 font-bold">
          <a href="/api/rekap/ats/export?level=desa" download><Download className="size-4" /> Export Excel</a>
        </Button>
      </div>

      <DataTable columns={["Posyandu", "Total ATS", "Putus Sekolah", "Tidak Pernah", "Lulus Tdk Lanjut", "Aksi"]} dataLength={rows.length}
        emptyState={<div className="text-center py-8 text-muted-foreground text-sm">Belum ada data ATS di desa ini</div>}>
        {rows.map((r) => (
          <TableRow key={r.posyanduId} className="hover:bg-muted/30">
            <TableCell className="px-4 py-3.5 font-semibold text-sm">
              <Link href={`/petugas-desa/rekap-ats/${r.posyanduId}`} className="text-primary hover:underline">{r.posyanduName}</Link>
            </TableCell>
            <TableCell className="px-4 py-3.5 text-sm font-bold">{r.total}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-red-700">{r.putus}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-amber-700">{r.tidakPernah}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-blue-700">{r.lulus}</TableCell>
            <TableCell className="px-4 py-3.5">
              <Button asChild variant="outline" size="sm" className="text-xs font-bold">
                <Link href={`/petugas-desa/rekap-ats/${r.posyanduId}`}>Lihat</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </PageContainer>
  )
}
