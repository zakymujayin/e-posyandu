import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { ATSForm } from "@/components/posyandu/ats-form"

export default async function TambahATSPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "POSYANDU") redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { posyandu: { select: { desa: { select: { name: true, kecamatan: { select: { name: true } } } } } } },
  })

  const wilayah = {
    desaName: user?.posyandu?.desa?.name ?? "-",
    kecamatanName: user?.posyandu?.desa?.kecamatan?.name ?? "-",
  }

  return (
    <PageContainer className="space-y-6 max-w-5xl">
      <PageHeader title="Tambah Data ATS" description="Daftarkan anak tidak sekolah baru" backHref="/posyandu/ats" />
      <ATSForm mode="tambah" wilayah={wilayah} />
    </PageContainer>
  )
}
