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

export default async function RekapATSKecamatanPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "PETUGAS_KECAMATAN") redirect("/login")

  const petugas = await prisma.user.findUnique({ where: { id: session.user.id }, select: { kecamatanId: true } })
  if (!petugas?.kecamatanId) {
    return (
      <PageContainer>
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Akun belum dihubungkan ke kecamatan.</AlertDescription></Alert>
      </PageContainer>
    )
  }

  const kecamatan = await prisma.kecamatan.findUnique({ where: { id: petugas.kecamatanId }, select: { name: true } })

  const rows = await withCache(`rekap:ats:kec:${petugas.kecamatanId}`, 3600, async () => {
    const desas = await prisma.desa.findMany({ where: { kecamatanId: petugas.kecamatanId! }, select: { id: true, name: true }, orderBy: { name: "asc" } })
    const desaIds = desas.map((d) => d.id)
    const grouped = await prisma.anakTidakSekolah.groupBy({
      by: ["desaId", "statusSekolah"],
      where: { desaId: { in: desaIds }, isActive: true },
      _count: { id: true },
    })
    return desas.map((d) => {
      const dRows = grouped.filter((r) => r.desaId === d.id)
      const getCount = (s: string) => dRows.find((r) => r.statusSekolah === s)?._count.id ?? 0
      return { desaId: d.id, desaName: d.name, total: dRows.reduce((acc, r) => acc + r._count.id, 0), putus: getCount("Putus Sekolah"), tidakPernah: getCount("Tidak Pernah Sekolah"), lulus: getCount("Lulus Tidak Melanjutkan") }
    })
  })

  const totalAll = rows.reduce((s, r) => s + r.total, 0)
  const totalPutus = rows.reduce((s, r) => s + r.putus, 0)
  const totalTidakPernah = rows.reduce((s, r) => s + r.tidakPernah, 0)
  const totalLulus = rows.reduce((s, r) => s + r.lulus, 0)

  return (
    <PageContainer className="space-y-6">
      <PageHeader title={`Rekap ATS — Kecamatan ${kecamatan?.name ?? ""}`} description="Data anak tidak sekolah per desa" backHref="/kecamatan" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total ATS" value={totalAll} icon={GraduationCap} colorVariant="primary" />
        <StatCard title="Putus Sekolah" value={totalPutus} icon={UserX} colorVariant="destructive" />
        <StatCard title="Tidak Pernah" value={totalTidakPernah} icon={BookOpen} colorVariant="accent" />
        <StatCard title="Lulus Tdk Lanjut" value={totalLulus} icon={CheckCircle2} colorVariant="secondary" />
      </div>
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm" className="gap-2 font-bold">
          <a href="/api/rekap/ats/export?level=kecamatan" download><Download className="size-4" /> Export Excel</a>
        </Button>
      </div>
      <DataTable columns={["Desa", "Total ATS", "Putus Sekolah", "Tidak Pernah", "Lulus Tdk Lanjut", "Aksi"]} dataLength={rows.length}
        emptyState={<div className="text-center py-8 text-muted-foreground text-sm">Belum ada data ATS</div>}>
        {rows.map((r) => (
          <TableRow key={r.desaId} className="hover:bg-muted/30">
            <TableCell className="px-4 py-3.5 font-semibold text-sm">
              <Link href={`/kecamatan/rekap-ats/${r.desaId}`} className="text-primary hover:underline">{r.desaName}</Link>
            </TableCell>
            <TableCell className="px-4 py-3.5 text-sm font-bold">{r.total}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-red-700">{r.putus}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-amber-700">{r.tidakPernah}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-blue-700">{r.lulus}</TableCell>
            <TableCell className="px-4 py-3.5">
              <Button asChild variant="outline" size="sm" className="text-xs font-bold">
                <Link href={`/kecamatan/rekap-ats/${r.desaId}`}>Lihat</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </PageContainer>
  )
}
