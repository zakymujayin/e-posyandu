import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { withCache } from "@/lib/cache"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default async function RekapATSKecAdminPage({ params }: { params: Promise<{ kecId: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const { kecId } = await params
  const kecamatan = await prisma.kecamatan.findUnique({ where: { id: kecId }, select: { name: true } })
  if (!kecamatan) notFound()

  const rows = await withCache(`rekap:ats:kec:${kecId}`, 3600, async () => {
    const desas = await prisma.desa.findMany({ where: { kecamatanId: kecId }, select: { id: true, name: true }, orderBy: { name: "asc" } })
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

  return (
    <PageContainer className="space-y-6">
      <PageHeader title={`ATS — Kecamatan ${kecamatan.name}`} description="Per desa" backHref="/admin/rekap-ats" />
      <DataTable columns={["Desa", "Total", "Putus", "Tidak Pernah", "Lulus Tdk Lanjut", "Aksi"]} dataLength={rows.length}
        emptyState={<div className="text-center py-8 text-muted-foreground text-sm">Belum ada data</div>}>
        {rows.map((r) => (
          <TableRow key={r.desaId} className="hover:bg-muted/30">
            <TableCell className="px-4 py-3.5 font-semibold text-sm">
              <Link href={`/admin/rekap-ats/${kecId}/${r.desaId}`} className="text-primary hover:underline">{r.desaName}</Link>
            </TableCell>
            <TableCell className="px-4 py-3.5 font-bold text-sm">{r.total}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-red-700">{r.putus}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-amber-700">{r.tidakPernah}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-blue-700">{r.lulus}</TableCell>
            <TableCell className="px-4 py-3.5">
              <Button asChild variant="outline" size="sm" className="text-xs font-bold">
                <Link href={`/admin/rekap-ats/${kecId}/${r.desaId}`}>Lihat</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </PageContainer>
  )
}
