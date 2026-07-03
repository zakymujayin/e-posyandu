import { StatusBadge } from "@/components/shared/status-badge"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import type { PengajuanStatus } from "@/lib/messages"
import { CardTitle, MutedText, SectionTitle } from "@/components/ui/typography"
import { Paperclip, Video, AlertTriangle, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

function safeUrl(url: string | null | undefined): string {
  if (!url) return "#"
  if (/^(javascript|data):/i.test(url)) return "#"
  return url
}

const ROLE_LABELS: Record<string, string> = {
  POSYANDU: "Posyandu",
  PETUGAS_DESA: "Petugas Desa",
  PETUGAS_OPD: "Petugas OPD",
  ADMIN_DPMD: "Admin DPMD",
  SYSTEM: "Sistem",
  SISTEM: "Sistem",
}

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
    opd: { name: string } | null
    layananJenis: { name: string; isKecamatan?: boolean } | null
    kategori?: string | null
    lokasiLat?: number | null
    lokasiLng?: number | null
    desa: { name: string; kecamatan?: { name: string } | null }
    posyandu: { name: string }
    posyanduUser: { name: string }
    fieldValues: FieldValue[]
    attachments: Attachment[]
    activityLogs: ActivityLog[]
  }
  sopInfo?: {
    remainingDays: number
    sopStatus: string
  } | null
}

function getFileExt(fileName: string): string {
  return fileName.split(".").pop()?.toUpperCase() ?? "FILE"
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
      {/* SOP Warning Banner */}
      {sopInfo && sopInfo.sopStatus !== "NORMAL" && (
        <div className={cn(
          "flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold",
          sopInfo.sopStatus === "EXPIRED"
            ? "bg-destructive/10 text-destructive border border-destructive/20"
            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
        )}>
          <AlertTriangle className="size-3.5 shrink-0" />
          {sopInfo.sopStatus === "EXPIRED"
            ? "SOP berkas ini telah melewati batas waktu penyelesaian."
            : `Peringatan: Sisa ${sopInfo.remainingDays} hari sebelum batas SOP terlampaui.`}
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white dark:bg-card rounded-lg border border-border p-5 space-y-3">
        {/* Baris 1: Tiket + Status */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <MutedText>No. Tiket</MutedText>
            <p className="font-mono font-bold text-lg text-foreground mt-0.5">{pengajuan.tiketNumber}</p>
          </div>
          <StatusBadge status={pengajuan.status as PengajuanStatus} />
        </div>

        {/* Baris 2: OPD / Layanan / Tanggal / Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm border-t border-border pt-3">
          <div>
            <MutedText>OPD Tujuan</MutedText>
            <p className="font-medium text-foreground mt-0.5">{pengajuan.opd?.name ?? (pengajuan.layananJenis?.isKecamatan ? "Kecamatan" : "Desa")}</p>
          </div>
          <div>
            <MutedText>Jenis Layanan</MutedText>
            <p className="font-medium text-foreground mt-0.5">
              {pengajuan.kategori === "PERMOHONAN" ? (pengajuan.layananJenis?.name ?? "-") : "Pengaduan"}
            </p>
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

        {/* Baris 3: Informasi Wilayah */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm border-t border-border pt-3">
          {pengajuan.desa.kecamatan?.name && (
            <div>
              <MutedText>Kecamatan</MutedText>
              <p className="text-foreground/90 mt-0.5">{pengajuan.desa.kecamatan.name}</p>
            </div>
          )}
          <div>
            <MutedText>Desa</MutedText>
            <p className="text-foreground/90 mt-0.5">{pengajuan.desa.name}</p>
          </div>
          <div>
            <MutedText>Posyandu</MutedText>
            <p className="text-foreground/90 mt-0.5">{pengajuan.posyandu.name}</p>
          </div>
          <div>
            <MutedText>Akun Posyandu</MutedText>
            <p className="text-foreground/90 mt-0.5">{pengajuan.posyanduUser.name}</p>
          </div>
        </div>
      </div>

      <SectionTitle className="mb-4">Informasi Pengajuan</SectionTitle>

      {/* Data Pelapor */}
      <div className="bg-white dark:bg-card rounded-lg border border-border p-5 space-y-3">
        <CardTitle>Data Pelapor</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <MutedText>Nama Pelapor</MutedText>
            <p className="text-foreground font-medium mt-0.5">{pengajuan.namaPelapor}</p>
          </div>
          <div>
            <MutedText>NIK</MutedText>
            <p className="text-foreground/90 mt-0.5">{pengajuan.nikPelapor || "-"}</p>
          </div>
          <div>
            <MutedText>No. HP</MutedText>
            {pengajuan.noHpPelapor ? (
              <a href={`tel:${pengajuan.noHpPelapor}`} className="text-primary hover:underline font-medium mt-0.5 block">
                {pengajuan.noHpPelapor}
              </a>
            ) : (
              <p className="text-foreground/90 mt-0.5">-</p>
            )}
          </div>
          <div className="sm:col-span-3">
            <MutedText>Alamat</MutedText>
            <p className="text-foreground/90 mt-0.5">{pengajuan.alamatPelapor}</p>
          </div>
          {pengajuan.lokasiLat && pengajuan.lokasiLng && (
            <div>
              <MutedText>Lokasi</MutedText>
              <a
                href={`https://www.google.com/maps?q=${pengajuan.lokasiLat},${pengajuan.lokasiLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium mt-0.5"
              >
                <MapPin className="size-3.5" />
                Lihat di Google Maps
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Fields */}
      {pengajuan.fieldValues.length > 0 && (
        <div className="bg-white dark:bg-card rounded-lg border border-border p-5 space-y-3">
          <CardTitle>Detail Layanan</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {pengajuan.fieldValues.map((fv) => (
              <div key={fv.id} className={fv.formField.fieldType === "textarea" ? "sm:col-span-2" : ""}>
                <MutedText>{fv.formField.fieldLabel}</MutedText>
                <p className="text-foreground/90 mt-0.5 whitespace-pre-wrap">{parseFieldValue(fv.fieldValue, fv.formField.fieldType)}</p>
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
        <div className="bg-white dark:bg-card rounded-lg border border-border p-5 space-y-3">
          <CardTitle>Lampiran dari Posyandu</CardTitle>
          <div className="flex flex-wrap gap-2">
            {pengajuanAttachments.map((att) => (
              att.attachmentType === "FILE" ? (
                <a
                  key={att.id}
                  href={safeUrl(att.filePath)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-muted/40 transition-all text-xs md:text-sm font-semibold text-primary"
                >
                  <Paperclip className="size-3.5 shrink-0" />
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary/10 text-primary/80 uppercase shrink-0">
                    {getFileExt(att.fileName ?? "")}
                  </span>
                  {att.fileName}
                </a>
              ) : (
                <a
                  key={att.id}
                  href={safeUrl(att.videoUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-muted/40 transition-all text-xs md:text-sm font-semibold text-primary"
                >
                  <Video className="size-3.5 shrink-0" />
                  {att.videoPlatform ? `Lihat Video (${att.videoPlatform})` : "Lihat Video Bukti"}
                </a>
              )
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {pengajuan.activityLogs.length > 0 && (
        <div className="bg-white dark:bg-card rounded-lg border border-border p-5 space-y-3">
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
                    {log.userRole ? ` · ${ROLE_LABELS[log.userRole] ?? log.userRole}` : ""}
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
