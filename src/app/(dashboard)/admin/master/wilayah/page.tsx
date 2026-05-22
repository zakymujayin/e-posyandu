import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { WilayahManager } from "@/components/admin/master/wilayah-manager"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"

export default async function MasterWilayahPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const [kecamatans, desas, posyandus] = await Promise.all([
    prisma.kecamatan.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { desas: true } } },
    }),
    prisma.desa.findMany({
      orderBy: [{ kecamatanId: "asc" }, { name: "asc" }],
      include: { kecamatan: { select: { name: true } } },
    }),
    prisma.posyandu.findMany({
      orderBy: [{ desaId: "asc" }, { name: "asc" }],
      include: { desa: { select: { name: true, kecamatan: { select: { name: true } } } } },
    }),
  ])
  const serializedKecamatans = JSON.parse(JSON.stringify(kecamatans))
  const serializedDesas = JSON.parse(JSON.stringify(desas))
  const serializedPosyandus = JSON.parse(JSON.stringify(posyandus))

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Master Wilayah"
        description="Kelola data pembagian administratif kecamatan, desa, dan posyandu."
        backHref="/admin/master"
      />
      <WilayahManager
        initialKecamatans={serializedKecamatans}
        initialDesas={serializedDesas}
        initialPosyandus={serializedPosyandus}
      />
    </PageContainer>
  )
}

