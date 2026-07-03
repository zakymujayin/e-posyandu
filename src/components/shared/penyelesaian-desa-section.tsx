import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { CheckCircle2, FileText } from "lucide-react"
import { CardTitle, MutedText, BodyText } from "@/components/ui/typography"

function safeUrl(url: string | null | undefined): string {
  if (!url) return "#"
  if (/^(javascript|data):/i.test(url)) return "#"
  return url
}

interface Attachment {
  id: string
  attachmentType: string
  attachmentContext: string
  filePath: string | null
  fileName: string | null
}

interface VerifikasiDesa {
  petugasDesa: { name: string }
  catatan: string | null
  verifiedAt: Date | string
}

interface VerifikasiKecamatan {
  petugasKec: { name: string }
  catatan: string | null
  createdAt: Date | string
}

interface Props {
  selesaiOleh: string | null
  verifikasiDesa: VerifikasiDesa | null
  verifikasiKecamatan?: VerifikasiKecamatan | null
  attachments: Attachment[]
}

export function PenyelesaianDesaSection({ selesaiOleh, verifikasiDesa, verifikasiKecamatan, attachments }: Props) {
  const isDesa = selesaiOleh === "DESA" && !!verifikasiDesa
  const isKecamatan = selesaiOleh === "KECAMATAN" && !!verifikasiKecamatan
  if (!isDesa && !isKecamatan) return null

  const label = isDesa ? "Diselesaikan oleh Desa" : "Diselesaikan oleh Kecamatan"
  const petugasName = isDesa ? verifikasiDesa!.petugasDesa.name : verifikasiKecamatan!.petugasKec.name
  const catatan = isDesa ? verifikasiDesa!.catatan : verifikasiKecamatan!.catatan
  const date = isDesa ? verifikasiDesa!.verifiedAt : verifikasiKecamatan!.createdAt
  const attachmentContext = isDesa ? "VERIFIKASI_DESA" : "VERIFIKASI_KECAMATAN"
  const colorClass = isDesa
    ? "border-emerald-200 dark:border-emerald-800"
    : "border-violet-200 dark:border-violet-800"
  const iconColor = isDesa ? "text-emerald-600" : "text-violet-600"
  const titleColor = isDesa
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-violet-700 dark:text-violet-400"

  const buktiAttachments = attachments.filter((a) => a.attachmentContext === attachmentContext)

  return (
    <div className={`bg-card border ${colorClass} rounded-lg p-6 shadow-xs space-y-4`}>
      <div className="flex items-center gap-2">
        <CheckCircle2 className={`w-4 h-4 ${iconColor} shrink-0`} />
        <CardTitle className={titleColor}>{label}</CardTitle>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <MutedText>{isDesa ? "Petugas Desa:" : "Petugas Kecamatan:"}</MutedText>
          <BodyText className="font-semibold">{petugasName}</BodyText>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MutedText>Tanggal Selesai:</MutedText>
          <BodyText className="font-semibold">
            {format(new Date(date), "d MMMM yyyy HH:mm", { locale: localeId })}
          </BodyText>
        </div>
        {catatan && (
          <div className="space-y-1 pt-1">
            <MutedText>Catatan:</MutedText>
            <BodyText className="bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-xs md:text-sm leading-relaxed">
              {catatan}
            </BodyText>
          </div>
        )}
      </div>

      {buktiAttachments.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-border/40">
          <MutedText className="text-xs font-semibold">Bukti Penyelesaian:</MutedText>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {buktiAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 text-xs bg-card border border-border/50 px-3 py-2 rounded-lg font-semibold hover:border-primary/30 transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                <a
                  href={safeUrl(att.filePath)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {att.fileName ?? "Lihat Bukti"}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
