import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { differenceInMonths } from "date-fns"
import { CheckCircle2, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle as AlertCircleIcon } from "lucide-react"

export default async function RekapBalitaKecPosyanduPage({
  params,
}: {
  params: Promise<{ desaId: string; posyanduId: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PETUGAS_KECAMATAN") redirect("/login")

  const { desaId, posyanduId } = await params

  const petugas = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kecamatanId: true },
  })

  if (!petugas?.kecamatanId) return redirect("/kecamatan/rekap-balita")

  const posyandu = await prisma.posyandu.findUnique({
    where: { id: posyanduId },
    select: {
      name: true,
      desaId: true,
      desa: { select: { name: true, kecamatanId: true } },
    },
  })
  if (!posyandu || posyandu.desaId !== desaId || posyandu.desa.kecamatanId !== petugas.kecamatanId)
    redirect("/kecamatan/rekap-balita")

  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const balitas = await prisma.balita.findMany({
    where: { posyanduId, isActive: true },
    select: {
      id: true,
      namaBalita: true,
      jenisKelamin: true,
      tanggalLahir: true,
      namaOrangTua: true,
      penimbangans: {
        where: { bulan: bulanIni, tahun: tahunIni },
        select: { id: true, beratBadan: true, statusGizi: true },
        take: 1,
      },
    },
    orderBy: { namaBalita: "asc" },
  })

  const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][bulanIni - 1]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={posyandu.name}
        description={`Desa ${posyandu.desa.name} · Status penimbangan ${BULAN_LABEL} ${tahunIni}`}
        backHref={`/kecamatan/rekap-balita/${desaId}`}
      />

      <DataTable
        columns={["Nama Balita", "Usia", "JK", "Orang Tua", "Ditimbang", "BB", "Status Gizi"]}
        dataLength={balitas.length}
      >
        {balitas.map((b) => {
          const usia = differenceInMonths(now, b.tanggalLahir)
          const ditimbang = b.penimbangans.length > 0
          return (
            <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">
                <Link href={`/kecamatan/rekap-balita/balita/${b.id}`} className="hover:text-blue-600 hover:underline transition-colors">
                  {b.namaBalita}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">{usia} bln</TableCell>
              <TableCell className="px-4 py-3.5 text-sm">{b.jenisKelamin === "LAKI_LAKI" ? "L" : "P"}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">{b.namaOrangTua}</TableCell>
              <TableCell className="px-4 py-3.5 text-center">
                {ditimbang ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-600 inline" />
                )}
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">{b.penimbangans[0]?.beratBadan ? `${b.penimbangans[0].beratBadan} kg` : "—"}</TableCell>
              <TableCell className="px-4 py-3.5">
                {b.penimbangans[0]?.statusGizi ? (
                  <Badge variant="outline" className="text-xs">{b.penimbangans[0].statusGizi}</Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </DataTable>
    </PageContainer>
  )
}
