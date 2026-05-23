import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AppSettingsManager } from "@/components/admin/master/app-settings-manager"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"

export default async function PengaturanPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const logoSetting = await prisma.appSetting.findUnique({ where: { key: "logo_url" } })
  const logoUrl = logoSetting?.value || null

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Pengaturan Aplikasi"
        description="Konfigurasi tampilan dan branding aplikasi E-Posyandu."
        backHref="/admin/master"
      />
      <div className="max-w-xl">
        <AppSettingsManager initialLogoUrl={logoUrl} />
      </div>
    </PageContainer>
  )
}
