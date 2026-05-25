import { prisma } from "@/lib/prisma"
import LoginForm from "./login-form"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const logoSetting = await prisma.appSetting.findUnique({ where: { key: "logo_url" } })
  const logoUrl = logoSetting?.value || null
  return <LoginForm logoUrl={logoUrl} />
}
