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

export default async function RekapATSDesaAdminPage({ params }: { params: Promise<{ kecId: string; desaId: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const { kecId, desaId } = await params
  const desa = await prisma.desa.findFirst({ where: { id: desaId, kecamatanId: kecId }, select: { name: true } })
  if (!desa) notFound()

  const rows = await withCache(`rekap:ats:desa:${desaId}`, 3600, async () => {
    const posyandus = await prisma.posyandu.findMany({ where: { desaId, isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })
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

  return (
    <PageContainer className="space-y-6">
      <PageHeader title={`ATS — Desa ${desa.name}`} description="Per posyandu" backHref={`/admin/rekap-ats/${kecId}`} />
      <DataTable columns={["Posyandu", "Total", "Putus", "Tidak Pernah", "Lulus Tdk Lanjut", "Aksi"]} dataLength={rows.length}
        emptyState={<div className="text-center py-8 text-muted-foreground text-sm">Belum ada data</div>}>
        {rows.map((r) => (
          <TableRow key={r.posyanduId} className="hover:bg-muted/30">
            <TableCell className="px-4 py-3.5 font-semibold text-sm">
              <Link href={`/admin/rekap-ats/${kecId}/${desaId}/${r.posyanduId}`} className="text-primary hover:underline">{r.posyanduName}</Link>
            </TableCell>
            <TableCell className="px-4 py-3.5 font-bold text-sm">{r.total}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-red-700">{r.putus}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-amber-700">{r.tidakPernah}</TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-blue-700">{r.lulus}</TableCell>
            <TableCell className="px-4 py-3.5">
              <Button asChild variant="outline" size="sm" className="text-xs font-bold">
                <Link href={`/admin/rekap-ats/${kecId}/${desaId}/${r.posyanduId}`}>Lihat</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </PageContainer>
  )
}
