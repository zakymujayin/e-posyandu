import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"
import type { PengajuanStatus } from "@/lib/messages"

export default async function KaderPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const kader = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { posyandu: { include: { desa: true } } },
  })

  const opds = await prisma.opd.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  })

  const [total, dalamProses, selesai, ditolak] = await Promise.all([
    prisma.pengajuan.count({ where: { kaderId: session.user.id } }),
    prisma.pengajuan.count({ where: { kaderId: session.user.id, status: { in: ["MENUNGGU_VERIFIKASI", "DALAM_PROSES_OPD", "MENUNGGU_APPROVAL_DPMD"] } } }),
    prisma.pengajuan.count({ where: { kaderId: session.user.id, status: "SELESAI" } }),
    prisma.pengajuan.count({ where: { kaderId: session.user.id, status: { in: ["DITOLAK_DESA", "DITOLAK_OPD"] } } }),
  ])

  const recentPengajuan = await prisma.pengajuan.findMany({
    where: { kaderId: session.user.id },
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: { opd: { select: { name: true } }, layananJenis: { select: { name: true } } },
  })

  const stats = [
    { label: "Total Pengajuan", value: total, color: "text-gray-900" },
    { label: "Dalam Proses", value: dalamProses, color: "text-blue-600" },
    { label: "Selesai", value: selesai, color: "text-green-600" },
    { label: "Ditolak", value: ditolak, color: "text-red-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Selamat datang, {session.user.name}</h1>
        {kader?.posyandu && (
          <p className="text-sm text-gray-500 mt-1">
            Posyandu: {kader.posyandu.name} — {kader.posyandu.desa?.name}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* OPD Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Buat Pengajuan Baru</h2>
        <p className="text-sm text-gray-500 mb-4">
          Pilih OPD yang sesuai dengan jenis layanan atau pengaduan masyarakat:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {opds.map((opd) => (
            <Link
              key={opd.id}
              href={`/kader/ajukan/${opd.id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group"
              style={{ borderLeftColor: opd.color ?? "#3B82F6", borderLeftWidth: 4 }}
            >
              <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                {opd.name}
              </p>
              {opd.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{opd.description}</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Pengajuan Terbaru</h2>
          <Link href="/kader/riwayat" className="text-sm text-blue-600 hover:underline">
            Lihat Semua
          </Link>
        </div>

        {recentPengajuan.length === 0 ? (
          <EmptyState title="Belum ada pengajuan" description="Pilih OPD di atas untuk membuat pengajuan pertama." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">No. Tiket</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">OPD</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPengajuan.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">{p.tiketNumber}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.opd.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status as PengajuanStatus} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                      {formatDistanceToNow(new Date(p.submittedAt), { addSuffix: true, locale: localeId })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}