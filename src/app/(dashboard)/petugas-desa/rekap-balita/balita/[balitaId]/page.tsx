import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { BalitaDetailView } from "@/components/admin/balita-detail-view"

export default async function DesaBalitaDetailPage({
  params,
}: {
  params: Promise<{ balitaId: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PETUGAS_DESA") redirect("/login")

  const { balitaId } = await params

  const balita = await prisma.balita.findUnique({
    where: { id: balitaId },
    select: {
      namaBalita: true,
      posyandu: {
        select: { name: true, desa: { select: { name: true, kecamatan: { select: { name: true } } } } },
      },
    },
  })
  if (!balita) notFound()

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={balita.namaBalita}
        description={`${balita.posyandu.name} · Desa ${balita.posyandu.desa.name} · Kec. ${balita.posyandu.desa.kecamatan.name}`}
        backHref="/petugas-desa/rekap-balita"
      />
      <BalitaDetailView balitaId={balitaId} />
    </PageContainer>
  )
}
