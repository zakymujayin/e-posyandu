import type { UserRole } from "@/types/next-auth"
import {
  Home,
  FileText,
  CheckCircle,
  Eye,
  FileCheck,
  BarChart3,
  Settings,
  LayoutGrid,
} from "lucide-react"
import type { ComponentType } from "react"

export interface NavItem {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  KADER: [
    { href: "/kader", label: "Beranda", icon: Home },
    { href: "/kader/layanan", label: "Layanan", icon: LayoutGrid },
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
