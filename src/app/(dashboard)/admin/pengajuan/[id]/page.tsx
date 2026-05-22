import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PengajuanDetail } from "@/components/shared/pengajuan-detail"
import { AdminActions } from "@/components/admin/admin-actions"
import { getSopInfo } from "@/lib/sop"
import { ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

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

  const sopInfo = await getSopInfo(id)
  const sopExpired = sopInfo ? sopInfo.sopStatus === "EXPIRED" || sopInfo.isAutoBypassEligible : false

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Detail Pengajuan</h1>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-4">
        <div className="lg:col-span-2 space-y-4">
          <PengajuanDetail
            pengajuan={pengajuan}
            sopInfo={sopInfo ? { remainingDays: sopInfo.remainingDays, sopStatus: sopInfo.sopStatus } : null}
          />

          {/* Tindak Lanjut OPD */}
          {pengajuan.tindakLanjuts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Tindak Lanjut OPD</h3>
              {pengajuan.tindakLanjuts.map((tl) => (
                <div key={tl.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{tl.petugasOpd.name}</span>
                    <span>{format(new Date(tl.submittedAt), "d MMM yyyy HH:mm", { locale: localeId })}</span>
                  </div>
                  <p className="text-sm text-gray-700">{tl.deskripsi}</p>
                  {tl.attachments.length > 0 && (
                    <div className="space-y-1">
                      {tl.attachments.map((att) => (
                        <div key={att.id} className="text-xs">
                          {att.attachmentType === "FILE" ? (
                            <a href={att.filePath ?? "#"} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              📎 {att.fileName}
                            </a>
                          ) : (
                            <a href={att.videoUrl ?? "#"} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              🎥 {att.videoUrl}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Admin Actions History */}
          {pengajuan.adminActions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Riwayat Aksi Admin</h3>
              {pengajuan.adminActions.map((action) => (
                <div key={action.id} className="border-l-4 border-blue-200 pl-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{action.actionType} · {action.admin.name}</span>
                    <span>{format(new Date(action.createdAt), "d MMM yyyy HH:mm", { locale: localeId })}</span>
                  </div>
                  <p className="text-gray-700 mt-0.5">{action.catatan}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Action Panel */}
        <div className="mt-4 lg:mt-0">
          <div className="lg:sticky lg:top-4">
            <AdminActions
              pengajuanId={id}
              status={pengajuan.status}
              sopExpired={sopExpired}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
