import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/shared/stat-card"
import { Plus, Baby, Scale, CheckCircle2, AlertCircle } from "lucide-react"
import { differenceInMonths } from "date-fns"

export default async function BalitaListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "POSYANDU") redirect("/login")

  const { page: pageParam, search = "" } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1"))
  const limit = 10

  const userWithPosyandu = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { posyanduId: true },
  })

  if (!userWithPosyandu?.posyanduId) {
    return (
      <PageContainer>
        <EmptyState title="Posyandu belum terhubung" description="Hubungi admin untuk menghubungkan akun ke posyandu." />
      </PageContainer>
    )
  }

  const posyanduId = userWithPosyandu.posyanduId
  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const where = {
    posyanduId,
    isActive: true,
    ...(search ? { namaBalita: { contains: search, mode: "insensitive" as const } } : {}),
  }

  const [total, totalBalita, ditimbangBulanIni, balitas] = await Promise.all([
    prisma.balita.count({ where }),
    prisma.balita.count({ where: { posyanduId, isActive: true } }),
    prisma.penimbanganBalita.count({ where: { bulan: bulanIni, tahun: tahunIni, balita: { posyanduId } } }),
    prisma.balita.findMany({
      where,
      orderBy: { namaBalita: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        penimbangans: {
          where: { bulan: bulanIni, tahun: tahunIni },
          take: 1,
        },
      },
    }),
  ])

  const totalPages = Math.ceil(total / limit)
  const belumDitimbang = totalBalita - ditimbangBulanIni

  const stats = [
    { label: "Total Terdaftar", value: totalBalita, icon: Baby, variant: "primary" as const },
    { label: "Ditimbang Bulan Ini", value: ditimbangBulanIni, icon: CheckCircle2, variant: "secondary" as const },
    { label: "Belum Ditimbang", value: belumDitimbang, icon: AlertCircle, variant: "accent" as const },
  ]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Data Balita"
        description="Daftar balita yang terdaftar di posyandu Anda"
        backHref="/posyandu"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} title={s.label} value={s.value} icon={s.icon} colorVariant={s.variant} />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <form method="GET" className="flex-1 max-w-sm">
          <input
            name="search"
            defaultValue={search}
            placeholder="Cari nama anak..."
            className="w-full h-9 rounded-lg border border-border bg-card shadow-xs px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </form>
        <Button asChild className="gap-2 font-bold">
          <Link href="/posyandu/balita/tambah">
            <Plus className="w-4 h-4" /> Tambah Balita
          </Link>
        </Button>
      </div>

      <DataTable
        columns={["Nama Anak", "Usia", "Jenis Kelamin", "Status Bulan Ini", "Aksi"]}
        dataLength={balitas.length}
        emptyState={
          <EmptyState
            title="Belum ada data balita"
            description="Tambahkan data balita pertama untuk mulai mencatat penimbangan."
          />
        }
      >
        {balitas.map((b) => {
          const usia = differenceInMonths(now, b.tanggalLahir)
          const sudahDitimbang = b.penimbangans.length > 0
          return (
            <TableRow key={b.id} className="transition-colors hover:bg-muted/30">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">
                <Link href={`/posyandu/balita/${b.id}`} className="text-primary hover:underline">
                  {b.namaBalita}
                </Link>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">{b.namaOrangTua}</p>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
                {usia} bulan
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <Badge variant="outline" className="text-xs">
                  {b.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3.5">
                {sudahDitimbang ? (
                  <Badge className="text-xs bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/15">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Sudah Ditimbang
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-amber-700 border-amber-400/50">
                    <Scale className="w-3 h-3 mr-1" /> Belum Ditimbang
                  </Badge>
                )}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <Button asChild variant="outline" size="sm" className="text-xs font-bold">
                  <Link href={`/posyandu/balita/${b.id}`}>Detail</Link>
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </DataTable>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}${search ? `&search=${search}` : ""}`}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold border transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
