import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { hitungUsiaAnak } from "@/lib/utils-ats"
import { Button } from "@/components/ui/button"

export default async function ATSListPerPosyanduDesaPage({ params }: { params: Promise<{ posyanduId: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PETUGAS_DESA") redirect("/login")

  const { posyanduId } = await params
  const petugas = await prisma.user.findUnique({ where: { id: session.user.id }, select: { desaId: true } })

  const posyandu = await prisma.posyandu.findFirst({ where: { id: posyanduId, desaId: petugas?.desaId ?? "" }, select: { name: true } })
  if (!posyandu) notFound()

  const records = await prisma.anakTidakSekolah.findMany({
    where: { posyanduId, isActive: true },
    orderBy: { namaAnak: "asc" },
  })

  const STATUS_COLORS: Record<string, string> = {
    "Putus Sekolah": "bg-red-500/10 text-red-700 border-red-500/30",
    "Tidak Pernah Sekolah": "bg-amber-500/10 text-amber-700 border-amber-500/30",
    "Lulus Tidak Melanjutkan": "bg-blue-500/10 text-blue-700 border-blue-500/30",
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader title={`ATS — ${posyandu.name}`} description="Daftar anak tidak sekolah (view only)" backHref="/petugas-desa/rekap-ats" />
      <DataTable columns={["Nama Anak", "Usia", "Status", "Alasan", "Aksi"]} dataLength={records.length}
        emptyState={<div className="text-center py-8 text-muted-foreground text-sm">Belum ada data ATS di posyandu ini</div>}>
        {records.map((r) => (
          <TableRow key={r.id} className="hover:bg-muted/30">
            <TableCell className="px-4 py-3.5 font-semibold text-sm">
              <Link href={`/petugas-desa/rekap-ats/${posyanduId}/${r.id}`} className="text-primary hover:underline">{r.namaAnak}</Link>
            </TableCell>
            <TableCell className="px-4 py-3.5 text-sm">{hitungUsiaAnak(new Date(r.tanggalLahir))} tahun</TableCell>
            <TableCell className="px-4 py-3.5"><Badge className={`text-xs ${STATUS_COLORS[r.statusSekolah] ?? ""}`}>{r.statusSekolah}</Badge></TableCell>
            <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">{r.alasanTidakSekolah}</TableCell>
            <TableCell className="px-4 py-3.5">
              <Button asChild variant="outline" size="sm" className="text-xs font-bold">
                <Link href={`/petugas-desa/rekap-ats/${posyanduId}/${r.id}`}>Detail</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </PageContainer>
  )
}
