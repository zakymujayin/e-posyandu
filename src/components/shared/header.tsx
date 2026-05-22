"use client"

import { useState } from "react"
import { Menu, X, Heart, Home, FileText, CheckCircle, Eye, FileCheck, BarChart3, Settings, LogOut, Search } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/next-auth"
import { MESSAGES } from "@/lib/messages"
import { NotificationBell } from "@/components/shared/notification-bell"

const NAV_ITEMS: Record<UserRole, { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]> = {
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

interface HeaderProps {
  user: { name: string; role: UserRole }
}

export function Header({ user }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const items = NAV_ITEMS[user.role] ?? []
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-16 md:h-[72px] bg-white/80 dark:bg-card/80 backdrop-blur-2xl border-b border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.03),inset_0_-1px_0_rgba(255,255,255,1)] transition-all duration-300">
        {/* Left Side: Mobile Menu Button and Search */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 md:flex-none">
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-xl transition-all duration-300 active:scale-95 animate-in fade-in"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Global Search */}
          <div className="hidden md:block relative group">
            <Search className="absolute left-3 md:left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari..." 
              className="w-full md:w-[320px] lg:w-[400px] h-10 md:h-[42px] pl-9 md:pl-10 pr-3 md:pr-12 rounded-xl bg-slate-100/60 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10 shadow-[inset_0_1px_rgba(255,255,255,0.5)] focus:shadow-[inset_0_1px_rgba(255,255,255,1),0_2px_10px_rgba(37,99,235,0.05)] text-[14px] text-slate-800 font-medium transition-all duration-300 placeholder:text-muted-foreground/70 outline-none"
            />
            <div className="hidden md:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center">
              <kbd className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md border border-slate-200 bg-white text-[12px] font-bold text-slate-400 select-none shadow-sm">
                <span className="text-[14px] leading-none">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Side: Notifications & Profile */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          
          {/* Divider */}
          <div className="h-5 w-px bg-border hidden md:block" />

          {/* User Profile Card */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[14px] font-bold shadow-sm select-none">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left select-none">
              <p className="text-[14px] font-bold text-slate-800 leading-none">{user.name}</p>
              <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wider block mt-1.5 leading-none">
                {MESSAGES.roles[user.role]}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 bg-card h-full flex flex-col shadow-2xl border-r border-border animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-5.5 border-b border-border flex items-center justify-between bg-card/50">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
                  <Heart className="size-4.5 fill-white stroke-none" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-[14px] font-black tracking-tight text-foreground leading-none">
                      e-Posyandu
                    </h1>
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  </div>
                  <p className="text-[12px] font-bold text-muted-foreground/75 uppercase tracking-wider leading-none mt-1">
                    KABUPATEN LEBAK
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-xl transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-5 flex flex-col gap-1 overflow-y-auto">
              {items.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/")

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-300 ease-out select-none group/item relative",
                      isActive
                        ? "bg-blue-500/10 text-blue-700 font-extrabold shadow-[inset_0_1px_rgba(255,255,255,0.5),0_2px_8px_rgba(37,99,235,0.08)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-blue-600 before:shadow-[0_0_8px_rgba(37,99,235,0.5)] before:rounded-r-full"
                        : "text-muted-foreground hover:bg-blue-500/5 hover:text-blue-600 hover:shadow-[inset_0_1px_rgba(255,255,255,0.5)]"
                    )}
                  >
                    <Icon className={cn("w-4.5 h-4.5", isActive ? "text-blue-600" : "text-muted-foreground")} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Profile Drawer Footer */}
            <div className="p-4 border-t border-border bg-card/50">
              <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/30">
                <div className="size-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-800 truncate">{user.name}</p>
                  <span className="inline-block text-[12px] font-bold text-blue-600 border border-blue-200/50 bg-blue-50/50 px-1.5 py-0.5 rounded-md mt-0.5">
                    {MESSAGES.roles[user.role]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[12px] font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 border border-transparent hover:border-destructive/10 rounded-xl transition-all duration-200"
              >
                <LogOut className="size-4" />
                Keluar Layanan
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}