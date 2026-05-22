import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { WilayahManager } from "@/components/admin/master/wilayah-manager"

export default async function MasterWilayahPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const [kecamatans, desas] = await Promise.all([
    prisma.kecamatan.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { desas: true } } },
    }),
    prisma.desa.findMany({
      orderBy: [{ kecamatanId: "asc" }, { name: "asc" }],
      include: { kecamatan: { select: { name: true } } },
    }),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master Wilayah</h1>
        <p className="text-sm text-gray-500">Kelola data kecamatan dan desa</p>
      </div>
      <WilayahManager initialKecamatans={kecamatans} initialDesas={desas} />
    </div>
  )
}
