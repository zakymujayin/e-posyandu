import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LayananManager } from "@/components/admin/master/layanan-manager"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"

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
  const serializedOpds = JSON.parse(JSON.stringify(opds))
  const serializedLayanans = JSON.parse(JSON.stringify(layanans))

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Master Jenis Layanan"
        description="Kelola kategori layanan kesehatan dan urusan kependudukan posyandu yang diampu oleh masing-masing OPD dinas."
        backHref="/admin/master"
      />
      <LayananManager initialLayanans={serializedLayanans} opds={serializedOpds} />
    </PageContainer>
  )
}

