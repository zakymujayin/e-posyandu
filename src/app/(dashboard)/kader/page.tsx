import { auth } from "@/auth"

export default async function KaderPage() {
  const session = await auth()
  if (!session?.user) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Selamat datang, {session.user.name}
      </h1>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <p className="text-blue-800">
          Dashboard kader dalam pengembangan. Phase B akan membangun form pengajuan.
        </p>
      </div>
    </div>
  )
}