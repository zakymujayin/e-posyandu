import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UsersManager } from "@/components/admin/master/users-manager"

export default async function MasterUsersPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const [users, desas, kecamatans, opds, posyandus] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true,
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
        <p className="text-sm text-gray-500">Kelola akun pengguna sistem</p>
      </div>
      <UsersManager
        initialUsers={users}
        desas={desas}
        kecamatans={kecamatans}
        opds={opds}
        posyandus={posyandus}
      />
    </div>
  )
}
