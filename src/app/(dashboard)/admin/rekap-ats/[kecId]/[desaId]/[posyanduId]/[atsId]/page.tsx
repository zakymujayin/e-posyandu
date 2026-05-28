import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { ATSDetailCard } from "@/components/posyandu/ats-detail-card"

export default async function ATSDetailAdminPage({ params }: { params: Promise<{ kecId: string; desaId: string; posyanduId: string; atsId: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const { kecId, desaId, posyanduId, atsId } = await params

  const record = await prisma.anakTidakSekolah.findFirst({
    where: { id: atsId, posyanduId, posyandu: { desaId, desa: { kecamatanId: kecId } }, isActive: true },
    include: { posyandu: { select: { name: true } }, desa: { select: { name: true } }, kecamatan: { select: { name: true } } },
  })
  if (!record) notFound()

  return (
    <PageContainer className="space-y-6">
      <PageHeader title={record.namaAnak} description={record.posyandu.name} backHref={`/admin/rekap-ats/${kecId}/${desaId}/${posyanduId}`} />
      <ATSDetailCard record={JSON.parse(JSON.stringify(record))} />
    </PageContainer>
  )
}
