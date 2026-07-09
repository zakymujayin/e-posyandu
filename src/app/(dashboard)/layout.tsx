import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { withCache } from "@/lib/cache"
import { AppShell } from "@/components/shared/app-shell"
import type { UserRole } from "@/types/next-auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const logoUrl = await withCache<string | null>(
    "app_setting:logo_url",
    3600,
    async () => {
      const row = await prisma.appSetting.findUnique({ where: { key: "logo_url" } })
      return row?.value ?? null
    },
  )

  const posyanduLogoUrl = await withCache<string | null>(
    "app_setting:logo_posyandu_url",
    3600,
    async () => {
      const row = await prisma.appSetting.findUnique({ where: { key: "logo_posyandu_url" } })
      return row?.value ?? null
    },
  )

  const formattedUser = {
    name: session.user.name || "Pengguna",
    email: session.user.email || "",
    role: session.user.role as UserRole,
  }

  return (
    <AppShell user={formattedUser} kabupatenLogoUrl={logoUrl} posyanduLogoUrl={posyanduLogoUrl}>
      {children}
    </AppShell>
  )
}
