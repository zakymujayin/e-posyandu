import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { BalitaDetail } from "@/components/posyandu/balita-detail"
import { differenceInMonths, format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default async function BalitaDetailPage({
  params,
}: {
  params: Promise<{ balitaId: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "POSYANDU") redirect("/login")

  const { balitaId } = await params

  const userWithPosyandu = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { posyanduId: true },
  })

  if (!userWithPosyandu?.posyanduId) redirect("/posyandu")

  const balita = await prisma.balita.findFirst({
    where: { id: balitaId, posyanduId: userWithPosyandu.posyanduId },
    include: {
      penimbangans: { orderBy: [{ tahun: "asc" }, { bulan: "asc" }] },
      imunisasis: { orderBy: { tanggalPemberian: "asc" } },
    },
  })

  if (!balita) notFound()

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={balita.namaBalita}
        description={`${differenceInMonths(new Date(), balita.tanggalLahir)} bulan · ${balita.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"} · Lahir ${format(balita.tanggalLahir, "d MMMM yyyy", { locale: localeId })}`}
        backHref="/posyandu/balita"
      />
      <BalitaDetail balita={JSON.parse(JSON.stringify(balita))} />
    </PageContainer>
  )
}
