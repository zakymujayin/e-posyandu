export type UserRole = "KADER" | "PETUGAS_DESA" | "PETUGAS_KECAMATAN" | "PETUGAS_OPD" | "ADMIN_DPMD"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: UserRole
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
  }
}
