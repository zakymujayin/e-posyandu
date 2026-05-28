"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  User, MapPin, Users, GraduationCap, ClipboardList,
  ChevronDown, ChevronUp, CheckCircle2, Loader2,
} from "lucide-react"
import {
  PENDIDIKAN_OPTIONS, STATUS_SEKOLAH_OPTIONS, ALASAN_OPTIONS, PROGRAM_OPTIONS,
  hitungUsiaAnak,
} from "@/lib/utils-ats"

interface ATSFormData {
  namaAnak: string
  nik: string
  jenisKelamin: "LAKI_LAKI" | "PEREMPUAN"
  tempatLahir: string
  tanggalLahir: string
  alamat: string
  rtRw: string
  namaOrangTua: string
  pekerjaanOrangTua: string
  noHpOrangTua: string
  pendidikanTerakhir: string
  kelasTerakhir: string
  statusSekolah: string
  alasanTidakSekolah: string
  alasanLainnya: string
  tahunPutusSekolah: string
  keinginanSekolah: string
  programDibutuhkan: string[]
  programLainnya: string
  keterangan: string
}

interface WilayahInfo {
  desaName: string
  kecamatanName: string
}

interface ATSFormProps {
  mode: "tambah" | "edit"
  atsId?: string
  defaultValues?: Partial<ATSFormData>
  wilayah: WilayahInfo
}

const EMPTY_FORM: ATSFormData = {
  namaAnak: "", nik: "", jenisKelamin: "LAKI_LAKI", tempatLahir: "",
  tanggalLahir: "", alamat: "", rtRw: "", namaOrangTua: "",
  pekerjaanOrangTua: "", noHpOrangTua: "", pendidikanTerakhir: "",
  kelasTerakhir: "", statusSekolah: "", alasanTidakSekolah: "",
  alasanLainnya: "", tahunPutusSekolah: "", keinginanSekolah: "",
  programDibutuhkan: [], programLainnya: "", keterangan: "",
}

function isSectionADone(f: ATSFormData) {
  return !!(f.namaAnak && f.jenisKelamin && f.tempatLahir && f.tanggalLahir && f.alamat)
}
function isSectionCDone(f: ATSFormData) { return !!f.namaOrangTua }
function isSectionDDone(f: ATSFormData) {
  return !!(f.pendidikanTerakhir && f.statusSekolah && f.alasanTidakSekolah &&
    (f.alasanTidakSekolah !== "Lainnya" || f.alasanLainnya))
}
function isSectionEDone(f: ATSFormData) {
  return !!(f.keinginanSekolah && (!(f.programDibutuhkan.includes("Lainnya")) || f.programLainnya))
}

export function ATSForm({ mode, atsId, defaultValues, wilayah }: ATSFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<ATSFormData>({ ...EMPTY_FORM, ...defaultValues })
  const [open, setOpen] = useState<number[]>([0])
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split("T")[0]

  const usia = form.tanggalLahir
    ? hitungUsiaAnak(new Date(form.tanggalLahir))
    : null

  function set<K extends keyof ATSFormData>(key: K, value: ATSFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "pendidikanTerakhir" && value === "Tidak Sekolah") {
        next.statusSekolah = "Tidak Pernah Sekolah"
        next.kelasTerakhir = ""
        next.tahunPutusSekolah = ""
      }
      if (key === "statusSekolah" && value === "Tidak Pernah Sekolah") {
        next.kelasTerakhir = ""
        next.tahunPutusSekolah = ""
      }
      if (key === "alasanTidakSekolah" && value !== "Lainnya") {
        next.alasanLainnya = ""
      }
      return next
    })
  }

  function toggleSection(idx: number) {
    setOpen((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx])
  }

  function toggleProgram(p: string) {
    set("programDibutuhkan", form.programDibutuhkan.includes(p)
      ? form.programDibutuhkan.filter((x) => x !== p)
      : [...form.programDibutuhkan, p]
    )
  }

  function validate() {
    if (!form.namaAnak) { toast.error("Nama anak wajib diisi"); setOpen([0]); return false }
    if (!form.jenisKelamin) { toast.error("Jenis kelamin wajib dipilih"); setOpen([0]); return false }
    if (!form.tempatLahir) { toast.error("Tempat lahir wajib diisi"); setOpen([0]); return false }
    if (!form.tanggalLahir) { toast.error("Tanggal lahir wajib diisi"); setOpen([0]); return false }
    if (!form.alamat) { toast.error("Alamat wajib diisi"); setOpen([0]); return false }
    if (!form.namaOrangTua) { toast.error("Nama orang tua wajib diisi"); setOpen([2]); return false }
    if (!form.pendidikanTerakhir) { toast.error("Pendidikan terakhir wajib dipilih"); setOpen([3]); return false }
    if (!form.statusSekolah) { toast.error("Status sekolah wajib dipilih"); setOpen([3]); return false }
    if (!form.alasanTidakSekolah) { toast.error("Alasan tidak sekolah wajib dipilih"); setOpen([3]); return false }
    if (form.alasanTidakSekolah === "Lainnya" && !form.alasanLainnya) {
      toast.error("Alasan lainnya wajib diisi"); setOpen([3]); return false
    }
    if (!form.keinginanSekolah) { toast.error("Keinginan sekolah wajib dipilih"); setOpen([4]); return false }
    if (form.programDibutuhkan.includes("Lainnya") && !form.programLainnya) {
      toast.error("Program lainnya wajib diisi"); setOpen([4]); return false
    }
    return true
  }

  async function handleSubmit() {
    setShowConfirm(false)
    setLoading(true)
    try {
      const payload = {
        namaAnak: form.namaAnak,
        nik: form.nik || null,
        jenisKelamin: form.jenisKelamin,
        tempatLahir: form.tempatLahir,
        tanggalLahir: form.tanggalLahir,
        alamat: form.alamat,
        rtRw: form.rtRw || null,
        namaOrangTua: form.namaOrangTua,
        pekerjaanOrangTua: form.pekerjaanOrangTua || null,
        noHpOrangTua: form.noHpOrangTua || null,
        pendidikanTerakhir: form.pendidikanTerakhir,
        kelasTerakhir: form.kelasTerakhir || null,
        statusSekolah: form.statusSekolah,
        alasanTidakSekolah: form.alasanTidakSekolah,
        alasanLainnya: form.alasanLainnya || null,
        tahunPutusSekolah: form.tahunPutusSekolah ? parseInt(form.tahunPutusSekolah) : null,
        keinginanSekolah: form.keinginanSekolah,
        programDibutuhkan: form.programDibutuhkan.length > 0 ? form.programDibutuhkan : null,
        programLainnya: form.programLainnya || null,
        keterangan: form.keterangan || null,
      }

      const url = mode === "edit" ? `/api/ats/${atsId}` : "/api/ats"
      const method = mode === "edit" ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }

      toast.success(mode === "edit" ? "Data ATS berhasil diperbarui" : "Data ATS berhasil disimpan")
      router.push("/posyandu/ats")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const tahunOptions = Array.from({ length: new Date().getFullYear() - 2014 }, (_, i) => 2015 + i)
  const tidakPernahSekolah = form.statusSekolah === "Tidak Pernah Sekolah"

  const sections = [
    {
      icon: User,
      title: "Data Anak",
      done: isSectionADone(form),
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nama Anak <span className="text-destructive">*</span></Label>
            <Input value={form.namaAnak} onChange={(e) => set("namaAnak", e.target.value)} placeholder="Nama lengkap anak" />
          </div>
          <div className="space-y-1.5">
            <Label>NIK</Label>
            <Input value={form.nik} onChange={(e) => set("nik", e.target.value)} placeholder="Maks 16 digit angka" maxLength={16} />
          </div>
          <div className="space-y-1.5">
            <Label>Jenis Kelamin <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              {(["LAKI_LAKI", "PEREMPUAN"] as const).map((jk) => (
                <button key={jk} type="button" onClick={() => set("jenisKelamin", jk)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${form.jenisKelamin === jk ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted/40"}`}>
                  {jk === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tempat Lahir <span className="text-destructive">*</span></Label>
              <Input value={form.tempatLahir} onChange={(e) => set("tempatLahir", e.target.value)} placeholder="Kota/kabupaten" />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Lahir <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.tanggalLahir} onChange={(e) => set("tanggalLahir", e.target.value)} max={today} />
              {usia !== null && (
                <p className="text-xs text-muted-foreground">Usia: <span className="font-semibold text-foreground">{usia} tahun</span></p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Alamat <span className="text-destructive">*</span></Label>
            <Textarea value={form.alamat} onChange={(e) => set("alamat", e.target.value)} placeholder="Alamat lengkap (kampung/jalan)" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>RT/RW</Label>
            <Input value={form.rtRw} onChange={(e) => set("rtRw", e.target.value)} placeholder="Contoh: 001/002" />
          </div>
        </div>
      ),
    },
    {
      icon: MapPin,
      title: "Data Wilayah",
      done: true,
      content: (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40">
            <span className="text-muted-foreground w-32">Desa/Kelurahan</span>
            <span className="font-semibold">{wilayah.desaName}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40">
            <span className="text-muted-foreground w-32">Kecamatan</span>
            <span className="font-semibold">{wilayah.kecamatanName}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40">
            <span className="text-muted-foreground w-32">Kabupaten/Kota</span>
            <span className="font-semibold">Lebak</span>
          </div>
          <p className="text-xs text-muted-foreground">Wilayah diisi otomatis dari akun posyandu Anda.</p>
        </div>
      ),
    },
    {
      icon: Users,
      title: "Data Orang Tua / Wali",
      done: isSectionCDone(form),
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nama Orang Tua / Wali <span className="text-destructive">*</span></Label>
            <Input value={form.namaOrangTua} onChange={(e) => set("namaOrangTua", e.target.value)} placeholder="Nama ibu/ayah/wali" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Pekerjaan Orang Tua</Label>
              <Input value={form.pekerjaanOrangTua} onChange={(e) => set("pekerjaanOrangTua", e.target.value)} placeholder="Petani, Buruh, dll" />
            </div>
            <div className="space-y-1.5">
              <Label>No. HP Orang Tua</Label>
              <Input value={form.noHpOrangTua} onChange={(e) => set("noHpOrangTua", e.target.value)} placeholder="08xx" />
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: GraduationCap,
      title: "Riwayat Pendidikan",
      done: isSectionDDone(form),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Pendidikan Terakhir <span className="text-destructive">*</span></Label>
              <Select value={form.pendidikanTerakhir} onValueChange={(v) => set("pendidikanTerakhir", v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>{PENDIDIKAN_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={tidakPernahSekolah ? "opacity-40" : ""}>Kelas Terakhir</Label>
              <Input value={form.kelasTerakhir} onChange={(e) => set("kelasTerakhir", e.target.value)}
                placeholder="Kelas 3, Kelas 6..." disabled={tidakPernahSekolah} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status Sekolah <span className="text-destructive">*</span></Label>
            <Select value={form.statusSekolah} onValueChange={(v) => set("statusSekolah", v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>{STATUS_SEKOLAH_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Alasan Tidak Sekolah <span className="text-destructive">*</span></Label>
            <Select value={form.alasanTidakSekolah} onValueChange={(v) => set("alasanTidakSekolah", v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>{ALASAN_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.alasanTidakSekolah === "Lainnya" && (
            <div className="space-y-1.5">
              <Label>Alasan Lainnya <span className="text-destructive">*</span></Label>
              <Input value={form.alasanLainnya} onChange={(e) => set("alasanLainnya", e.target.value)} placeholder="Jelaskan alasan..." />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className={tidakPernahSekolah ? "opacity-40" : ""}>Tahun Putus Sekolah</Label>
            <Select value={form.tahunPutusSekolah} onValueChange={(v) => set("tahunPutusSekolah", v ?? "")} disabled={tidakPernahSekolah}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Pilih tahun..." /></SelectTrigger>
              <SelectContent>{tahunOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      icon: ClipboardList,
      title: "Kebutuhan & Tindak Lanjut",
      done: isSectionEDone(form),
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Keinginan Kembali Sekolah <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              {(["Ya", "Tidak", "Ragu-ragu"] as const).map((v) => (
                <button key={v} type="button" onClick={() => set("keinginanSekolah", v)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${form.keinginanSekolah === v ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted/40"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Program yang Dibutuhkan</Label>
            <div className="grid grid-cols-2 gap-2">
              {PROGRAM_OPTIONS.map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.programDibutuhkan.includes(p)}
                    onChange={() => toggleProgram(p)} className="rounded" />
                  <span className="text-sm">{p}</span>
                </label>
              ))}
            </div>
          </div>
          {form.programDibutuhkan.includes("Lainnya") && (
            <div className="space-y-1.5">
              <Label>Program Lainnya <span className="text-destructive">*</span></Label>
              <Input value={form.programLainnya} onChange={(e) => set("programLainnya", e.target.value)} placeholder="Sebutkan program..." />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Keterangan</Label>
            <Textarea value={form.keterangan} onChange={(e) => set("keterangan", e.target.value)} placeholder="Catatan tambahan (opsional)" rows={2} />
          </div>
        </div>
      ),
    },
  ]

  const sectionCard = (idx: number) => {
    const section = sections[idx]
    const Icon = section.icon
    const isOpen = open.includes(idx)
    return (
      <Card key={idx} className={`transition-all duration-200 ${isOpen ? "shadow-sm" : ""}`}>
        <button type="button" onClick={() => toggleSection(idx)}
          className="w-full flex items-center justify-between px-5 py-4 text-left">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-primary" />
            <span className="font-semibold text-sm">{section.title}</span>
            {section.done && <CheckCircle2 className="size-4 text-emerald-500 ml-1" />}
          </div>
          {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
        {isOpen && (
          <CardContent className="px-5 pb-5 pt-0 border-t border-border/50">
            {section.content}
          </CardContent>
        )}
      </Card>
    )
  }

  const LEFT = [0, 2, 4]
  const RIGHT = [1, 3]

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-3">{LEFT.map((idx) => sectionCard(idx))}</div>
        <div className="space-y-3">{RIGHT.map((idx) => sectionCard(idx))}</div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
        <Button type="button" onClick={() => { if (validate()) setShowConfirm(true) }} className="gap-2 font-bold">
          {mode === "edit" ? "Perbarui Data ATS" : "Simpan Data ATS"}
        </Button>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi {mode === "edit" ? "Perubahan" : "Penyimpanan"} Data</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah data yang diisi sudah benar? Data akan {mode === "edit" ? "diperbarui" : "disimpan"}.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cek Lagi</Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-2 font-bold">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Ya, {mode === "edit" ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
