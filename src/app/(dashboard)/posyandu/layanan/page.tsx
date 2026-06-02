import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"
import { CardTitle, MutedText } from "@/components/ui/typography"
import {
  ArrowRight,
  HeartPulse,
  GraduationCap,
  HardHat,
  Home as HomeIcon,
  Building2,
  Shield,
  HandHeart,
  HelpCircle,
} from "lucide-react"

const OPD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "heart-pulse": HeartPulse,
  "book-open": GraduationCap,
  "building": HardHat,
  "home": HomeIcon,
  "shield": Shield,
  "hand-heart": HandHeart,
}

export default async function LayananPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "POSYANDU") redirect("/login")

  const opds = await prisma.opd.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  })

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Pilih Layanan"
        description="Pilih OPD yang sesuai dengan jenis layanan atau pengaduan masyarakat yang akan diajukan."
        backHref="/posyandu"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Layanan Kecamatan Card — selalu tampil */}
        <Link
            href="/posyandu/ajukan/kecamatan"
            className="group relative flex flex-col overflow-hidden rounded-xl bg-card border border-teal-300 dark:border-teal-800 transition-all duration-300 hover:shadow-lg hover:border-teal-400 dark:hover:border-teal-600 hover:-translate-y-1"
          >
            <div className="h-1.5 w-full shrink-0 transition-all duration-300 group-hover:h-2 bg-teal-500" />

            <div className="relative flex flex-col flex-1 p-5 md:p-6 gap-4 md:gap-5">
              <Building2 className="absolute -right-3 -top-3 size-28 text-teal-500/10 dark:text-teal-400/10 pointer-events-none transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />

              <div
                className="size-14 md:size-16 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:rotate-2"
                style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.12), rgba(20,184,166,0.04))", color: "#14b8a6" }}
              >
                <Building2 className="size-7 md:size-8" />
              </div>

              <div className="flex-1 space-y-1.5">
                <CardTitle className="text-sm md:text-[16px] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-200">
                  Layanan Kecamatan
                </CardTitle>
                <MutedText className="line-clamp-2 leading-relaxed text-xs md:text-sm">
                  Layanan yang menjadi kewenangan kecamatan. Diselesaikan langsung oleh Petugas Kecamatan tanpa perlu diteruskan ke OPD.
                </MutedText>
              </div>

              <div className="flex items-center gap-1.5 mt-auto pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-teal-300/50 dark:border-teal-700/50 text-[11px] md:text-[12px] font-bold text-teal-600 dark:text-teal-400 group-hover:bg-teal-500/10 transition-all duration-300">
                  Pilih Layanan
                  <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>

        {/* Layanan Desa Card — selalu tampil */}
        <Link
            href="/posyandu/ajukan/desa"
            className="group relative flex flex-col overflow-hidden rounded-xl bg-card border border-blue-300 dark:border-blue-800 transition-all duration-300 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 hover:-translate-y-1"
          >
            {/* Top accent bar */}
            <div className="h-1.5 w-full shrink-0 transition-all duration-300 group-hover:h-2 bg-blue-500" />

            <div className="relative flex flex-col flex-1 p-5 md:p-6 gap-4 md:gap-5">
              {/* Decorative watermark */}
              <HomeIcon className="absolute -right-3 -top-3 size-28 text-blue-500/10 dark:text-blue-400/10 pointer-events-none transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />

              {/* Icon */}
              <div
                className="size-14 md:size-16 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:rotate-2"
                style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04))", color: "#3b82f6" }}
              >
                <HomeIcon className="size-7 md:size-8" />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1.5">
                <CardTitle className="text-sm md:text-[16px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  Layanan Desa
                </CardTitle>
                <MutedText className="line-clamp-2 leading-relaxed text-xs md:text-sm">
                  Layanan yang menjadi kewenangan desa. Diselesaikan langsung oleh Petugas Desa tanpa perlu diteruskan ke OPD.
                </MutedText>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1.5 mt-auto pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-300/50 dark:border-blue-700/50 text-[11px] md:text-[12px] font-bold text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/10 transition-all duration-300">
                  Pilih Layanan
                  <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>

        {opds.map((opd) => {
          const OpdIcon = OPD_ICONS[opd.icon || ""] || HelpCircle
          const accentColor = opd.color || "var(--primary)"
          return (
            <Link
              key={opd.id}
              href={`/posyandu/ajukan/${opd.id}`}
              className="group relative flex flex-col overflow-hidden rounded-xl bg-card border border-border/80 transition-all duration-300 hover:shadow-lg hover:border-primary/25 hover:-translate-y-1"
            >
              {/* Top accent bar */}
              <div
                className="h-1.5 w-full shrink-0 transition-all duration-300 group-hover:h-2"
                style={{ backgroundColor: accentColor }}
              />

              <div className="relative flex flex-col flex-1 p-5 md:p-6 gap-4 md:gap-5">
                {/* Decorative watermark */}
                <OpdIcon
                  className="absolute -right-3 -top-3 size-28 text-muted-foreground/10 pointer-events-none transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                />

                {/* Icon */}
                <div
                  className="size-14 md:size-16 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:rotate-2"
                  style={{
                    background: opd.color
                      ? `linear-gradient(135deg, ${opd.color}20, ${opd.color}08)`
                      : "linear-gradient(135deg, rgba(var(--primary), 0.1), rgba(var(--primary), 0.04))",
                    color: accentColor,
                  }}
                >
                  <OpdIcon className="size-7 md:size-8" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1.5">
                  <CardTitle className="text-sm md:text-[16px] group-hover:text-primary transition-colors duration-200">
                    {opd.name}
                  </CardTitle>
                  {opd.description && (
                    <MutedText className="line-clamp-2 leading-relaxed text-xs md:text-sm">
                      {opd.description}
                    </MutedText>
                  )}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-1.5 mt-auto pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[11px] md:text-[12px] font-bold text-muted-foreground/80 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
                    Pilih Layanan
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </PageContainer>
  )
}
