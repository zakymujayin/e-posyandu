"use client"

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Upload, Trash2, ImageIcon, ChevronUp, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type SlidePhoto = {
  url: string
  alt: string
  caption?: string
}

interface Props {
  initialLogoUrl: string | null
  initialSliderPhotos: SlidePhoto[]
}

export function AppSettingsManager({ initialLogoUrl, initialSliderPhotos }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [sliderPhotos, setSliderPhotos] = useState<SlidePhoto[]>(initialSliderPhotos)
  const [sliderUploading, setSliderUploading] = useState(false)
  const [sliderSaving, setSliderSaving] = useState(false)
  const sliderFileRef = useRef<HTMLInputElement>(null)

  // Perkecil & kompres gambar di browser sebelum dikirim, agar ukurannya
  // selalu kecil dan tidak ditolak batas upload server (yang bisa muncul
  // sebagai "error html"). forceJpeg=true untuk foto slider (tak butuh
  // transparansi); logo PNG dibiarkan PNG agar transparansi tetap terjaga.
  async function compressImage(file: File, forceJpeg: boolean): Promise<File> {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = dataUrl
      })

      const maxDim = 1600
      let { width, height } = img
      if (Math.max(width, height) > maxDim) {
        const scale = maxDim / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return file
      ctx.drawImage(img, 0, 0, width, height)

      const keepPng = file.type === "image/png" && !forceJpeg
      const outType = keepPng ? "image/png" : "image/jpeg"
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, outType, outType === "image/jpeg" ? 0.82 : undefined),
      )
      if (!blob || blob.size >= file.size) return file

      const ext = outType === "image/jpeg" ? "jpg" : "png"
      const name = file.name.replace(/\.[^.]+$/, "") + "." + ext
      return new File([blob], name, { type: outType })
    } catch {
      return file
    }
  }

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (!res.ok) {
      if (res.status === 413) throw new Error("Ukuran foto terlalu besar (maksimal 5MB).")
      let msg = "Upload gagal"
      try {
        msg = (await res.json()).error ?? msg
      } catch {
        // respons bukan JSON (mis. halaman error proxy) — pakai pesan default
      }
      throw new Error(msg)
    }
    const json = await res.json()
    return json.data.url as string
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadImage(await compressImage(file, false))

      const saveRes = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "logo_url", value: url }),
      })
      const saveJson = await saveRes.json()
      if (!saveRes.ok) throw new Error(saveJson.error ?? "Gagal menyimpan")

      setLogoUrl(url)
      toast.success("Logo berhasil diupload")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "logo_url", value: "" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Gagal menghapus")
      setLogoUrl(null)
      toast.success("Logo dihapus")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setRemoving(false)
    }
  }

  async function saveSlider(photos: SlidePhoto[]) {
    setSliderSaving(true)
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "slider_photos", value: JSON.stringify(photos) }),
      })
    } catch {
      toast.error("Gagal menyimpan slider")
    } finally {
      setSliderSaving(false)
    }
  }

  async function handleSliderUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSliderUploading(true)
    try {
      const url = await uploadImage(await compressImage(file, true))
      const updated = [...sliderPhotos, { url, alt: "", caption: "" }]
      setSliderPhotos(updated)
      await saveSlider(updated)
      toast.success("Foto berhasil ditambahkan")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSliderUploading(false)
      if (sliderFileRef.current) sliderFileRef.current.value = ""
    }
  }

  function handleCaptionChange(index: number, value: string) {
    setSliderPhotos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, caption: value, alt: value } : p)),
    )
  }

  async function handleSliderDelete(index: number) {
    const updated = sliderPhotos.filter((_, i) => i !== index)
    setSliderPhotos(updated)
    await saveSlider(updated)
    toast.success("Foto dihapus")
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return
    const updated = [...sliderPhotos]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    setSliderPhotos(updated)
    await saveSlider(updated)
  }

  async function handleMoveDown(index: number) {
    if (index === sliderPhotos.length - 1) return
    const updated = [...sliderPhotos]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    setSliderPhotos(updated)
    await saveSlider(updated)
  }

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Logo Aplikasi</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Logo akan ditampilkan di halaman login dan sidebar dashboard. Format: PNG, JPG, SVG, WebP. Maks 5MB.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 shrink-0 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="logo-upload"
            />
            <Button
              type="button"
              size="sm"
              className="text-xs gap-1.5"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "Mengupload..." : logoUrl ? "Ganti Logo" : "Upload Logo"}
            </Button>
            {logoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 text-destructive hover:text-destructive"
                disabled={removing}
                onClick={handleRemove}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {removing ? "Menghapus..." : "Hapus Logo"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Slider Photos Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Slider Foto Landing Page</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Foto Ibu Ketua TP PKK selalu tampil paling depan secara otomatis. Foto yang Anda tambahkan di bawah
            ini akan tampil setelahnya. Isi deskripsi tiap foto sebagai keterangan di bawah foto. Urutan dapat
            diatur dengan tombol panah. Format: PNG, JPG, WebP. Maks 5MB per foto.
          </p>
        </div>

        <div className="space-y-3">
          {sliderPhotos.map((photo, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
              <div className="w-16 h-16 rounded-lg border border-gray-200 bg-white shrink-0 overflow-hidden">
                <img src={photo.url} alt={photo.alt || `Foto ${i + 1}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <input
                  type="text"
                  value={photo.caption ?? ""}
                  onChange={(e) => handleCaptionChange(i, e.target.value)}
                  onBlur={() => saveSlider(sliderPhotos)}
                  placeholder={`Deskripsi Foto ${i + 1}`}
                  disabled={sliderSaving}
                  className="w-full text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-60"
                />
                <p className="text-[10px] text-muted-foreground truncate">
                  {photo.url.split("/").pop()}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  disabled={i === 0 || sliderSaving}
                  onClick={() => handleMoveUp(i)}
                  className="size-7"
                >
                  <ChevronUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  disabled={i === sliderPhotos.length - 1 || sliderSaving}
                  onClick={() => handleMoveDown(i)}
                  className="size-7"
                >
                  <ChevronDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  disabled={sliderSaving}
                  onClick={() => handleSliderDelete(i)}
                  className="size-7 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {sliderPhotos.length === 0 && (
            <div className="flex items-center justify-center p-6 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-xs text-muted-foreground">Belum ada foto. Klik tombol di bawah untuk menambahkan.</p>
            </div>
          )}
        </div>

        <div>
          <input
            ref={sliderFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleSliderUpload}
            className="hidden"
            id="slider-upload"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            disabled={sliderUploading || sliderSaving}
            onClick={() => sliderFileRef.current?.click()}
          >
            <Plus className="w-3.5 h-3.5" />
            {sliderUploading ? "Mengupload..." : "Tambah Foto"}
          </Button>
        </div>
      </div>
    </div>
  )
}
