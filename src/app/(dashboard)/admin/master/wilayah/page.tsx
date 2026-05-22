import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { WilayahManager } from "@/components/admin/master/wilayah-manager"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"

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
  const serializedKecamatans = JSON.parse(JSON.stringify(kecamatans))
  const serializedDesas = JSON.parse(JSON.stringify(desas))

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Master Wilayah Wilayah"
        description="Kelola data pembagian administratif kecamatan dan desa untuk klasterisasi pelaporan posyandu."
        backHref="/admin/master"
      />
      <WilayahManager initialKecamatans={serializedKecamatans} initialDesas={serializedDesas} />
    </PageContainer>
  )
}

