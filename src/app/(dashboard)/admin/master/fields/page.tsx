import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { FieldsManager } from "@/components/admin/master/fields-manager"

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master Form Fields</h1>
        <p className="text-sm text-gray-500">Kelola field dinamis formulir per layanan</p>
      </div>
      <FieldsManager initialFields={fields} opds={opds} layanans={layanans} />
    </div>
  )
}
