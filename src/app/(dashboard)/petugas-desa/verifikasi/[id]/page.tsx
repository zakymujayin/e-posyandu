import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PengajuanDetail } from "@/components/shared/pengajuan-detail"
import { VerifikasiActions } from "@/components/petugas-desa/verifikasi-actions"
import { getSopInfo } from "@/lib/sop"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"

export default async function VerifikasiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id },
    include: {
      opd: { select: { id: true, name: true, color: true, icon: true } },
      layananJenis: { select: { id: true, name: true } },
      desa: { select: { id: true, name: true } },
      posyandu: { select: { id: true, name: true } },
      kader: { select: { id: true, name: true } },
      fieldValues: {
        include: { formField: { select: { fieldLabel: true, fieldType: true, fieldName: true } } },
      },
      attachments: true,
      verifikasiDesa: {
        include: { petugasDesa: { select: { name: true } } },
      },
      tindakLanjuts: {
        orderBy: { submittedAt: "desc" },
        include: { petugasOpd: { select: { name: true } }, attachments: true },
      },
      adminActions: {
        orderBy: { createdAt: "desc" },
        include: { admin: { select: { name: true } } },
      },
      activityLogs: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!pengajuan) notFound()

  // Scope check
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { desaId: true } })
  if (user?.desaId !== pengajuan.desaId) redirect("/petugas-desa")

  const sopInfo = await getSopInfo(id)

  const canVerify = pengajuan.status === "MENUNGGU_VERIFIKASI"

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Detail Pengajuan Berkas"
        description={`Nomor Tiket: ${pengajuan.tiketNumber}`}
        backHref="/petugas-desa"
      />

      <PengajuanDetail
        pengajuan={pengajuan}
        sopInfo={sopInfo ? { remainingDays: sopInfo.remainingDays, sopStatus: sopInfo.sopStatus } : null}
      />

      {canVerify && <VerifikasiActions pengajuanId={id} />}
    </PageContainer>
  )
}
