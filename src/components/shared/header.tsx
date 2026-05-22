"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/next-auth"
import { MESSAGES } from "@/lib/messages"
import { NotificationBell } from "@/components/shared/notification-bell"
import {
  Home, FileText, CheckCircle, Eye, FileCheck, BarChart3, Settings, LogOut,
} from "lucide-react"

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
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-16 bg-white border-b border-gray-200">
        <button onClick={() => setDrawerOpen(true)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <div className="md:hidden text-sm font-medium text-gray-700">
          {MESSAGES.roles[user.role]}
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{MESSAGES.roles[user.role]}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 bg-white h-full flex flex-col shadow-xl">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-blue-600">E-Posyandu</h1>
                <p className="text-xs text-gray-500">DPMD Kabupaten Lebak</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {items.map((item) => {
                const Icon = item.icon
                const isActive = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="px-3 py-4 border-t border-gray-200">
              <div className="px-3 py-2 mb-2">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500">{MESSAGES.roles[user.role]}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}