import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LandingPage } from "@/components/landing/landing-page"

export default async function RootPage() {
  const session = await auth()

  if (session?.user) {
    const role = session.user.role
    const redirects = {
      POSYANDU: "/posyandu",
      PETUGAS_DESA: "/petugas-desa",
      PETUGAS_KECAMATAN: "/kecamatan",
      PETUGAS_OPD: "/opd",
      ADMIN_DPMD: "/admin",
    } as const
    redirect(redirects[role] ?? "/login")
  }

  const logoSetting = await prisma.appSetting.findUnique({ where: { key: "logo_url" } })
  return <LandingPage logoUrl={logoSetting?.value ?? null} />
}
