import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { ATSDetailCard } from "@/components/posyandu/ats-detail-card"

export default async function ATSDetailPage({ params }: { params: Promise<{ atsId: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "POSYANDU") redirect("/login")

  const { atsId } = await params

  const record = await prisma.anakTidakSekolah.findFirst({
    where: { id: atsId, posyanduUserId: session.user.id, isActive: true },
    include: {
      posyandu: { select: { name: true } },
      desa: { select: { name: true } },
      kecamatan: { select: { name: true } },
    },
  })

  if (!record) notFound()

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={record.namaAnak}
        description={`${record.posyandu.name} · Desa ${record.desa.name}`}
        backHref="/posyandu/ats"
      />
      <ATSDetailCard record={JSON.parse(JSON.stringify(record))} canEdit atsId={atsId} />
    </PageContainer>
  )
}
