import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { ProfilForms } from "@/components/shared/profil-forms"

export default async function ProfilPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <PageContainer className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">{session.user.email}</p>
      </div>
      <ProfilForms initialName={session.user.name ?? ""} initialEmail={session.user.email ?? ""} />
    </PageContainer>
  )
}
