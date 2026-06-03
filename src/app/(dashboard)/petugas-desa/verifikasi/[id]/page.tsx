import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PengajuanDetail } from "@/components/shared/pengajuan-detail"
import { VerifikasiActions } from "@/components/petugas-desa/verifikasi-actions"
import { getSopInfo } from "@/lib/sop"
import { StatusBadge } from "@/components/shared/status-badge"
import type { PengajuanStatus } from "@/lib/messages"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"
import { CardTitle, MutedText, BodyText, SectionTitle } from "@/components/ui/typography"

const ACTION_LABELS: Record<string, string> = {
  APPROVE: "Disetujui",
  REVISION_REQUEST: "Revisi Dikirim ke OPD",
  WARNING: "Surat Teguran Dikirim",
  BYPASS: "Bypass Tahap Manual",
}

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
      layananJenis: { select: { id: true, name: true, isDesa: true, isKecamatan: true } },
      desa: { select: { id: true, name: true, kecamatan: { select: { name: true } } } },
      posyandu: { select: { id: true, name: true } },
      posyanduUser: { select: { id: true, name: true } },
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
      <PageHeader
        title="Detail Pengajuan Berkas"
        description={`Nomor Tiket: ${pengajuan.tiketNumber}`}
        backHref="/petugas-desa/verifikasi"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PengajuanDetail
            pengajuan={pengajuan}
            sopInfo={sopInfo ? { remainingDays: sopInfo.remainingDays, sopStatus: sopInfo.sopStatus } : null}
          />

          <SectionTitle className="mb-4">Tindak Lanjut &amp; Riwayat</SectionTitle>

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

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            {canVerify && (
            <VerifikasiActions
              pengajuanId={id}
              isDesa={pengajuan.layananJenis?.isDesa ?? (pengajuan.opdId === null)}
            />
          )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
