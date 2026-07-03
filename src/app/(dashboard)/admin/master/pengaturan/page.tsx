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

  const sliderSetting = await prisma.appSetting.findUnique({ where: { key: "slider_photos" } })
  let sliderPhotos: { url: string; alt: string; caption?: string }[] = []
  if (sliderSetting?.value) {
    try {
      sliderPhotos = JSON.parse(sliderSetting.value)
    } catch {
      sliderPhotos = []
    }
  }

  const bupatiSetting = await prisma.appSetting.findUnique({ where: { key: "bupati_photo" } })
  let bupatiPhoto: { url: string; alt: string; caption?: string } | null = null
  if (bupatiSetting?.value) {
    try {
      bupatiPhoto = JSON.parse(bupatiSetting.value)
    } catch {
      bupatiPhoto = null
    }
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Pengaturan Aplikasi"
        description="Konfigurasi tampilan dan branding aplikasi E-Posyandu."
        backHref="/admin/master"
      />
      <div className="max-w-xl">
        <AppSettingsManager initialLogoUrl={logoUrl} initialSliderPhotos={sliderPhotos} initialBupatiPhoto={bupatiPhoto} />
      </div>
    </PageContainer>
  )
}
