import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { getSopInfo } from "@/lib/sop"
import type { PengajuanStatus } from "@/lib/messages"

export default async function PetugasDesaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const tab = params.tab === "sudah" ? "sudah" : "perlu"

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { desaId: true, desa: { select: { name: true } } },
  })

  if (!user?.desaId) {
    return (
      <div className="p-6 bg-red-50 rounded-xl text-red-700">
        Akun Anda belum terdaftar di desa. Hubungi admin.
      </div>
    )
  }

  const [menunggu, totalVerifikasi, totalDitolak] = await Promise.all([
    prisma.pengajuan.count({ where: { desaId: user.desaId, status: "MENUNGGU_VERIFIKASI" } }),
    prisma.pengajuan.count({ where: { desaId: user.desaId, status: { not: "MENUNGGU_VERIFIKASI" } } }),
    prisma.pengajuan.count({ where: { desaId: user.desaId, status: { in: ["DITOLAK_DESA", "DITOLAK_OPD"] } } }),
  ])

  const wherePerlu = { desaId: user.desaId, status: "MENUNGGU_VERIFIKASI" }
  const whereSudah = {
    desaId: user.desaId,
    status: { notIn: ["MENUNGGU_VERIFIKASI"] },
  }

  const pengajuans = await prisma.pengajuan.findMany({
    where: tab === "perlu" ? wherePerlu : whereSudah,
    orderBy: { submittedAt: "desc" },
    take: 20,
    include: {
      opd: { select: { name: true } },
      layananJenis: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Petugas Desa</h1>
        <p className="text-sm text-gray-500">{user.desa?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Perlu Verifikasi", value: menunggu, color: menunggu > 0 ? "text-red-600" : "text-gray-900" },
          { label: "Sudah Diproses", value: totalVerifikasi, color: "text-blue-600" },
          { label: "Total Ditolak", value: totalDitolak, color: "text-gray-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { value: "perlu", label: `Perlu Diverifikasi (${menunggu})` },
          { value: "sudah", label: "Sudah Diproses" },
        ].map((t) => (
          <Link
            key={t.value}
            href={`?tab=${t.value}`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* List */}
      {pengajuans.length === 0 ? (
        <EmptyState
          title={tab === "perlu" ? "Tidak ada pengajuan yang perlu diverifikasi" : "Belum ada pengajuan yang diproses"}
          description="Data akan muncul saat ada pengajuan baru dari kader posyandu."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">No. Tiket</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Pelapor</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">OPD</th>
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
                  <td className="px-4 py-3"><StatusBadge status={p.status as PengajuanStatus} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/petugas-desa/verifikasi/${p.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      {tab === "perlu" ? "Verifikasi →" : "Detail →"}
                    </Link>
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