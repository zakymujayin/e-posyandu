import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OpdManager } from "@/components/admin/master/opd-manager"

export default async function MasterOpdPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const opds = await prisma.opd.findMany({ orderBy: { sortOrder: "asc" } })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master OPD</h1>
        <p className="text-sm text-gray-500">Kelola data Organisasi Perangkat Daerah</p>
      </div>
      <OpdManager initialOpds={opds} />
    </div>
  )
}
