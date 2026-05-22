"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Plus, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-medium text-orange-800">Catatan Revisi dari Admin DPMD:</p>
          <p className="text-sm text-orange-700 mt-1">{hasRevisionNote}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Form Tindak Lanjut</h3>

          <div className="space-y-1">
            <Label>Deskripsi Tindak Lanjut <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="Jelaskan langkah-langkah yang telah dilakukan..."
              rows={5}
              {...register("deskripsi")}
            />
            {errors.deskripsi && <p className="text-sm text-red-600">{errors.deskripsi.message}</p>}
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label>Upload Bukti (Opsional)</Label>
            <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{uploading ? "Mengupload..." : "Klik untuk pilih file"}</span>
              <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" multiple onChange={handleFileChange} disabled={uploading || uploadedFiles.length >= 5} />
            </label>
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                <span className="truncate">{f.name}</span>
                <button type="button" onClick={() => setUploadedFiles((p) => p.filter((_, idx) => idx !== i))}><X className="w-4 h-4 text-red-500" /></button>
              </div>
            ))}
          </div>

          {/* Video links */}
          <div className="space-y-2">
            <Label>Link Video Bukti (Opsional)</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input placeholder="https://..." {...register(`videoLinks.${index}.url`)} />
                <button type="button" onClick={() => remove(index)}><X className="w-4 h-4 text-red-500" /></button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ url: "" })}>
              <Plus className="w-4 h-4 mr-1" /> Tambah Link Video
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="destructive"
            className="flex-1 min-h-[44px]"
            onClick={() => setShowTolakModal(true)}
            disabled={loading}
          >
            Tolak Pengajuan
          </Button>
          <Button type="submit" className="flex-1 min-h-[44px] bg-green-600 hover:bg-green-700" disabled={isSubmitting || uploading || loading}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Kirim Tindak Lanjut
          </Button>
        </div>
      </form>

      {/* Submit Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Konfirmasi Tindak Lanjut</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Apakah Anda yakin ingin mengirimkan tindak lanjut ini untuk direview oleh Admin DPMD?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>Batal</Button>
            <Button onClick={handleSubmit(confirmSubmit)} className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Kirim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tolak Modal */}
      <Dialog open={showTolakModal} onOpenChange={setShowTolakModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tolak Pengajuan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Tolak jika pengajuan ini tidak sesuai dengan tupoksi OPD Anda. Pengajuan akan ditutup permanen.
            </p>
            <Textarea value={alasanTolak} onChange={(e) => setAlasanTolak(e.target.value)} placeholder="Alasan penolakan..." rows={3} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTolakModal(false)}>Batal</Button>
            <Button variant="destructive" onClick={doTolak} disabled={loading || !alasanTolak.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
