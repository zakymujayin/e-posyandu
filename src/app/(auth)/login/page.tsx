import { prisma } from "@/lib/prisma"
import LoginForm from "./login-form"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const [logoSetting, posyanduLogoSetting] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: "logo_url" } }),
    prisma.appSetting.findUnique({ where: { key: "logo_posyandu_url" } }),
  ])
  const logoUrl = logoSetting?.value || null
  const posyanduLogoUrl = posyanduLogoSetting?.value || null
  return <LoginForm logoUrl={logoUrl} posyanduLogoUrl={posyanduLogoUrl} />
}
