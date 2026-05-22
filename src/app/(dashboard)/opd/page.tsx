import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import type { PengajuanStatus } from "@/lib/messages"

const TABS = [
  { value: "proses", label: "Perlu Ditindaklanjuti", status: "DALAM_PROSES_OPD" },
  { value: "menunggu", label: "Menunggu Approval", status: "MENUNGGU_APPROVAL_DPMD" },
  { value: "selesai", label: "Selesai", status: "SELESAI" },
]

export default async function OpdPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const tab = TABS.find((t) => t.value === params.tab) ?? TABS[0]

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { opdId: true, opd: { select: { name: true } } },
  })

  if (!user?.opdId) {
    return (
      <div className="p-6 bg-red-50 rounded-xl text-red-700">
        Akun Anda belum terdaftar di OPD. Hubungi admin.
      </div>
    )
  }

  const counts = await Promise.all(
    TABS.map((t) => prisma.pengajuan.count({ where: { opdId: user.opdId!, status: t.status } }))
  )

  const pengajuans = await prisma.pengajuan.findMany({
    where: { opdId: user.opdId, status: tab.status },
    orderBy: { submittedAt: "desc" },
    take: 20,
    include: {
      layananJenis: { select: { name: true } },
      desa: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Petugas OPD</h1>
        <p className="text-sm text-gray-500">{user.opd?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {TABS.map((t, i) => (
          <div key={t.value} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{t.label}</p>
            <p className={`text-2xl font-bold mt-1 ${counts[i] > 0 && i === 0 ? "text-blue-600" : "text-gray-900"}`}>
              {counts[i]}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
        {TABS.map((t, i) => (
          <Link
            key={t.value}
            href={`?tab=${t.value}`}
            className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              tab.value === t.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label} ({counts[i]})
          </Link>
        ))}
      </div>

      {pengajuans.length === 0 ? (
        <EmptyState title={`Tidak ada pengajuan "${tab.label}"`} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">No. Tiket</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Pelapor</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Layanan</th>
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
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.layananJenis.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status as PengajuanStatus} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {format(new Date(p.submittedAt), "d MMM yyyy", { locale: localeId })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/opd/tindak-lanjut/${p.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      {tab.value === "proses" ? "Tindak Lanjut →" : "Detail →"}
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