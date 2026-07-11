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
import { ATSCharts } from "@/components/admin/ats-charts-wrapper"

export default async function RekapATSAdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const rows = await withCache("rekap:ats:all", 3600, async () => {
    const kecamatans = await prisma.kecamatan.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    const kecIds = kecamatans.map((k) => k.id)
    const grouped = await prisma.anakTidakSekolah.groupBy({
      by: ["kecamatanId", "statusSekolah"],
      where: { kecamatanId: { in: kecIds }, isActive: true },
      _count: { id: true },
    })
    return kecamatans.map((k) => {
      const kRows = grouped.filter((r) => r.kecamatanId === k.id)
      const getCount = (s: string) => kRows.find((r) => r.statusSekolah === s)?._count.id ?? 0
      return { kecamatanId: k.id, kecamatanName: k.name, total: kRows.reduce((acc, r) => acc + r._count.id, 0), putus: getCount("Putus Sekolah"), tidakPernah: getCount("Tidak Pernah Sekolah"), lulus: getCount("Lulus Tidak Melanjutkan") }
    })
  })

  const [statusGroups, alasanGroups, programRecords] = await Promise.all([
    prisma.anakTidakSekolah.groupBy({
      by: ["statusSekolah"],
      where: { isActive: true },
      _count: { id: true },
    }),
    prisma.anakTidakSekolah.groupBy({
      by: ["alasanTidakSekolah"],
      where: { isActive: true },
      _count: { id: true },
    }),
    prisma.anakTidakSekolah.findMany({
      where: { isActive: true },
      select: { programDibutuhkan: true },
      take: 10000,
    }),
  ])

  const statusData = [
    { name: "Putus Sekolah", value: statusGroups.find((r) => r.statusSekolah === "Putus Sekolah")?._count.id ?? 0 },
    { name: "Tidak Pernah", value: statusGroups.find((r) => r.statusSekolah === "Tidak Pernah Sekolah")?._count.id ?? 0 },
    { name: "Lulus Tdk Lanjut", value: statusGroups.find((r) => r.statusSekolah === "Lulus Tidak Melanjutkan")?._count.id ?? 0 },
  ]

  const alasanData = alasanGroups.map((r) => ({ name: r.alasanTidakSekolah, value: r._count.id })).sort((a, b) => b.value - a.value).slice(0, 5)

  const programCount: Record<string, number> = {}
  for (const r of programRecords) {
    if (Array.isArray(r.programDibutuhkan)) {
      for (const p of r.programDibutuhkan as string[]) { programCount[p] = (programCount[p] ?? 0) + 1 }
    }
  }
  const programData = Object.entries(programCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const totalAll = rows.reduce((s, r) => s + r.total, 0)
  const totalPutus = rows.reduce((s, r) => s + r.putus, 0)
  const totalTidakPernah = rows.reduce((s, r) => s + r.tidakPernah, 0)
  const totalLulus = rows.reduce((s, r) => s + r.lulus, 0)

  return (
    <PageContainer className="space-y-6">
      <PageHeader title="Rekap ATS — Kabupaten Lebak" description="Data anak tidak sekolah seluruh kecamatan" backHref="/admin" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total ATS" value={totalAll} icon={GraduationCap} colorVariant="primary" />
        <StatCard title="Putus Sekolah" value={totalPutus} icon={UserX} colorVariant="destructive" />
        <StatCard title="Tidak Pernah" value={totalTidakPernah} icon={BookOpen} colorVariant="accent" />
        <StatCard title="Lulus Tdk Lanjut" value={totalLulus} icon={CheckCircle2} colorVariant="secondary" />
      </div>
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm" className="gap-2 font-bold">
          <a href="/api/rekap/ats/export?level=all" download><Download className="size-4" /> Export Semua (.xlsx)</a>
        </Button>
      </div>
      <ATSCharts statusData={statusData} alasanData={alasanData} programData={programData} />
      <DataTable columns={["Kecamatan", "Total ATS", "Putus Sekolah", "Tidak Pernah", "Lulus Tdk Lanjut", "Aksi"]} dataLength={rows.length}
        emptyState={<div className="text-center py-8 text-muted-foreground text-sm">Belum ada data ATS</div>}>
        {rows.map((r) => (
          <TableRow key={r.kecamatanId} className="hover:bg-muted/30">
            <TableCell className="px-4 py-3.5 font-semibold text-sm">
              <Link href={`/admin/rekap-ats/${r.kecamatanId}`} className="text-primary hover:underline">{r.kecamatanName}</Link>
            </TableCell>
            <TableCell className="px-4 py-3.5 font-bold text-sm">{r.total}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-red-700">{r.putus}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-amber-700">{r.tidakPernah}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-blue-700">{r.lulus}</TableCell>
            <TableCell className="px-4 py-3.5">
              <Button asChild variant="outline" size="sm" className="text-xs font-bold">
                <Link href={`/admin/rekap-ats/${r.kecamatanId}`}>Detail</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </PageContainer>
  )
}
