import { StatusBadge } from "@/components/shared/status-badge"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import type { PengajuanStatus } from "@/lib/messages"
import { CardTitle, MutedText } from "@/components/ui/typography"

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
      <div className="bg-white dark:bg-card rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <MutedText>No. Tiket</MutedText>
            <p className="font-mono font-bold text-lg text-foreground mt-0.5">{pengajuan.tiketNumber}</p>
          </div>
          <StatusBadge status={pengajuan.status as PengajuanStatus} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <MutedText>OPD Tujuan</MutedText>
            <p className="font-medium text-foreground mt-0.5">{pengajuan.opd.name}</p>
          </div>
          <div>
            <MutedText>Jenis Layanan</MutedText>
            <p className="font-medium text-foreground mt-0.5">{pengajuan.layananJenis.name}</p>
          </div>
          <div>
            <MutedText>Tanggal Submit</MutedText>
            <p className="font-medium text-foreground mt-0.5">
              {format(new Date(pengajuan.submittedAt), "d MMM yyyy", { locale: localeId })}
            </p>
          </div>
          <div>
            <MutedText>Deadline SOP</MutedText>
            <p className={`font-medium mt-0.5 ${sopInfo?.sopStatus === "EXPIRED" ? "text-destructive" : sopInfo?.sopStatus === "WARNING" ? "text-amber-600 dark:text-amber-500" : "text-foreground"}`}>
              {format(new Date(pengajuan.deadlineAt), "d MMM yyyy", { locale: localeId })}
              {sopInfo && ` (${sopInfo.remainingDays} hari)`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 text-sm border-t border-border pt-3">
          <div>
            <MutedText>Posyandu</MutedText>
            <p className="text-foreground/90 mt-0.5">{pengajuan.posyandu.name}</p>
          </div>
          <div>
            <MutedText>Kader</MutedText>
            <p className="text-foreground/90 mt-0.5">{pengajuan.kader.name}</p>
          </div>
        </div>
      </div>

      {/* Data Pelapor */}
      <div className="bg-white dark:bg-card rounded-xl border border-border p-5 space-y-3">
        <CardTitle>Data Pelapor</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <MutedText>Nama Pelapor</MutedText>
            <p className="text-foreground font-medium mt-0.5">{pengajuan.namaPelapor}</p>
          </div>
          {pengajuan.nikPelapor && (
            <div>
              <MutedText>NIK</MutedText>
              <p className="text-foreground/90 mt-0.5">{pengajuan.nikPelapor}</p>
            </div>
          )}
          {pengajuan.noHpPelapor && (
            <div>
              <MutedText>No. HP</MutedText>
              <p className="text-foreground/90 mt-0.5">{pengajuan.noHpPelapor}</p>
            </div>
          )}
          <div className="md:col-span-2">
            <MutedText>Alamat</MutedText>
            <p className="text-foreground/90 mt-0.5">{pengajuan.alamatPelapor}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Fields */}
      {pengajuan.fieldValues.length > 0 && (
        <div className="bg-white dark:bg-card rounded-xl border border-border p-5 space-y-3">
          <CardTitle>Detail Layanan</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {pengajuan.fieldValues.map((fv) => (
              <div key={fv.id}>
                <MutedText>{fv.formField.fieldLabel}</MutedText>
                <p className="text-foreground/90 mt-0.5">{parseFieldValue(fv.fieldValue, fv.formField.fieldType)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deskripsi */}
      <div className="bg-white dark:bg-card rounded-xl border border-border p-5 space-y-2">
        <CardTitle>Deskripsi Pengaduan</CardTitle>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{pengajuan.deskripsi}</p>
      </div>

      {/* Lampiran Kader */}
      {pengajuanAttachments.length > 0 && (
        <div className="bg-white dark:bg-card rounded-xl border border-border p-5 space-y-3">
          <CardTitle>Lampiran dari Kader</CardTitle>
          <div className="space-y-2">
            {pengajuanAttachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 text-sm">
                {att.attachmentType === "FILE" ? (
                  <a
                    href={att.filePath ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-medium flex items-center gap-1"
                  >
                    📎 {att.fileName}
                  </a>
                ) : (
                  <a
                    href={att.videoUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-medium flex items-center gap-1"
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
        <div className="bg-white dark:bg-card rounded-xl border border-border p-5 space-y-3">
          <CardTitle>Timeline Aktivitas</CardTitle>
          <div className="space-y-3">
            {pengajuan.activityLogs.map((log, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  {i < pengajuan.activityLogs.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="font-medium text-foreground">{log.action}</p>
                  <MutedText className="mt-0.5">
                    {format(new Date(log.createdAt), "d MMM yyyy HH:mm", { locale: localeId })}
                    {log.userRole ? ` · ${log.userRole}` : ""}
                  </MutedText>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
