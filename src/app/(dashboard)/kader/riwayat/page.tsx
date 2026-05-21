import { auth } from "@/auth"
import { EmptyState } from "@/components/shared/empty-state"

export default async function KaderRiwayatPage() {
  const session = await auth()
  if (!session?.user) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Pengajuan</h1>
      <EmptyState
        title="Belum ada pengajuan"
        description="Pengajuan baru akan muncul di sini setelah Phase B selesai."
        icon="📋"
      />
    </div>
  )
}