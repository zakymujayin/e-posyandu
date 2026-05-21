import type { UserRole } from "@/types/next-auth"

type PengajuanStatus = "MENUNGGU_VERIFIKASI" | "DALAM_PROSES_OPD" | "MENUNGGU_APPROVAL_DPMD" | "SELESAI" | "DITOLAK_DESA" | "DITOLAK_OPD"

export const MESSAGES = {
  auth: {
    loginFailed: "Email atau kata sandi salah",
    lockedOut: (minutes: number) =>
      `Terlalu banyak percobaan, coba lagi dalam ${minutes} menit`,
    requiredFields: "Email dan password wajib diisi",
  },
  status: {
    MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
    DALAM_PROSES_OPD: "Dalam Proses OPD",
    MENUNGGU_APPROVAL_DPMD: "Menunggu Approval DPMD",
    SELESAI: "Selesai",
    DITOLAK_DESA: "Ditolak Desa",
    DITOLAK_OPD: "Ditolak OPD",
  } as Record<PengajuanStatus, string>,
  statusColor: {
    MENUNGGU_VERIFIKASI: "yellow",
    DALAM_PROSES_OPD: "blue",
    MENUNGGU_APPROVAL_DPMD: "orange",
    SELESAI: "green",
    DITOLAK_DESA: "red",
    DITOLAK_OPD: "red",
  } as Record<PengajuanStatus, string>,
  roles: {
    KADER: "Kader Posyandu",
    PETUGAS_DESA: "Petugas Desa",
    PETUGAS_KECAMATAN: "Petugas Kecamatan",
    PETUGAS_OPD: "Petugas OPD",
    ADMIN_DPMD: "Admin DPMD",
  } as Record<UserRole, string>,
} as const
