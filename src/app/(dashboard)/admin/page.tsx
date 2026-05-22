import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import type { PengajuanStatus } from "@/lib/messages"

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const filterStatus = params.status ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const limit = 15

  const [total, menungguVerifikasi, dalamProses, menungguApproval, selesai, ditolak] = await Promise.all([
    prisma.pengajuan.count(),
    prisma.pengajuan.count({ where: { status: "MENUNGGU_VERIFIKASI" } }),
    prisma.pengajuan.count({ where: { status: "DALAM_PROSES_OPD" } }),
    prisma.pengajuan.count({ where: { status: "MENUNGGU_APPROVAL_DPMD" } }),
    prisma.pengajuan.count({ where: { status: "SELESAI" } }),
    prisma.pengajuan.count({ where: { status: { in: ["DITOLAK_DESA", "DITOLAK_OPD"] } } }),
  ])

  const alertItems = await prisma.pengajuan.findMany({
    where: { status: "MENUNGGU_APPROVAL_DPMD" },
    orderBy: { submittedAt: "asc" },
    take: 5,
    select: { id: true, tiketNumber: true, opd: { select: { name: true } }, submittedAt: true },
  })

  const where = filterStatus ? { status: filterStatus } : {}
  const [pengajuans, totalFiltered] = await Promise.all([
    prisma.pengajuan.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        opd: { select: { name: true } },
        layananJenis: { select: { name: true } },
        desa: { select: { name: true } },
      },
    }),
    prisma.pengajuan.count({ where }),
  ])

  const totalPages = Math.ceil(totalFiltered / limit)

  const summaryCards = [
    { label: "Total Pengajuan", value: total, color: "text-gray-900" },
    { label: "Menunggu Verifikasi", value: menungguVerifikasi, color: "text-yellow-600" },
    { label: "Dalam Proses OPD", value: dalamProses, color: "text-blue-600" },
    { label: "Menunggu Approval", value: menungguApproval, color: "text-orange-600", urgent: menungguApproval > 0 },
    { label: "Selesai", value: selesai, color: "text-green-600" },
    { label: "Ditolak", value: ditolak, color: "text-red-600" },
  ]

  const STATUS_OPTIONS = [
    { value: "", label: "Semua Status" },
    { value: "MENUNGGU_VERIFIKASI", label: "Menunggu Verifikasi" },
    { value: "DALAM_PROSES_OPD", label: "Dalam Proses OPD" },
    { value: "MENUNGGU_APPROVAL_DPMD", label: "Menunggu Approval" },
    { value: "SELESAI", label: "Selesai" },
    { value: "DITOLAK_DESA", label: "Ditolak Desa" },
    { value: "DITOLAK_OPD", label: "Ditolak OPD" },
  ]

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin DPMD</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-xl border p-4 ${s.urgent ? "border-orange-300 bg-orange-50" : "border-gray-200"}`}
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Alert — Perlu Approval */}
      {alertItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
          <h2 className="font-semibold text-orange-800 text-sm">
            ⚠️ {menungguApproval} pengajuan menunggu approval Anda
          </h2>
          <div className="space-y-1">
            {alertItems.map((p) => (
              <Link
                key={p.id}
                href={`/admin/pengajuan/${p.id}`}
                className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 hover:bg-orange-50 transition-colors"
              >
                <span className="font-mono font-medium text-gray-900">{p.tiketNumber}</span>
                <span className="text-gray-500">{p.opd.name}</span>
                <span className="text-gray-400 text-xs">
                  {format(new Date(p.submittedAt), "d MMM", { locale: localeId })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filter + Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-gray-900">Semua Pengajuan</h2>
          <form className="flex gap-2">
            <select name="status" defaultValue={filterStatus} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 min-h-[40px]">
              Filter
            </button>
          </form>
        </div>

        {pengajuans.length === 0 ? (
          <EmptyState title="Tidak ada pengajuan" />
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">No. Tiket</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Pelapor</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">OPD</th>
                    <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Desa</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Tanggal</th>
                    <th className="px-4 py-3 text-left font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pengajuans.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">{p.tiketNumber}</td>
                      <td className="px-4 py-3 text-gray-700 hidden md:table-cell">{p.namaPelapor}</td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.opd.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{p.desa.name}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status as PengajuanStatus} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                        {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/pengajuan/${p.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                          Detail →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Halaman {page} dari {totalPages}</span>
                <div className="flex gap-2">
                  {page > 1 && <Link href={`?status=${filterStatus}&page=${page - 1}`} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50">&larr;</Link>}
                  {page < totalPages && <Link href={`?status=${filterStatus}&page=${page + 1}`} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50">&rarr;</Link>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}