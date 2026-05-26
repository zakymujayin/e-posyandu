import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { CheckCircle2, FileText } from "lucide-react"
import { CardTitle, MutedText, BodyText } from "@/components/ui/typography"

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

interface Props {
  selesaiOleh: string | null
  verifikasiDesa: VerifikasiDesa | null
  attachments: Attachment[]
}

export function PenyelesaianDesaSection({ selesaiOleh, verifikasiDesa, attachments }: Props) {
  if (selesaiOleh !== "DESA" || !verifikasiDesa) return null

  const buktiAttachments = attachments.filter((a) => a.attachmentContext === "VERIFIKASI_DESA")

  return (
    <div className="bg-card border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <CardTitle className="text-emerald-700 dark:text-emerald-400">Diselesaikan oleh Desa</CardTitle>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <MutedText>Petugas Desa:</MutedText>
          <BodyText className="font-semibold">{verifikasiDesa.petugasDesa.name}</BodyText>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MutedText>Tanggal Selesai:</MutedText>
          <BodyText className="font-semibold">
            {format(new Date(verifikasiDesa.verifiedAt), "d MMMM yyyy HH:mm", { locale: localeId })}
          </BodyText>
        </div>
        {verifikasiDesa.catatan && (
          <div className="space-y-1 pt-1">
            <MutedText>Catatan:</MutedText>
            <BodyText className="bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-xs md:text-sm leading-relaxed">
              {verifikasiDesa.catatan}
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
                  href={att.filePath ?? "#"}
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
