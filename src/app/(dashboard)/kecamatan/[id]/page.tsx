import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PengajuanDetail } from "@/components/shared/pengajuan-detail"
import { PenyelesaianDesaSection } from "@/components/shared/penyelesaian-desa-section"
import { VerifikasiKecamatanActions } from "@/components/kecamatan/verifikasi-kecamatan-actions"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"

export default async function KecamatanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kecamatanId: true },
  })

  if (!user?.kecamatanId) redirect("/kecamatan")

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id },
    include: {
      opd: { select: { id: true, name: true, color: true, icon: true } },
      layananJenis: { select: { id: true, name: true } },
      desa: { select: { id: true, name: true, kecamatanId: true } },
      posyandu: { select: { id: true, name: true } },
      posyanduUser: { select: { id: true, name: true } },
      fieldValues: {
        include: { formField: { select: { fieldLabel: true, fieldType: true, fieldName: true } } },
      },
      attachments: true,
      verifikasiDesa: { include: { petugasDesa: { select: { name: true } } } },
      verifikasiKecamatan: { include: { petugasKec: { select: { name: true } } } },
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
  if (pengajuan.desa.kecamatanId !== user.kecamatanId) redirect("/kecamatan")

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={`Tiket #${pengajuan.tiketNumber}`}
        description={pengajuan.status === "DALAM_PROSES_KECAMATAN" ? "Tindak lanjut pengajuan yang dieskalasikan dari desa" : "Detail pengajuan — tampilan hanya baca"}
        backHref="/kecamatan"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PengajuanDetail pengajuan={pengajuan} sopInfo={null} />
          <PenyelesaianDesaSection
            selesaiOleh={pengajuan.selesaiOleh}
            verifikasiDesa={pengajuan.verifikasiDesa}
            verifikasiKecamatan={pengajuan.verifikasiKecamatan}
            attachments={pengajuan.attachments}
          />
        </div>
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            {pengajuan.status === "DALAM_PROSES_KECAMATAN" && (
              <VerifikasiKecamatanActions pengajuanId={pengajuan.id} />
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
