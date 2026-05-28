import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { ATSDetailCard } from "@/components/posyandu/ats-detail-card"

export default async function ATSDetailKecPage({ params }: { params: Promise<{ desaId: string; posyanduId: string; atsId: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PETUGAS_KECAMATAN") redirect("/login")

  const { desaId, posyanduId, atsId } = await params
  const petugas = await prisma.user.findUnique({ where: { id: session.user.id }, select: { kecamatanId: true } })

  const record = await prisma.anakTidakSekolah.findFirst({
    where: { id: atsId, posyanduId, posyandu: { desaId, desa: { kecamatanId: petugas?.kecamatanId ?? "" } }, isActive: true },
    include: { posyandu: { select: { name: true } }, desa: { select: { name: true } }, kecamatan: { select: { name: true } } },
  })
  if (!record) notFound()

  return (
    <PageContainer className="space-y-6">
      <PageHeader title={record.namaAnak} description={record.posyandu.name} backHref={`/kecamatan/rekap-ats/${desaId}/${posyanduId}`} />
      <ATSDetailCard record={JSON.parse(JSON.stringify(record))} />
    </PageContainer>
  )
}
