import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LayananManager } from "@/components/admin/master/layanan-manager"

export default async function MasterLayananPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const [opds, layanans] = await Promise.all([
    prisma.opd.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.layananJenis.findMany({
      orderBy: [{ opdId: "asc" }, { sortOrder: "asc" }],
      include: { opd: { select: { name: true } } },
    }),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master Layanan</h1>
        <p className="text-sm text-gray-500">Kelola jenis layanan per OPD</p>
      </div>
      <LayananManager initialLayanans={layanans} opds={opds} />
    </div>
  )
}
