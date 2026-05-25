import type { UserRole } from "@/types/next-auth"
import {
  Home,
  FileText,
  CheckCircle,
  Eye,
  FileCheck,
  BarChart3,
  PieChart,
  Settings,
  LayoutGrid,
  Baby,
} from "lucide-react"
import type { ComponentType } from "react"

export interface NavItem {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  POSYANDU: [
    { href: "/posyandu", label: "Beranda", icon: Home },
    { href: "/posyandu/layanan", label: "Layanan", icon: LayoutGrid },
    { href: "/posyandu/riwayat", label: "Riwayat Pengajuan", icon: FileText },
    { href: "/posyandu/balita", label: "Data Balita", icon: Baby },
  ],
  PETUGAS_DESA: [
    { href: "/petugas-desa", label: "Beranda", icon: Home },
    { href: "/petugas-desa/verifikasi", label: "Verifikasi", icon: CheckCircle },
    { href: "/petugas-desa/rekap-balita", label: "Rekap Balita", icon: Baby },
    { href: "/admin/laporan-balita", label: "Laporan Balita", icon: PieChart },
  ],
  PETUGAS_KECAMATAN: [
    { href: "/kecamatan", label: "Monitoring", icon: Eye },
    { href: "/kecamatan/rekap-balita", label: "Rekap Balita", icon: Baby },
    { href: "/admin/laporan-balita", label: "Laporan Balita", icon: PieChart },
  ],
  PETUGAS_OPD: [
    { href: "/opd", label: "Beranda", icon: Home },
    { href: "/opd/tindak-lanjut", label: "Tindak Lanjut", icon: FileCheck },
  ],
  ADMIN_DPMD: [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/pengajuan", label: "Pengajuan", icon: FileText },
    { href: "/admin/rekap-balita", label: "Rekap Balita", icon: Baby },
    { href: "/admin/laporan", label: "Laporan Pengajuan", icon: BarChart3 },
    { href: "/admin/laporan-balita", label: "Laporan Balita", icon: PieChart },
    { href: "/admin/master", label: "Master Data", icon: Settings },
  ],
}
