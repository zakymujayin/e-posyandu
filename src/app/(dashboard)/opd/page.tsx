import { auth } from "@/auth"

export default async function OpdPage() {
  const session = await auth()
  if (!session?.user) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Dashboard {session.user.role}
      </h1>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <p className="text-gray-600">
          Halaman dalam pengembangan — Phase B membangun fitur utama.
        </p>
      </div>
    </div>
  )
}