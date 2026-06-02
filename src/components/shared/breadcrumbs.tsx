"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User } from "lucide-react"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  profil: User,
}

const LABEL_MAP: Record<string, string> = {
  profil: "Profil",
  admin: "Dashboard",
  kader: "Dashboard",
  kecamatan: "Dashboard",
  opd: "Dashboard",
  "petugas-desa": "Dashboard",
  pengajuan: "Pengajuan",
  laporan: "Laporan",
  master: "Master Data",
  layanan: "Pilih Layanan",
  ajukan: "Ajukan",
  sukses: "Sukses",
  riwayat: "Riwayat",
  "tindak-lanjut": "Tindak Lanjut",
  verifikasi: "Verifikasi",
  users: "Users",
  fields: "Fields",
  "hari-libur": "Hari Libur",
  wilayah: "Wilayah",
  posyandu: "Posyandu",
}

function isIdSegment(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || /^\d+$/.test(segment)
}

function getLabel(segment: string): string {
  if (isIdSegment(segment)) return "Detail"
  return LABEL_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return null

  const crumbs = segments.map((_, i) => ({
    label: getLabel(segments[i]),
    href: "/" + segments.slice(0, i + 1).join("/"),
    icon: ICON_MAP[segments[i]],
  }))

  return (
    <>
      <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-sm font-medium text-muted-foreground min-w-0 overflow-hidden">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          const isDashboard = crumb.label === "Dashboard"
          const Icon = crumb.icon
          return (
            <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <span className="text-muted-foreground/20 select-none shrink-0">/</span>}
              {isLast ? (
                isDashboard ? (
                  <span className="flex items-center gap-1.5 text-blue-600 font-bold shrink-0">
                    <Home className="size-4" aria-label="Dashboard" />
                    <span className="whitespace-nowrap">Dashboard</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 truncate text-blue-600 font-bold whitespace-nowrap">
                    {Icon && <Icon className="size-4 shrink-0" />}
                    {crumb.label}
                  </span>
                )
              ) : (
                <Link href={crumb.href} className="flex items-center gap-1 shrink-0 hover:text-blue-600/70 transition-colors whitespace-nowrap" aria-label={isDashboard ? "Dashboard" : crumb.label}>
                  {isDashboard ? (
                    <Home className="size-3.5" />
                  ) : Icon ? (
                    <Icon className="size-3.5 shrink-0" />
                  ) : (
                    crumb.label
                  )}
                </Link>
              )}
            </span>
          )
        })}
      </nav>
    </>
  )
}
