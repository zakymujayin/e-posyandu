import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import type { PengajuanStatus } from "@/lib/messages"

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "MENUNGGU_VERIFIKASI", label: "Menunggu Verifikasi" },
  { value: "DALAM_PROSES_OPD", label: "Dalam Proses OPD" },
  { value: "MENUNGGU_APPROVAL_DPMD", label: "Menunggu Approval" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DITOLAK_DESA", label: "Ditolak Desa" },
  { value: "DITOLAK_OPD", label: "Ditolak OPD" },
]

export default async function KaderRiwayatPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const status = params.status ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const limit = 10

  const where = {
    kaderId: session.user.id,
    ...(status ? { status } : {}),
  }

  const [pengajuans, total] = await Promise.all([
    prisma.pengajuan.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        opd: { select: { name: true } },
        layananJenis: { select: { name: true } },
      },
    }),
    prisma.pengajuan.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Riwayat Pengajuan</h1>

      {/* Filter */}
      <form className="flex gap-2 flex-wrap">
        <select
          name="status"
          defaultValue={status}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 min-h-[40px]"
        >
          Filter
        </button>
      </form>

      {pengajuans.length === 0 ? (
        <EmptyState title="Tidak ada pengajuan" description="Belum ada pengajuan yang sesuai filter." />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">No. Tiket</th>
                  <th className="px-4 py-3 text-left font-medium">Nama Pelapor</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">OPD</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pengajuans.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-gray-900">{p.tiketNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.namaPelapor}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.opd.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status as PengajuanStatus} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                      {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Halaman {page} dari {totalPages} ({total} data)</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`?status=${status}&page=${page - 1}`} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50">
                    &larr; Sebelumnya
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`?status=${status}&page=${page + 1}`} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50">
                    Selanjutnya &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}