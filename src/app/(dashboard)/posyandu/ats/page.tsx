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
import { Plus, GraduationCap, UserX, BookOpen, CheckCircle2 } from "lucide-react"
import { hitungUsiaAnak } from "@/lib/utils-ats"

export default async function ATSListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; statusSekolah?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "POSYANDU") redirect("/login")

  const { page: pageParam, search = "", statusSekolah = "" } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1"))
  const limit = 10

  const userWithPosyandu = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      posyanduId: true,
      posyandu: { select: { name: true, desa: { select: { name: true, kecamatan: { select: { name: true } } } } } },
    },
  })

  if (!userWithPosyandu?.posyanduId) {
    return (
      <PageContainer>
        <EmptyState title="Posyandu belum terhubung" description="Hubungi admin untuk menghubungkan akun ke posyandu." />
      </PageContainer>
    )
  }

  const posyanduId = userWithPosyandu.posyanduId

  const baseWhere = { posyanduId, isActive: true }
  const filterWhere = {
    ...baseWhere,
    ...(search ? { namaAnak: { contains: search, mode: "insensitive" as const } } : {}),
    ...(statusSekolah ? { statusSekolah } : {}),
  }

  const [total, totalAll, putus, tidakPernah, lulus, records] = await Promise.all([
    prisma.anakTidakSekolah.count({ where: filterWhere }),
    prisma.anakTidakSekolah.count({ where: baseWhere }),
    prisma.anakTidakSekolah.count({ where: { ...baseWhere, statusSekolah: "Putus Sekolah" } }),
    prisma.anakTidakSekolah.count({ where: { ...baseWhere, statusSekolah: "Tidak Pernah Sekolah" } }),
    prisma.anakTidakSekolah.count({ where: { ...baseWhere, statusSekolah: "Lulus Tidak Melanjutkan" } }),
    prisma.anakTidakSekolah.findMany({
      where: filterWhere,
      orderBy: { namaAnak: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  const stats = [
    { label: "Total Terdaftar", value: totalAll, icon: GraduationCap, variant: "primary" as const },
    { label: "Putus Sekolah", value: putus, icon: UserX, variant: "destructive" as const },
    { label: "Tidak Pernah Sekolah", value: tidakPernah, icon: BookOpen, variant: "accent" as const },
    { label: "Lulus Tdk Lanjut", value: lulus, icon: CheckCircle2, variant: "secondary" as const },
  ]

  const STATUS_COLORS: Record<string, string> = {
    "Putus Sekolah": "bg-red-500/10 text-red-700 border-red-500/30",
    "Tidak Pernah Sekolah": "bg-amber-500/10 text-amber-700 border-amber-500/30",
    "Lulus Tidak Melanjutkan": "bg-blue-500/10 text-blue-700 border-blue-500/30",
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Data Anak Tidak Sekolah"
        description={`Posyandu ${userWithPosyandu.posyandu?.name ?? ""}`}
        backHref="/posyandu"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} title={s.label} value={s.value} icon={s.icon} colorVariant={s.variant} />)}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <form method="GET" className="flex gap-2 flex-1 max-w-md">
          <input name="search" defaultValue={search} placeholder="Cari nama anak..."
            className="flex-1 h-9 rounded-lg border border-border bg-card shadow-xs px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <select name="statusSekolah" defaultValue={statusSekolah}
            className="h-9 rounded-lg border border-border bg-card text-sm px-2 focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Semua Status</option>
            <option value="Putus Sekolah">Putus Sekolah</option>
            <option value="Tidak Pernah Sekolah">Tidak Pernah Sekolah</option>
            <option value="Lulus Tidak Melanjutkan">Lulus Tidak Melanjutkan</option>
          </select>
        </form>
        <Button asChild className="gap-2 font-bold shrink-0">
          <Link href="/posyandu/ats/tambah"><Plus className="w-4 h-4" /> Tambah Data ATS</Link>
        </Button>
      </div>

      <DataTable
        columns={["Nama Anak", "Usia", "Jenis Kelamin", "Pendidikan", "Status", "Aksi"]}
        dataLength={records.length}
        emptyState={<EmptyState title="Belum ada data ATS" description="Tambahkan data anak tidak sekolah pertama." />}
      >
        {records.map((r) => {
          const usia = hitungUsiaAnak(new Date(r.tanggalLahir))
          return (
            <TableRow key={r.id} className="transition-colors hover:bg-muted/30">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">
                <Link href={`/posyandu/ats/${r.id}`} className="text-primary hover:underline">{r.namaAnak}</Link>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">{r.namaOrangTua}</p>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">{usia} tahun</TableCell>
              <TableCell className="px-4 py-3.5">
                <Badge variant="outline" className="text-xs">{r.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}</Badge>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">{r.pendidikanTerakhir}</TableCell>
              <TableCell className="px-4 py-3.5">
                <Badge className={`text-xs ${STATUS_COLORS[r.statusSekolah] ?? ""}`}>{r.statusSekolah}</Badge>
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <div className="flex gap-1">
                  <Button asChild variant="outline" size="sm" className="text-xs font-bold">
                    <Link href={`/posyandu/ats/${r.id}`}>Detail</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="text-xs font-bold">
                    <Link href={`/posyandu/ats/${r.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </DataTable>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`?page=${p}${search ? `&search=${search}` : ""}${statusSekolah ? `&statusSekolah=${statusSekolah}` : ""}`}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold border transition-colors ${p === page ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted/40"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
