"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Plus, X, Upload, FileText, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormSection } from "@/components/shared/form-section"
import { FormLabel, MutedText } from "@/components/ui/typography"

const schema = z.object({
  deskripsi: z.string().min(1, "Deskripsi tindak lanjut wajib diisi"),
  videoLinks: z.array(z.object({ url: z.string() })).optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  pengajuanId: string
  hasRevisionNote?: string | null
}

export function TindakLanjutForm({ pengajuanId, hasRevisionNote }: Props) {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<{ path: string; name: string; size: number; mime: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showTolakModal, setShowTolakModal] = useState(false)
  const [alasanTolak, setAlasanTolak] = useState("")
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { videoLinks: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "videoLinks" })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (uploadedFiles.length + files.length > 5) return toast.error("Maksimal 5 file")

    setUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        setUploadedFiles((prev) => [...prev, { path: json.data.url, name: json.data.fileName, size: json.data.size, mime: json.data.mimeType }])
      }
      toast.success("File berhasil diunggah")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal upload")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function onSubmit() {
    setShowSubmitModal(true)
  }

  async function confirmSubmit(values: FormValues) {
    setShowSubmitModal(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/pengajuan/${pengajuanId}/tindak-lanjut`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deskripsi: values.deskripsi,
          attachments: [
            ...uploadedFiles.map((f) => ({ attachmentType: "FILE", filePath: f.path, fileName: f.name, fileSize: f.size, mimeType: f.mime })),
            ...(values.videoLinks ?? []).filter((v) => v.url).map((v) => ({ attachmentType: "VIDEO_LINK", videoUrl: v.url })),
          ],
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success("Tindak lanjut berhasil dikirim")
      router.push("/opd")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengirim tindak lanjut")
    } finally {
      setLoading(false)
    }
  }

  async function doTolak() {
    if (!alasanTolak.trim()) return toast.error("Alasan penolakan wajib diisi")
    setLoading(true)
    try {
      const res = await fetch(`/api/pengajuan/${pengajuanId}/tolak-opd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatan: alasanTolak }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success("Pengajuan berhasil ditolak")
      router.push("/opd")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menolak pengajuan")
    } finally {
      setLoading(false)
      setShowTolakModal(false)
    }
  }

  return (
    <>
      {hasRevisionNote && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 shadow-xs flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs md:text-sm font-bold text-amber-800">Catatan Revisi dari Admin DPMD:</p>
            <MutedText className="text-amber-700 leading-relaxed font-medium">{hasRevisionNote}</MutedText>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection
          title="Formulir Tindak Lanjut"
          description="Lengkapi deskripsi tindak lanjut beserta file dan video pendukung sebagai bukti penyelesaian berkas."
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Deskripsi */}
            <div className="space-y-2">
              <FormLabel htmlFor="tindaklanjut-deskripsi">
                Deskripsi Tindak Lanjut <span className="text-destructive">*</span>
              </FormLabel>
              <Textarea
                id="tindaklanjut-deskripsi"
                placeholder="Jelaskan langkah-langkah konkret yang telah dilakukan oleh dinas/OPD terkait..."
                rows={9}
                className="resize-none h-[calc(100%-2rem)] min-h-[220px]"
                {...register("deskripsi")}
              />
              {errors.deskripsi && (
                <p className="text-xs font-semibold text-destructive">{errors.deskripsi.message}</p>
              )}
            </div>

            {/* Right Column: Upload & Video Links */}
            <div className="space-y-4">
              {/* File Upload */}
              <div className="space-y-3">
                <FormLabel htmlFor="tindaklanjut-file">Upload Bukti Dokumen/Foto (Maksimal 5)</FormLabel>
                <label htmlFor="tindaklanjut-file" className="group relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border/80 rounded-lg p-6 cursor-pointer text-center transition-all hover:bg-muted/30 hover:border-primary/50">
                  <div className="p-3 bg-muted group-hover:bg-primary/5 group-hover:text-primary rounded-lg transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground block">
                      {uploading ? "Sedang Mengupload..." : "Klik untuk Pilih File"}
                    </span>
                    <MutedText className="mt-0.5 text-xs font-medium">
                      Mendukung format JPG, PNG, atau PDF (Maksimal 10MB)
                    </MutedText>
                  </div>
                  <input
                    id="tindaklanjut-file"
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    multiple
                    onChange={handleFileChange}
                    disabled={uploading || uploadedFiles.length >= 5}
                  />
                </label>

                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {uploadedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs bg-muted/40 border border-border/50 px-3 py-2.5 rounded-lg transition-all hover:bg-muted/65"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate font-semibold text-foreground text-xs">{f.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setUploadedFiles((p) => p.filter((_, idx) => idx !== i))}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          aria-label={`Hapus ${f.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Links */}
              <div className="space-y-3 pt-2">
              <FormLabel htmlFor="tindaklanjut-video-0">Tautan Link Video Bukti (Opsional)</FormLabel>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <Input
                      id={`tindaklanjut-video-${index}`}
                      placeholder="https://youtube.com/... atau tautan video lainnya"
                      {...register(`videoLinks.${index}.url`)}
                      className="flex-1"
                    />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(index)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                        aria-label="Hapus tautan video"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ url: "" })}
                  className="text-xs font-bold gap-1 px-3 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Tautan Video
                </Button>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Buttons Action Group */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="destructive"
            className="flex-1 min-h-[44px] font-bold order-2 sm:order-1"
            onClick={() => setShowTolakModal(true)}
            disabled={loading}
          >
            Tolak & Tutup Pengajuan
          </Button>
          <Button
            type="submit"
            className="flex-1 min-h-[44px] font-bold bg-primary hover:bg-primary/95 text-primary-foreground order-1 sm:order-2"
            disabled={isSubmitting || uploading || loading}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Kirim Tindak Lanjut
          </Button>
        </div>
      </form>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-bold text-foreground">Kirim Tindak Lanjut?</DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-1">
              Pastikan seluruh informasi dan dokumen bukti sudah lengkap dan benar. Berkas ini akan diteruskan ke Admin DPMD untuk verifikasi akhir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" className="font-bold text-xs" onClick={() => setShowSubmitModal(false)}>
              Kembali
            </Button>
            <Button
              onClick={handleSubmit(confirmSubmit)}
              className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl font-bold text-xs"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Ya, Kirim Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showTolakModal} onOpenChange={setShowTolakModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-bold text-foreground">Konfirmasi Penolakan Pengajuan</DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-1">
              Tindakan ini hanya boleh dilakukan jika topik atau berkas tidak sesuai dengan bidang kerja OPD Anda. Pengajuan akan ditutup secara permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <FormLabel htmlFor="tindaklanjut-alasanTolak">Alasan Penolakan <span className="text-destructive">*</span></FormLabel>
            <Textarea
              id="tindaklanjut-alasanTolak"
              value={alasanTolak}
              onChange={(e) => setAlasanTolak(e.target.value)}
              placeholder="Berikan alasan logis mengapa pengajuan ini tidak dapat ditindaklanjuti..."
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button variant="outline" className="font-bold text-xs" onClick={() => setShowTolakModal(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={doTolak}
              disabled={loading || !alasanTolak.trim()}
              className="font-bold text-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Tolak & Tutup Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
