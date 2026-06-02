import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { BalitaDetailView } from "@/components/admin/balita-detail-view"

export default async function AdminBalitaDetailPage({
  params,
}: {
  params: Promise<{ balitaId: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const { balitaId } = await params

  const balita = await prisma.balita.findUnique({
    where: { id: balitaId },
    select: {
      namaBalita: true,
      posyandu: {
        select: { id: true, name: true, desa: { select: { id: true, name: true, kecamatan: { select: { id: true, name: true } } } } },
      },
    },
  })
  if (!balita) notFound()

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={balita.namaBalita}
        description={`${balita.posyandu.name} · Desa ${balita.posyandu.desa.name} · Kec. ${balita.posyandu.desa.kecamatan.name}`}
        backHref={`/admin/rekap-balita/${balita.posyandu.desa.kecamatan.id}/${balita.posyandu.desa.id}/${balita.posyandu.id}`}
      />
      <BalitaDetailView balitaId={balitaId} />
    </PageContainer>
  )
}
