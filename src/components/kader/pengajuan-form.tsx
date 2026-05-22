"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Plus, X, Upload, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormSection } from "@/components/shared/form-section"
import { FormLabel, MutedText } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-12">
        {/* Jenis Layanan */}
        <FormSection
          title="Jenis Layanan"
          description="Pilih salah satu spesifikasi klasifikasi layanan yang akan diajukan ke dinas terkait."
        >
          <div className="space-y-1.5">
            <FormLabel htmlFor="pengajuan-layananJenisId">
              Klasifikasi Layanan <span className="text-destructive">*</span>
            </FormLabel>
            <Select onValueChange={onLayananChange} value={selectedLayananId ?? ""}>
              <SelectTrigger id="pengajuan-layananJenisId" className="w-full rounded-lg border-border bg-background focus:ring-primary focus:border-primary">
                <span className={cn("flex flex-1 text-left text-sm truncate", !selectedLayananId && "text-muted-foreground")}>
                  {selectedLayananId
                    ? (layananList.find((l) => l.id === selectedLayananId)?.name ?? "— Pilih Klasifikasi Layanan —")
                    : "— Pilih Klasifikasi Layanan —"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {layananList.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.layananJenisId && (
              <p className="text-xs font-medium text-destructive mt-1">
                {errors.layananJenisId.message}
              </p>
            )}
          </div>
        </FormSection>

        {/* Dynamic Fields */}
        {dynamicFields.length > 0 && (
          <FormSection
            title="Formulir Detail Layanan"
            description="Silakan lengkapi atribut data dukung di bawah ini sesuai spesifikasi jenis layanan."
          >
            {dynamicFields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <FormLabel className="flex items-center gap-1">
                  {field.fieldLabel}
                  {field.isRequired && <span className="text-destructive">*</span>}
                </FormLabel>
                <DynamicFieldInput
                  field={field}
                  value={dynamicValues[field.id] ?? ""}
                  onChange={(val) => setDynamicValues((prev) => ({ ...prev, [field.id]: val }))}
                />
                {field.helperText && (
                  <MutedText className="italic mt-1 leading-normal">
                    * {field.helperText}
                  </MutedText>
                )}
              </div>
            ))}
          </FormSection>
        )}

        {/* Data Pelapor */}
        <FormSection
          title="Informasi Pelapor"
          description="Lengkapi identitas warga atau pihak yang mengajukan laporan / kebutuhan pelayanan."
        >
          <div className="space-y-1.5">
            <FormLabel htmlFor="pengajuan-namaPelapor">
              Nama Lengkap Pelapor <span className="text-destructive">*</span>
            </FormLabel>
            <Input
              id="pengajuan-namaPelapor"
              placeholder="Contoh: Budi Santoso"
              className="rounded-lg border-border bg-background"
              {...register("namaPelapor")}
            />
            {errors.namaPelapor && (
              <p className="text-xs font-medium text-destructive mt-1">
                {errors.namaPelapor.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FormLabel htmlFor="pengajuan-nikPelapor">NIK Pelapor</FormLabel>
              <Input
                id="pengajuan-nikPelapor"
                placeholder="16 Digit Nomor Induk Kependudukan (opsional)"
                maxLength={16}
                inputMode="numeric"
                className="rounded-lg border-border bg-background"
                {...register("nikPelapor")}
              />
            </div>
            <div className="space-y-1.5">
              <FormLabel htmlFor="pengajuan-noHpPelapor">Nomor HP / WhatsApp</FormLabel>
              <Input
                id="pengajuan-noHpPelapor"
                placeholder="Contoh: 0812XXXXXXXX (opsional)"
                inputMode="tel"
                className="rounded-lg border-border bg-background"
                {...register("noHpPelapor")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FormLabel htmlFor="pengajuan-alamatPelapor">
              Alamat Lengkap Domisili <span className="text-destructive">*</span>
            </FormLabel>
            <Textarea
              id="pengajuan-alamatPelapor"
              placeholder="Tuliskan nama jalan, RT/RW, nomor rumah, dan keterangan wilayah lainnya"
              rows={3}
              className="rounded-lg border-border bg-background resize-none"
              {...register("alamatPelapor")}
            />
            {errors.alamatPelapor && (
              <p className="text-xs font-medium text-destructive mt-1">
                {errors.alamatPelapor.message}
              </p>
            )}
          </div>
        </FormSection>

        {/* Deskripsi */}
        <FormSection
          title="Deskripsi Masalah / Uraian"
          description="Tuliskan penjelasan lengkap mengenai kendala, kronologi, atau bantuan yang dibutuhkan."
        >
          <div className="space-y-1.5">
            <FormLabel htmlFor="pengajuan-deskripsi">
              Uraian Detail Pengaduan <span className="text-destructive">*</span>
            </FormLabel>
            <Textarea
              id="pengajuan-deskripsi"
              placeholder="Ceritakan sedetail mungkin agar mempercepat proses verifikasi oleh tim dinas terkait..."
              rows={5}
              className="rounded-lg border-border bg-background"
              {...register("deskripsi")}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mt-1">
              <span>Pastikan isi deskripsi valid</span>
              <span>Minimal 20 Karakter</span>
            </div>
            {errors.deskripsi && (
              <p className="text-xs font-medium text-destructive mt-1">
                {errors.deskripsi.message}
              </p>
            )}
          </div>
        </FormSection>

        {/* Lampiran */}
        <FormSection
          title="Lampiran & Berkas Dukung"
          description="Unggah foto kejadian, surat rekomendasi, berkas PDF pendukung, atau tautan video."
        >
          {/* File upload */}
          <div className="space-y-3">
            <FormLabel htmlFor="pengajuan-file">Berkas / Dokumen Lampiran</FormLabel>
            <label htmlFor="pengajuan-file" className="group/drop flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all duration-300">
              <div className="p-2.5 rounded-lg bg-background border border-border text-muted-foreground group-hover/drop:scale-110 group-hover/drop:text-primary transition-all duration-300 shadow-xs">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground mt-1">
                {uploading ? "Sedang Mengunggah..." : "Pilih Dokumen Dukung"}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Klik untuk memilih file dari galeri perangkat Anda
              </span>
              <input
                id="pengajuan-file"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                onChange={handleFileChange}
                disabled={uploading || uploadedFiles.length >= 5}
              />
            </label>
            <MutedText className="italic leading-normal mt-1">
              * Mendukung format berkas: JPG, PNG, PDF. Maksimal 5 MB per berkas. Maksimal 5 berkas lampiran.
            </MutedText>
            
            {uploadedFiles.length > 0 && (
              <ul className="space-y-2 mt-3">
                {uploadedFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs bg-muted/30 border border-border px-3.5 py-2.5 rounded-lg animate-fade-in">
                    <span className="truncate text-foreground font-semibold max-w-[80%]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded-lg transition-colors"
                      aria-label={`Hapus ${f.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Video links */}
          <div className="space-y-3 pt-3 border-t border-border/50">
            <FormLabel htmlFor="pengajuan-video-0">Link Referensi Video</FormLabel>
            {videoFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center animate-fade-in">
                <div className="flex-1 relative">
                  <Input
                    id={`pengajuan-video-${index}`}
                    placeholder="Contoh: https://youtube.com/watch?v=..."
                    className="rounded-lg border-border bg-background pr-9"
                    {...register(`videoLinks.${index}.url`)}
                  />
                  <Video className="size-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  className="text-destructive hover:bg-destructive/10 p-2 rounded-lg border border-transparent hover:border-destructive/10 transition-all duration-200"
                  aria-label="Hapus tautan video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <div className="pt-1.5 flex flex-col gap-2 items-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendVideo({ url: "" })}
                className="rounded-lg font-bold gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Tautan Video
              </Button>
              <MutedText className="italic leading-normal mt-1">
                * Tempel link video dari platform YouTube, TikTok, Instagram, atau Facebook.
              </MutedText>
            </div>
          </div>
        </FormSection>

        {/* Actions Submit / Cancel */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 min-h-[44px] rounded-lg font-bold tracking-tight"
          >
            Kembali
          </Button>
          <Button
            type="submit"
            className="flex-1 min-h-[44px] rounded-lg font-bold tracking-tight shadow-md"
            disabled={isSubmitting || uploading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Pengajuan"
            )}
          </Button>
        </div>
      </form>

      {/* Confirm Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="rounded-lg border border-border bg-card max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground tracking-tight">
              Kirim Pengajuan Sekarang?
            </DialogTitle>
          </DialogHeader>
          <MutedText className="py-2 leading-relaxed">
            Pastikan seluruh data pelapor dan dokumen dukung Anda sudah sesuai. Pengajuan yang telah dikirim akan langsung diteruskan ke proses verifikasi desa.
          </MutedText>
          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="flex-1 text-xs font-semibold"
            >
              Ubah Kembali
            </Button>
            <Button
              onClick={confirmSubmit}
              disabled={isSubmitting}
              className="flex-1 text-xs font-bold"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Ya, Kirim
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
        placeholder={field.placeholder ?? "Isi dengan lengkap..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="rounded-lg border-border bg-background"
      />
    )
  }

  if (field.fieldType === "select") {
    const selectedOption = options.find((o) => o.value === value)
    return (
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="w-full rounded-lg border-border bg-background focus:ring-primary focus:border-primary">
          <span className={cn("flex flex-1 text-left text-sm truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : (field.placeholder ?? "— Pilih Pilihan —")}
          </span>
        </SelectTrigger>
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
      <div className="flex flex-wrap gap-4 py-1.5">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
            <input
              type="radio"
              name={field.id}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="accent-primary size-4 rounded-full border-border focus:ring-primary"
            />
            <span>{o.label}</span>
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
      <div className="flex flex-wrap gap-4 py-1.5">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
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
              className="accent-primary size-4 rounded-md border-border focus:ring-primary"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <Input
      type={field.fieldType === "number" ? "number" : field.fieldType === "date" ? "date" : "text"}
      placeholder={field.placeholder ?? "Ketik nilai..."}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border-border bg-background"
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
