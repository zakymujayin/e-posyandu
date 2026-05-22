import { StatusBadge } from "@/components/shared/status-badge"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import type { PengajuanStatus } from "@/lib/messages"

interface FormField {
  fieldLabel: string
  fieldType: string
}

interface FieldValue {
  id: string
  fieldValue: string
  formField: FormField
}

interface Attachment {
  id: string
  attachmentContext: string
  attachmentType: string
  filePath?: string | null
  fileName?: string | null
  videoUrl?: string | null
  videoPlatform?: string | null
  createdAt: Date | string
}

interface ActivityLog {
  action: string
  oldStatus?: string | null
  newStatus?: string | null
  createdAt: Date | string
  userRole?: string | null
}

interface PengajuanDetailProps {
  pengajuan: {
    tiketNumber: string
    namaPelapor: string
    nikPelapor?: string | null
    noHpPelapor?: string | null
    alamatPelapor: string
    deskripsi: string
    status: string
    submittedAt: Date | string
    deadlineAt: Date | string
    opd: { name: string }
    layananJenis: { name: string }
    desa: { name: string }
    posyandu: { name: string }
    kader: { name: string }
    fieldValues: FieldValue[]
    attachments: Attachment[]
    activityLogs: ActivityLog[]
  }
  sopInfo?: {
    remainingDays: number
    sopStatus: string
  } | null
}

function parseFieldValue(value: string, fieldType: string): string {
  if (fieldType === "checkbox") {
    try {
      const arr = JSON.parse(value) as string[]
      return arr.join(", ")
    } catch {
      return value
    }
  }
  return value
}

export function PengajuanDetail({ pengajuan, sopInfo }: PengajuanDetailProps) {
  const pengajuanAttachments = pengajuan.attachments.filter((a) => a.attachmentContext === "PENGAJUAN")

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-500">No. Tiket</p>
            <p className="font-mono font-bold text-lg text-gray-900">{pengajuan.tiketNumber}</p>
          </div>
          <StatusBadge status={pengajuan.status as PengajuanStatus} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">OPD Tujuan</p>
            <p className="font-medium text-gray-900">{pengajuan.opd.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Jenis Layanan</p>
            <p className="font-medium text-gray-900">{pengajuan.layananJenis.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tanggal Submit</p>
            <p className="font-medium text-gray-900">
              {format(new Date(pengajuan.submittedAt), "d MMM yyyy", { locale: localeId })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Deadline SOP</p>
            <p className={`font-medium ${sopInfo?.sopStatus === "EXPIRED" ? "text-red-600" : sopInfo?.sopStatus === "WARNING" ? "text-orange-600" : "text-gray-900"}`}>
              {format(new Date(pengajuan.deadlineAt), "d MMM yyyy", { locale: localeId })}
              {sopInfo && ` (${sopInfo.remainingDays} hari)`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-3">
          <div>
            <p className="text-xs text-gray-500">Posyandu</p>
            <p className="text-gray-700">{pengajuan.posyandu.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Kader</p>
            <p className="text-gray-700">{pengajuan.kader.name}</p>
          </div>
        </div>
      </div>

      {/* Data Pelapor */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">Data Pelapor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Nama Pelapor</p>
            <p className="text-gray-900 font-medium">{pengajuan.namaPelapor}</p>
          </div>
          {pengajuan.nikPelapor && (
            <div>
              <p className="text-xs text-gray-500">NIK</p>
              <p className="text-gray-700">{pengajuan.nikPelapor}</p>
            </div>
          )}
          {pengajuan.noHpPelapor && (
            <div>
              <p className="text-xs text-gray-500">No. HP</p>
              <p className="text-gray-700">{pengajuan.noHpPelapor}</p>
            </div>
          )}
          <div className="md:col-span-2">
            <p className="text-xs text-gray-500">Alamat</p>
            <p className="text-gray-700">{pengajuan.alamatPelapor}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Fields */}
      {pengajuan.fieldValues.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Detail Layanan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {pengajuan.fieldValues.map((fv) => (
              <div key={fv.id}>
                <p className="text-xs text-gray-500">{fv.formField.fieldLabel}</p>
                <p className="text-gray-700">{parseFieldValue(fv.fieldValue, fv.formField.fieldType)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deskripsi */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
        <h3 className="font-semibold text-gray-900">Deskripsi Pengaduan</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{pengajuan.deskripsi}</p>
      </div>

      {/* Lampiran Kader */}
      {pengajuanAttachments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Lampiran dari Kader</h3>
          <div className="space-y-2">
            {pengajuanAttachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 text-sm">
                {att.attachmentType === "FILE" ? (
                  <a
                    href={att.filePath ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    📎 {att.fileName}
                  </a>
                ) : (
                  <a
                    href={att.videoUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    🎥 {att.videoUrl}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {pengajuan.activityLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Timeline Aktivitas</h3>
          <div className="space-y-3">
            {pengajuan.activityLogs.map((log, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  {i < pengajuan.activityLogs.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(log.createdAt), "d MMM yyyy HH:mm", { locale: localeId })}
                    {log.userRole ? ` · ${log.userRole}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
