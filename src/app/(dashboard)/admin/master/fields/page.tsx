import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { FieldsManager } from "@/components/admin/master/fields-manager"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"

export default async function MasterFieldsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const [opds, layanans, fields] = await Promise.all([
    prisma.opd.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.layananJenis.findMany({
      where: { isActive: true },
      orderBy: [{ opdId: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true, opdId: true },
    }),
    prisma.formField.findMany({
      orderBy: [{ layananJenisId: "asc" }, { sortOrder: "asc" }],
      include: { layananJenis: { select: { name: true, opd: { select: { name: true } } } } },
    }),
  ])
  const serializedOpds = JSON.parse(JSON.stringify(opds))
  const serializedLayanans = JSON.parse(JSON.stringify(layanans))
  const serializedFields = JSON.parse(JSON.stringify(fields))

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Master Formulir Kuesioner"
        description="Kelola isian/field kuesioner dinamis yang wajib diinput kader ketika mengajukan berkas usulan layanan."
        backHref="/admin/master"
      />
      <FieldsManager initialFields={serializedFields} opds={serializedOpds} layanans={serializedLayanans} />
    </PageContainer>
  )
}

