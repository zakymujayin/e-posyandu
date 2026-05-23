import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PengajuanDetail } from "@/components/shared/pengajuan-detail"
import { TindakLanjutForm } from "@/components/opd/tindak-lanjut-form"
import { getSopInfo } from "@/lib/sop"
import { StatusBadge } from "@/components/shared/status-badge"
import type { PengajuanStatus } from "@/lib/messages"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"
import { CardTitle, MutedText, BodyText } from "@/components/ui/typography"

export default async function TindakLanjutDetailPage({
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
      desa: { select: { id: true, name: true, kecamatan: { select: { name: true } } } },
      posyandu: { select: { id: true, name: true } },
      kader: { select: { id: true, name: true } },
      fieldValues: {
        include: { formField: { select: { fieldLabel: true, fieldType: true, fieldName: true } } },
      },
      attachments: true,
      verifikasiDesa: { include: { petugasDesa: { select: { name: true } } } },
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

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { opdId: true } })
  if (user?.opdId !== pengajuan.opdId) redirect("/opd")

  const sopInfo = await getSopInfo(id)

  const canAct = pengajuan.status === "DALAM_PROSES_OPD"
  const isWaitingApproval = pengajuan.status === "MENUNGGU_APPROVAL_DPMD"

  const latestRevisionNote = pengajuan.adminActions.find((a) => a.actionType === "REVISION_REQUEST")?.catatan

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Tindak Lanjut Pengajuan"
        description={`Proses peninjauan dan penyelesaian berkas tiket #${pengajuan.tiketNumber}`}
        backHref="/opd/tindak-lanjut"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PengajuanDetail
            pengajuan={pengajuan}
            sopInfo={sopInfo ? { remainingDays: sopInfo.remainingDays, sopStatus: sopInfo.sopStatus } : null}
          />

          {/* Riwayat tindak lanjut sebelumnya */}
          {pengajuan.tindakLanjuts.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                <CardTitle>Riwayat Tindak Lanjut</CardTitle>
              </div>
              <div className="space-y-4">
                {pengajuan.tindakLanjuts.map((tl) => (
                  <div key={tl.id} className="border border-border/60 bg-muted/20 rounded-lg p-4 space-y-3 transition-colors hover:bg-muted/35">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <MutedText>
                        {tl.petugasOpd.name} · {format(new Date(tl.submittedAt), "d MMM yyyy HH:mm", { locale: localeId })}
                      </MutedText>
                      <StatusBadge status={tl.status as PengajuanStatus} />
                    </div>
                    <BodyText className="text-xs md:text-sm">{tl.deskripsi}</BodyText>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-6">
            {isWaitingApproval && (
              <div className="bg-primary/5 border border-primary/15 rounded-lg p-5 shadow-xs flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5 animate-pulse shrink-0"></span>
                <div>
                  <p className="text-xs md:text-sm text-primary font-semibold">
                    Tindak Lanjut Dikirim
                  </p>
                  <MutedText className="mt-1">
                    Tindak lanjut Anda sedang direview oleh Dinas Pemberdayaan Masyarakat dan Desa (DPMD). Silakan tunggu verifikasi selanjutnya.
                  </MutedText>
                </div>
              </div>
            )}

            {canAct && (
              <TindakLanjutForm
                pengajuanId={id}
                hasRevisionNote={latestRevisionNote}
              />
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
