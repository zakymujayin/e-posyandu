import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { withCache } from "@/lib/cache"
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

  const logoUrl = await withCache<string | null>(
    "app_setting:logo_url",
    3600,
    async () => {
      const row = await prisma.appSetting.findUnique({ where: { key: "logo_url" } })
      return row?.value ?? null
    },
  )

  return <LandingPage logoUrl={logoUrl} />
}
