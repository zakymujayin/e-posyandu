import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Building2, List, FileQuestion, MapPin, Users } from "lucide-react"

export default async function MasterDataPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const [opdCount, layananCount, fieldCount, desaCount, userCount] = await Promise.all([
    prisma.opd.count(),
    prisma.layananJenis.count(),
    prisma.formField.count(),
    prisma.desa.count(),
    prisma.user.count(),
  ])

  const cards = [
    {
      href: "/admin/master/opd",
      icon: Building2,
      label: "OPD",
      count: opdCount,
      description: "Kelola data organisasi perangkat daerah",
      color: "bg-blue-50 text-blue-700",
    },
    {
      href: "/admin/master/layanan",
      icon: List,
      label: "Layanan",
      count: layananCount,
      description: "Kelola jenis layanan per OPD",
      color: "bg-purple-50 text-purple-700",
    },
    {
      href: "/admin/master/fields",
      icon: FileQuestion,
      label: "Form Fields",
      count: fieldCount,
      description: "Kelola field dinamis per layanan",
      color: "bg-amber-50 text-amber-700",
    },
    {
      href: "/admin/master/wilayah",
      icon: MapPin,
      label: "Wilayah",
      count: desaCount,
      description: "Kelola data kecamatan dan desa",
      color: "bg-green-50 text-green-700",
    },
    {
      href: "/admin/master/users",
      icon: Users,
      label: "Pengguna",
      count: userCount,
      description: "Kelola akun pengguna sistem",
      color: "bg-red-50 text-red-700",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
        <p className="text-sm text-gray-500">Kelola data referensi sistem E-Posyandu</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {card.label}
                    </h3>
                    <span className="text-2xl font-bold text-gray-700">{card.count}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
