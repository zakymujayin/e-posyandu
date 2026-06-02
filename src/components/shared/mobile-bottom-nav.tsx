"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/config/navigation"
import type { UserRole } from "@/types/next-auth"

interface MobileBottomNavProps {
  role: UserRole
}

const MOBILE_LABELS: Record<string, string> = {
  "Riwayat Pengajuan": "Riwayat",
  "Master Data": "Master",
  "Data Balita": "Balita",
  "Rekap Balita": "Rekap",
  "Data ATS": "ATS",
  "Rekap ATS": "ATS",
  "Laporan Pengajuan": "Laporan",
  "Laporan Balita": "Lap. Balita",
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname()
  const items = NAV_ITEMS[role] ?? []

  if (items.length === 0) return null

  const scrollable = items.length > 5

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xs border-t border-border px-2 py-1 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] dark:bg-card/80 dark:border-border">
      <nav
        className={cn(
          "flex items-center px-1",
          scrollable
            ? "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "justify-around"
        )}
      >
        {items.map((item) => {
          const Icon = item.icon
          const isRootPath =
            item.href === "/" ||
            item.href === "/admin" ||
            item.href === "/posyandu" ||
            item.href === "/petugas-desa" ||
            item.href === "/kecamatan" ||
            item.href === "/opd"

          const isActive = isRootPath
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/")
          const label = MOBILE_LABELS[item.label] ?? item.label

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 rounded-xl text-[12px] font-medium transition-all duration-300 gap-1 select-none",
                scrollable ? "shrink-0 w-[72px] px-1" : "flex-1 max-w-[90px] px-2",
                isActive
                  ? "text-primary dark:text-primary-foreground font-semibold scale-105"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center size-8 rounded-xl transition-all duration-300",
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "bg-transparent"
                )}
              >
                <Icon className="size-5" />
              </div>
              <span className="text-center text-[11px] leading-tight">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
