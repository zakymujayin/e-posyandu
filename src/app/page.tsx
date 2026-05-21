import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function RootPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const role = session.user.role
  const redirects: Record<string, string> = {
    KADER: "/kader",
    PETUGAS_DESA: "/petugas-desa",
    PETUGAS_KECAMATAN: "/kecamatan",
    PETUGAS_OPD: "/opd",
    ADMIN_DPMD: "/admin",
  }

  redirect(redirects[role] ?? "/login")
}