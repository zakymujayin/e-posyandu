import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { withCache } from "@/lib/cache"
import { LandingPage } from "@/components/landing/landing-page"
import type { Slide } from "@/components/shared/ibu-bupati-slider"

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

  const [logoUrl, sliderPhotos, bupatiPhoto] = await Promise.all([
    withCache<string | null>(
      "app_setting:logo_url",
      3600,
      async () => {
        const row = await prisma.appSetting.findUnique({ where: { key: "logo_url" } })
        return row?.value ?? null
      },
    ),
    withCache<Slide[]>(
      "app_setting:slider_photos",
      3600,
      async () => {
        const row = await prisma.appSetting.findUnique({ where: { key: "slider_photos" } })
        if (!row?.value) return []
        try {
          return JSON.parse(row.value) as Slide[]
        } catch {
          return []
        }
      },
    ),
    withCache<Slide | null>(
      "app_setting:bupati_photo",
      3600,
      async () => {
        const row = await prisma.appSetting.findUnique({ where: { key: "bupati_photo" } })
        if (row?.value) {
          try { return JSON.parse(row.value) as Slide } catch { /* fallback */ }
        }
        return null
      },
    ),
  ])

  return (
    <LandingPage
      logoUrl={logoUrl}
      sliderPhotos={sliderPhotos.length > 0 ? sliderPhotos : undefined}
      bupatiPhoto={bupatiPhoto ?? {
        url: "/images/ibu-bupati.png",
        alt: "Ketua Tim Penggerak (TP) PKK sekaligus Ketua Tim Pembina Posyandu Kabupaten Lebak",
        caption: "Ketua Tim Penggerak (TP) PKK sekaligus Ketua Tim Pembina Posyandu Kabupaten Lebak",
      }}
    />
  )
}
