import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OpdManager } from "@/components/admin/master/opd-manager"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"

export default async function MasterOpdPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const opds = await prisma.opd.findMany({ orderBy: { sortOrder: "asc" } })
  const serializedOpds = JSON.parse(JSON.stringify(opds))

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Master Data OPD"
        description="Kelola data Organisasi Perangkat Daerah sebagai penanggung jawab tindak lanjut usulan berkas."
        backHref="/admin/master"
      />
      <OpdManager initialOpds={serializedOpds} />
    </PageContainer>
  )
}

