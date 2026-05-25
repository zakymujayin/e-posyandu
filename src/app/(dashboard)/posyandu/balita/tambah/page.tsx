"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/typography"
import { Loader2, User, Users, FileText } from "lucide-react"

export default function TambahBalitaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    namaBalita: "",
    jenisKelamin: "LAKI_LAKI" as "LAKI_LAKI" | "PEREMPUAN",
    tanggalLahir: "",
    namaOrangTua: "",
    nikOrangTua: "",
    noHpOrangTua: "",
    alamat: "",
    catatanKesehatan: "",
  })

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.namaBalita || !form.tanggalLahir || !form.namaOrangTua) {
      toast.error("Isi semua field wajib")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/balita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaBalita: form.namaBalita,
          jenisKelamin: form.jenisKelamin,
          tanggalLahir: form.tanggalLahir,
          namaOrangTua: form.namaOrangTua,
          nikOrangTua: form.nikOrangTua || null,
          noHpOrangTua: form.noHpOrangTua || null,
          alamat: form.alamat || null,
          catatanKesehatan: form.catatanKesehatan || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
      toast.success("Data balita berhasil ditambahkan")
      router.push(`/posyandu/balita/${data.data.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer className="space-y-6 max-w-2xl">
      <PageHeader
        title="Tambah Data Balita"
        description="Daftarkan data anak baru ke posyandu Anda"
        backHref="/posyandu/balita"
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Data Anak */}
        <Card>
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <CardTitle>Data Anak</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap Anak <span className="text-destructive">*</span></Label>
              <Input
                value={form.namaBalita}
                onChange={(e) => set("namaBalita", e.target.value)}
                placeholder="Nama lengkap anak"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Jenis Kelamin <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  {(["LAKI_LAKI", "PEREMPUAN"] as const).map((jk) => (
                    <button
                      key={jk}
                      type="button"
                      onClick={() => set("jenisKelamin", jk)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                        form.jenisKelamin === jk
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      {jk === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal Lahir <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.tanggalLahir}
                  onChange={(e) => set("tanggalLahir", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Orang Tua */}
        <Card>
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <CardTitle>Data Orang Tua / Wali</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Orang Tua / Wali <span className="text-destructive">*</span></Label>
              <Input
                value={form.namaOrangTua}
                onChange={(e) => set("namaOrangTua", e.target.value)}
                placeholder="Nama ibu / ayah / wali"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>NIK Orang Tua</Label>
                <Input
                  value={form.nikOrangTua}
                  onChange={(e) => set("nikOrangTua", e.target.value)}
                  placeholder="16 digit NIK"
                />
              </div>
              <div className="space-y-1.5">
                <Label>No. HP</Label>
                <Input
                  value={form.noHpOrangTua}
                  onChange={(e) => set("noHpOrangTua", e.target.value)}
                  placeholder="08xx"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Alamat</Label>
              <Input
                value={form.alamat}
                onChange={(e) => set("alamat", e.target.value)}
                placeholder="Alamat lengkap"
              />
            </div>
          </CardContent>
        </Card>

        {/* Catatan */}
        <Card>
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <CardTitle>Catatan Kesehatan</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <Textarea
              value={form.catatanKesehatan}
              onChange={(e) => set("catatanKesehatan", e.target.value)}
              placeholder="Catatan riwayat kesehatan, kondisi khusus, dll. (opsional)"
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
          <Button type="submit" disabled={loading} className="gap-2 font-bold">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan Data Balita
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
