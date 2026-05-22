"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MESSAGES } from "@/lib/messages"
import type { UserRole } from "@/types/next-auth"
import {
  Home,
  FileText,
  CheckCircle,
  Eye,
  FileCheck,
  BarChart3,
  Settings,
  LogOut,
  User,
  Heart,
} from "lucide-react"

interface SidebarProps {
  user: {
    name: string
    email: string
    role: UserRole
  }
}

const NAV_ITEMS: Record<
  UserRole,
  { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]
> = {
  KADER: [
    { href: "/kader", label: "Beranda", icon: Home },
    { href: "/kader/riwayat", label: "Riwayat Pengajuan", icon: FileText },
  ],
  PETUGAS_DESA: [
    { href: "/petugas-desa", label: "Beranda", icon: Home },
    { href: "/petugas-desa/verifikasi", label: "Verifikasi", icon: CheckCircle },
  ],
  PETUGAS_KECAMATAN: [
    { href: "/kecamatan", label: "Monitoring", icon: Eye },
  ],
  PETUGAS_OPD: [
    { href: "/opd", label: "Beranda", icon: Home },
    { href: "/opd/tindak-lanjut", label: "Tindak Lanjut", icon: FileCheck },
  ],
  ADMIN_DPMD: [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/pengajuan", label: "Pengajuan", icon: FileText },
    { href: "/admin/laporan", label: "Laporan", icon: BarChart3 },
    { href: "/admin/master", label: "Master Data", icon: Settings },
  ],
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const items = NAV_ITEMS[user.role] ?? []

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-50 to-white border-r border-sidebar-border/60 flex-col z-40 shadow-[1px_0_20px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      {/* Branding Header */}
      <div className="px-6 py-5.5 border-b border-sidebar-border/50 flex flex-col gap-1.5 bg-transparent">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
            <Heart className="size-5 fill-white stroke-none" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-[16px] font-black tracking-tight text-foreground leading-none">
                e-Posyandu
              </h1>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>
            <p className="text-[12px] font-extrabold text-muted-foreground/75 uppercase tracking-widest leading-none mt-1">
              KABUPATEN LEBAK
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto bg-transparent">
        {items.map((item) => {
          const Icon = item.icon
          const isHomePath =
            item.href === "/admin" ||
            item.href === "/kader" ||
            item.href === "/petugas-desa" ||
            item.href === "/opd" ||
            item.href === "/"

          const isActive = isHomePath
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-300 ease-out select-none group/item relative",
                isActive
                  ? "bg-blue-500/10 text-blue-700 font-extrabold shadow-[inset_0_1px_rgba(255,255,255,0.5),0_2px_8px_rgba(37,99,235,0.08)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-blue-600 before:shadow-[0_0_8px_rgba(37,99,235,0.5)] before:rounded-r-full"
                  : "text-muted-foreground/80 hover:bg-blue-500/5 hover:text-blue-600 hover:shadow-[inset_0_1px_rgba(255,255,255,0.5)]"
              )}
            >
              <Icon
                className={cn(
                  "size-4.5 transition-transform duration-200 group-hover/item:scale-105",
                  isActive ? "text-blue-600" : "text-muted-foreground group-hover/item:text-blue-600"
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-sidebar-border/50 bg-transparent">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[12px] font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 border border-transparent hover:border-destructive/10 rounded-xl transition-all duration-200"
        >
          <LogOut className="size-4" />
          Keluar Layanan
        </button>
      </div>
    </aside>
  )
}