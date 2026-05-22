import { auth } from "@/auth"
import { redirect } from "next/navigation"
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

  // Ensure type alignment for UserRole
  const formattedUser = {
    name: session.user.name || "Pengguna",
    email: session.user.email || "",
    role: session.user.role as UserRole,
  }

  return (
    <AppShell user={formattedUser}>
      {children}
    </AppShell>
  )
}