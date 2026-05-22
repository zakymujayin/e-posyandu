import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import type { PengajuanStatus } from "@/lib/messages"

export default async function KecamatanPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; desaId?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const filterStatus = params.status ?? ""
  const filterDesa = params.desaId ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const limit = 15

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kecamatanId: true, kecamatan: { select: { name: true, desas: { select: { id: true, name: true } } } } },
  })

  if (!user?.kecamatanId) {
    return (
      <div className="p-6 bg-red-50 rounded-xl text-red-700">
        Akun Anda belum terdaftar di kecamatan. Hubungi admin.
      </div>
    )
  }

  const desaIds = user.kecamatan?.desas.map((d) => d.id) ?? []

  const where = {
    desaId: filterDesa ? filterDesa : { in: desaIds },
    ...(filterStatus ? { status: filterStatus } : {}),
  }

  const [total, dalamProses, selesai, ditolak] = await Promise.all([
    prisma.pengajuan.count({ where: { desaId: { in: desaIds } } }),
    prisma.pengajuan.count({ where: { desaId: { in: desaIds }, status: { in: ["MENUNGGU_VERIFIKASI", "DALAM_PROSES_OPD", "MENUNGGU_APPROVAL_DPMD"] } } }),
    prisma.pengajuan.count({ where: { desaId: { in: desaIds }, status: "SELESAI" } }),
    prisma.pengajuan.count({ where: { desaId: { in: desaIds }, status: { in: ["DITOLAK_DESA", "DITOLAK_OPD"] } } }),
  ])

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitoring Kecamatan</h1>
        <p className="text-sm text-gray-500">{user.kecamatan?.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Pengajuan", value: total, color: "text-gray-900" },
          { label: "Dalam Proses", value: dalamProses, color: "text-blue-600" },
          { label: "Selesai", value: selesai, color: "text-green-600" },
          { label: "Ditolak", value: ditolak, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <form className="flex gap-2 flex-wrap">
        <select name="desaId" defaultValue={filterDesa} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Semua Desa</option>
          {user.kecamatan?.desas.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={filterStatus} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Semua Status</option>
          <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
          <option value="DALAM_PROSES_OPD">Dalam Proses OPD</option>
          <option value="MENUNGGU_APPROVAL_DPMD">Menunggu Approval</option>
          <option value="SELESAI">Selesai</option>
          <option value="DITOLAK_DESA">Ditolak</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 min-h-[40px]">
          Filter
        </button>
      </form>

      {pengajuans.length === 0 ? (
        <EmptyState title="Tidak ada pengajuan" />
      ) : (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}