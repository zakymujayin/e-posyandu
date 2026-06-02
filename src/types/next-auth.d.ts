export type UserRole = "POSYANDU" | "PETUGAS_DESA" | "PETUGAS_KECAMATAN" | "PETUGAS_OPD" | "ADMIN_DPMD"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: UserRole
      posyanduId?: string | null
      desaId?: string | null
      kecamatanId?: string | null
      opdId?: string | null
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: UserRole
    posyanduId?: string | null
    desaId?: string | null
    kecamatanId?: string | null
    opdId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    posyanduId?: string | null
    desaId?: string | null
    kecamatanId?: string | null
    opdId?: string | null
  }
}
