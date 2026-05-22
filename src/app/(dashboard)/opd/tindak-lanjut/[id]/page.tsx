import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PengajuanDetail } from "@/components/shared/pengajuan-detail"
import { TindakLanjutForm } from "@/components/opd/tindak-lanjut-form"
import { getSopInfo } from "@/lib/sop"
import { ArrowLeft } from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"
import type { PengajuanStatus } from "@/lib/messages"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

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
      desa: { select: { id: true, name: true } },
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

  // Cari catatan revisi terbaru
  const latestRevisionNote = pengajuan.adminActions.find((a) => a.actionType === "REVISION_REQUEST")?.catatan

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/opd" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Tindak Lanjut Pengajuan</h1>
      </div>

      <PengajuanDetail
        pengajuan={pengajuan}
        sopInfo={sopInfo ? { remainingDays: sopInfo.remainingDays, sopStatus: sopInfo.sopStatus } : null}
      />

      {/* Riwayat tindak lanjut sebelumnya */}
      {pengajuan.tindakLanjuts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Riwayat Tindak Lanjut</h3>
          {pengajuan.tindakLanjuts.map((tl) => (
            <div key={tl.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {tl.petugasOpd.name} · {format(new Date(tl.submittedAt), "d MMM yyyy HH:mm", { locale: localeId })}
                </span>
                <StatusBadge status={tl.status as PengajuanStatus} />
              </div>
              <p className="text-sm text-gray-700">{tl.deskripsi}</p>
            </div>
          ))}
        </div>
      )}

      {isWaitingApproval && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 font-medium">
            Tindak lanjut Anda sedang direview oleh Admin DPMD.
          </p>
        </div>
      )}

      {canAct && (
        <TindakLanjutForm
          pengajuanId={id}
          hasRevisionNote={latestRevisionNote}
        />
      )}
    </div>
  )
}
