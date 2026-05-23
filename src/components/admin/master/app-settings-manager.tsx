"use client"

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Upload, Trash2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  initialLogoUrl: string | null
}

export function AppSettingsManager({ initialLogoUrl }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)

      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadJson.error ?? "Upload gagal")

      const url: string = uploadJson.data.url

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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">Logo Aplikasi</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Logo akan ditampilkan di halaman login dan sidebar dashboard. Format: PNG, JPG, SVG, WebP. Maks 5MB.
        </p>
      </div>

      {/* Preview */}
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
  )
}
