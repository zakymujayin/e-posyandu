import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UsersManager } from "@/components/admin/master/users-manager"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"

export default async function MasterUsersPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const [users, desas, kecamatans, opds, posyandus] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, username: true, role: true,
        isActive: true, createdAt: true, lastLoginAt: true,
        desa: { select: { name: true } },
        kecamatan: { select: { name: true } },
        opd: { select: { name: true } },
        posyandu: { select: { name: true } },
      },
    }),
    prisma.desa.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, kecamatan: { select: { name: true } } } }),
    prisma.kecamatan.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.opd.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.posyandu.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ])
  const serializedUsers = JSON.parse(JSON.stringify(users))
  const serializedDesas = JSON.parse(JSON.stringify(desas))
  const serializedKecamatans = JSON.parse(JSON.stringify(kecamatans))
  const serializedOpds = JSON.parse(JSON.stringify(opds))
  const serializedPosyandus = JSON.parse(JSON.stringify(posyandus))

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola hak akses dan akun seluruh pengguna sistem meliputi Kader, Petugas Desa, Petugas OPD, dan Admin."
        backHref="/admin/master"
      />
      <UsersManager
        initialUsers={serializedUsers}
        desas={serializedDesas}
        kecamatans={serializedKecamatans}
        opds={serializedOpds}
        posyandus={serializedPosyandus}
      />
    </PageContainer>
  )
}
