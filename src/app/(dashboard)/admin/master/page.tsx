import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Building2, List, FileQuestion, MapPin, Users, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"

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
      label: "OPD Dinas",
      count: opdCount,
      description: "Kelola data organisasi perangkat daerah kab.",
      color: "bg-primary/10 text-primary border-primary/20",
    },
    {
      href: "/admin/master/layanan",
      icon: List,
      label: "Jenis Layanan",
      count: layananCount,
      description: "Kelola jenis layanan terintegrasi per dinas",
      color: "bg-violet-500/10 text-violet-700 border-violet-500/20",
    },
    {
      href: "/admin/master/fields",
      icon: FileQuestion,
      label: "Formulir Dinamis",
      count: fieldCount,
      description: "Kelola field kuesioner dinamis per layanan",
      color: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    },
    {
      href: "/admin/master/wilayah",
      icon: MapPin,
      label: "Wilayah Desa",
      count: desaCount,
      description: "Kelola data kecamatan, posyandu, dan desa",
      color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    },
    {
      href: "/admin/master/users",
      icon: Users,
      label: "Manajemen User",
      count: userCount,
      description: "Kelola seluruh akun petugas desa, OPD, dan admin",
      color: "bg-rose-500/10 text-rose-700 border-rose-500/20",
    },
  ]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Pusat Master Data"
        description="Kelola dan konfigurasi seluruh data referensi fundamental sistem E-Posyandu."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-card border border-border rounded-2xl p-5 shadow-xs transition-all duration-300 hover:shadow-sm hover:border-primary/40 hover:-translate-y-0.5 flex flex-col justify-between select-none"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl border ${card.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      {card.label}
                    </h3>
                    <span className="text-xl font-bold text-foreground font-mono bg-muted/40 px-2 py-0.5 rounded-lg border border-border/50 text-xs">
                      {card.count}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-semibold">
                    {card.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                <span>Konfigurasi Referensi</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          )
        })}
      </div>
    </PageContainer>
  )
}
