import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PengajuanDetail } from "@/components/shared/pengajuan-detail"
import { AdminActions } from "@/components/admin/admin-actions"
import { getSopInfo } from "@/lib/sop"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { FileText, PlayCircle } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { CardTitle, MutedText, BodyText } from "@/components/ui/typography"
import type { PengajuanStatus } from "@/lib/messages"

const ACTION_LABELS: Record<string, string> = {
  APPROVE: "Disetujui",
  REVISION_REQUEST: "Revisi Dikirim ke OPD",
  WARNING: "Surat Teguran Dikirim",
  BYPASS: "Bypass Tahap Manual",
}

export default async function AdminPengajuanDetailPage({
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

  const sopInfo = await getSopInfo(id)
  const sopExpired = sopInfo ? sopInfo.sopStatus === "EXPIRED" || sopInfo.isAutoBypassEligible : false

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Detail Pengajuan Berkas"
        description={`Verifikasi dan persetujuan berkas posyandu untuk tiket #${pengajuan.tiketNumber}`}
        backHref="/admin/pengajuan"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PengajuanDetail
            pengajuan={pengajuan}
            sopInfo={sopInfo ? { remainingDays: sopInfo.remainingDays, sopStatus: sopInfo.sopStatus } : null}
          />

          {/* Tindak Lanjut OPD */}
          {pengajuan.tindakLanjuts.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                <CardTitle>Tindak Lanjut dari OPD</CardTitle>
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
                    {tl.attachments.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40 mt-1">
                        {tl.attachments.map((att) => (
                          <div key={att.id} className="flex items-center gap-2 text-xs md:text-sm bg-card border border-border/50 px-3 py-2 rounded-lg font-semibold hover:border-primary/30 transition-all">
                            {att.attachmentType === "FILE" ? (
                              <>
                                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                <a href={att.filePath ?? "#"} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                                  {att.fileName}
                                </a>
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                                <a href={att.videoUrl ?? "#"} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                                  Lihat Video Bukti
                                </a>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Actions History */}
          {pengajuan.adminActions.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                <CardTitle>Riwayat Aksi Admin</CardTitle>
              </div>
              <div className="space-y-3">
                {pengajuan.adminActions.map((action) => (
                  <div key={action.id} className="border-l-2 border-primary/40 pl-4 py-1 space-y-1">
                    <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground font-semibold flex-wrap gap-2">
                      <span className="font-semibold text-primary">{ACTION_LABELS[action.actionType] ?? action.actionType}</span>
                      <span>Oleh {action.admin.name} · {format(new Date(action.createdAt), "d MMM yyyy HH:mm", { locale: localeId })}</span>
                    </div>
                    <BodyText className="text-xs md:text-sm text-foreground/80 mt-0.5">{action.catatan}</BodyText>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Panel */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <AdminActions
              pengajuanId={id}
              status={pengajuan.status}
              sopExpired={sopExpired}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
