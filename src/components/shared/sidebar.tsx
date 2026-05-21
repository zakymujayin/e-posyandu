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
} from "lucide-react"

interface SidebarProps {
  user: {
    name: string
    email: string
    role: UserRole
  }
}

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

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const items = NAV_ITEMS[user.role] ?? []

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex-col z-40">
      <div className="px-6 py-5 border-b border-gray-200">
        <h1 className="text-lg font-bold text-blue-600">E-Posyandu</h1>
        <p className="text-xs text-gray-500">DPMD Kabupaten Lebak</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
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
          <p className="text-xs text-gray-500 truncate">
            {MESSAGES.roles[user.role]}
          </p>
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
  )
}