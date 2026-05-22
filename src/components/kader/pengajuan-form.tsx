"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Plus, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface LayananJenis {
  id: string
  name: string
  description?: string | null
}

interface FormField {
  id: string
  fieldLabel: string
  fieldName: string
  fieldType: string
  fieldOptions: unknown
  isRequired: boolean
  placeholder?: string | null
  helperText?: string | null
}

interface Props {
  opdId: string
  opdName: string
  layananList: LayananJenis[]
}

const formSchema = z.object({
  layananJenisId: z.string().min(1, "Pilih jenis layanan"),
  namaPelapor: z.string().min(1, "Nama pelapor wajib diisi"),
  nikPelapor: z.string().optional(),
  noHpPelapor: z.string().optional(),
  alamatPelapor: z.string().min(1, "Alamat wajib diisi"),
  deskripsi: z.string().min(20, "Deskripsi minimal 20 karakter"),
  videoLinks: z.array(z.object({ url: z.string().url("URL tidak valid").or(z.literal("")) })).optional(),
})

type FormValues = z.infer<typeof formSchema>

export function PengajuanForm({ opdId, opdName, layananList }: Props) {
  const router = useRouter()
  const [dynamicFields, setDynamicFields] = useState<FormField[]>([])
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({})
  const [uploadedFiles, setUploadedFiles] = useState<{ path: string; name: string; size: number; mime: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<FormValues | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { videoLinks: [] },
  })

  const { fields: videoFields, append: appendVideo, remove: removeVideo } = useFieldArray({
    control,
    name: "videoLinks",
  })

  const selectedLayananId = watch("layananJenisId")

  async function onLayananChange(layananId: string | null) {
    setValue("layananJenisId", layananId ?? "")
    setDynamicValues({})
    if (!layananId) return setDynamicFields([])

    try {
      const res = await fetch(`/api/layanan/${layananId}/fields`)
      const json = await res.json()
      setDynamicFields(json.data ?? [])
    } catch {
      toast.error("Gagal memuat form fields")
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (uploadedFiles.length + files.length > 5) {
      toast.error("Maksimal 5 file")
      return
    }

    setUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        setUploadedFiles((prev) => [...prev, {
          path: json.data.url,
          name: json.data.fileName,
          size: json.data.size,
          mime: json.data.mimeType,
        }])
      }
      toast.success("File berhasil diupload")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal upload file")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function onSubmit(values: FormValues) {
    // Validate dynamic required fields
    for (const field of dynamicFields) {
      if (field.isRequired && !dynamicValues[field.id]?.trim()) {
        toast.error(`${field.fieldLabel} wajib diisi`)
        return
      }
    }
    setPendingSubmit(values)
    setShowConfirm(true)
  }

  async function confirmSubmit() {
    if (!pendingSubmit) return
    setShowConfirm(false)

    const payload = {
      opdId,
      layananJenisId: pendingSubmit.layananJenisId,
      namaPelapor: pendingSubmit.namaPelapor,
      nikPelapor: pendingSubmit.nikPelapor,
      noHpPelapor: pendingSubmit.noHpPelapor,
      alamatPelapor: pendingSubmit.alamatPelapor,
      deskripsi: pendingSubmit.deskripsi,
      fieldValues: Object.entries(dynamicValues).map(([formFieldId, fieldValue]) => ({
        formFieldId,
        fieldValue,
      })),
      attachments: [
        ...uploadedFiles.map((f) => ({
          attachmentType: "FILE",
          filePath: f.path,
          fileName: f.name,
          fileSize: f.size,
          mimeType: f.mime,
        })),
        ...(pendingSubmit.videoLinks ?? [])
          .filter((v) => v.url)
          .map((v) => ({
            attachmentType: "VIDEO_LINK",
            videoUrl: v.url,
            videoPlatform: detectPlatform(v.url),
          })),
      ],
    }

    try {
      const res = await fetch("/api/pengajuan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      router.push(`/kader/ajukan/sukses?tiket=${json.data.tiketNumber}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengirim pengajuan")
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Pilih Jenis Layanan */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Jenis Layanan</h2>
          <div className="space-y-2">
            <Label>Pilih Jenis Layanan <span className="text-red-500">*</span></Label>
            <Select onValueChange={onLayananChange} value={selectedLayananId ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="— Pilih Jenis Layanan —" />
              </SelectTrigger>
              <SelectContent>
                {layananList.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.layananJenisId && (
              <p className="text-sm text-red-600">{errors.layananJenisId.message}</p>
            )}
          </div>
        </div>

        {/* Dynamic Fields */}
        {dynamicFields.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Detail Layanan</h2>
            {dynamicFields.map((field) => (
              <div key={field.id} className="space-y-1">
                <Label>
                  {field.fieldLabel}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <DynamicFieldInput
                  field={field}
                  value={dynamicValues[field.id] ?? ""}
                  onChange={(val) => setDynamicValues((prev) => ({ ...prev, [field.id]: val }))}
                />
                {field.helperText && (
                  <p className="text-xs text-gray-500">{field.helperText}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Data Pelapor */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Data Pelapor</h2>

          <div className="space-y-1">
            <Label>Nama Pelapor <span className="text-red-500">*</span></Label>
            <Input placeholder="Masukkan nama lengkap" {...register("namaPelapor")} />
            {errors.namaPelapor && <p className="text-sm text-red-600">{errors.namaPelapor.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>NIK Pelapor</Label>
              <Input placeholder="16 digit NIK (opsional)" maxLength={16} {...register("nikPelapor")} />
            </div>
            <div className="space-y-1">
              <Label>No. HP Pelapor</Label>
              <Input placeholder="08xx (opsional)" {...register("noHpPelapor")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Alamat Pelapor <span className="text-red-500">*</span></Label>
            <Textarea placeholder="Alamat lengkap" rows={3} {...register("alamatPelapor")} />
            {errors.alamatPelapor && <p className="text-sm text-red-600">{errors.alamatPelapor.message}</p>}
          </div>
        </div>

        {/* Deskripsi */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Deskripsi Pengaduan</h2>
          <div className="space-y-1">
            <Label>Deskripsi / Uraian <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="Jelaskan secara detail permasalahan atau layanan yang dibutuhkan"
              rows={5}
              {...register("deskripsi")}
            />
            <p className="text-xs text-gray-500">Minimal 20 karakter</p>
            {errors.deskripsi && <p className="text-sm text-red-600">{errors.deskripsi.message}</p>}
          </div>
        </div>

        {/* Lampiran */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Lampiran (Opsional)</h2>

          {/* File upload */}
          <div className="space-y-2">
            <Label>Upload Foto / Dokumen</Label>
            <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {uploading ? "Mengupload..." : "Klik untuk pilih file"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                onChange={handleFileChange}
                disabled={uploading || uploadedFiles.length >= 5}
              />
            </label>
            <p className="text-xs text-gray-500">Format: JPG, PNG, PDF. Maks 5 MB per file. Maks 5 file.</p>
            {uploadedFiles.length > 0 && (
              <ul className="space-y-1">
                {uploadedFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="truncate text-gray-700">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Video links */}
          <div className="space-y-2">
            <Label>Link Video</Label>
            {videoFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder="https://youtube.com/..."
                  {...register(`videoLinks.${index}.url`)}
                />
                <button type="button" onClick={() => removeVideo(index)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendVideo({ url: "" })}>
              <Plus className="w-4 h-4 mr-1" /> Tambah Link Video
            </Button>
            <p className="text-xs text-gray-500">Tempel link video dari YouTube, TikTok, atau platform lain</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 min-h-[44px]">
            Batal
          </Button>
          <Button type="submit" className="flex-1 min-h-[44px]" disabled={isSubmitting || uploading}>
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</> : "Kirim Pengajuan"}
          </Button>
        </div>
      </form>

      {/* Confirm Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pengajuan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Apakah data yang Anda masukkan sudah benar? Pengajuan yang sudah dikirim tidak dapat diedit.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Batal</Button>
            <Button onClick={confirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Ya, Kirim Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DynamicFieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: string
  onChange: (v: string) => void
}) {
  const options = (() => {
    try {
      const parsed = typeof field.fieldOptions === "string"
        ? JSON.parse(field.fieldOptions)
        : field.fieldOptions
      return (parsed as { options?: { value: string; label: string }[] })?.options ?? []
    } catch {
      return []
    }
  })()

  if (field.fieldType === "textarea") {
    return (
      <Textarea
        placeholder={field.placeholder ?? ""}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    )
  }

  if (field.fieldType === "select") {
    return (
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger><SelectValue placeholder={field.placeholder ?? "— Pilih —"} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (field.fieldType === "radio") {
    return (
      <div className="flex flex-wrap gap-4">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={field.id}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span className="text-sm">{o.label}</span>
          </label>
        ))}
      </div>
    )
  }

  if (field.fieldType === "checkbox") {
    const selected: string[] = (() => {
      try { return JSON.parse(value) as string[] } catch { return [] }
    })()
    return (
      <div className="flex flex-wrap gap-4">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              value={o.value}
              checked={selected.includes(o.value)}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, o.value]
                  : selected.filter((v) => v !== o.value)
                onChange(JSON.stringify(next))
              }}
            />
            <span className="text-sm">{o.label}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <Input
      type={field.fieldType === "number" ? "number" : field.fieldType === "date" ? "date" : "text"}
      placeholder={field.placeholder ?? ""}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function detectPlatform(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
  if (url.includes("tiktok.com")) return "tiktok"
  if (url.includes("instagram.com")) return "instagram"
  if (url.includes("facebook.com")) return "facebook"
  return "other"
}
