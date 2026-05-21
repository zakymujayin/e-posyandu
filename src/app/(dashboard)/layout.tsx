import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/shared/sidebar"
import { Header } from "@/components/shared/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col md:ml-64">
        <Header user={session.user} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}