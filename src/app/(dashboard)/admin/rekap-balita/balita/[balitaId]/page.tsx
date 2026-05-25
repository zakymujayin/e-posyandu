import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { BalitaDetailView } from "@/components/admin/balita-detail-view"
import { differenceInMonths, format } from "date-fns"
import { id as localeId } from "date-fns/locale"

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
    select: { namaBalita: true, tanggalLahir: true, jenisKelamin: true },
  })
  if (!balita) notFound()

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={balita.namaBalita}
        description={`${differenceInMonths(new Date(), balita.tanggalLahir)} bulan · ${balita.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"} · Lahir ${format(balita.tanggalLahir, "d MMMM yyyy", { locale: localeId })}`}
        backHref="/admin/rekap-balita"
      />
      <BalitaDetailView balitaId={balitaId} />
    </PageContainer>
  )
}
