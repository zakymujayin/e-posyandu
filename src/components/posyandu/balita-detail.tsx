"use client"

import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Scale, Syringe, CheckCircle2, Plus, Pencil, Trash2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

const BULAN_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

interface Penimbangan {
  id: string
  bulan: number
  tahun: number
  beratBadan: number | null
  tinggiBadan: number | null
  lingkarKepala: number | null
  statusGizi: string | null
  keluhanKondisi: string | null
  tindakan: string | null
  namaKader: string | null
}

interface Imunisasi {
  id: string
  jenisImunisasi: string
  tanggalPemberian: string
  usiaAnak: string | null
  namaPetugas: string | null
  keterangan: string | null
}

interface Balita {
  id: string
  namaBalita: string
  jenisKelamin: "LAKI_LAKI" | "PEREMPUAN"
  tanggalLahir: string
  namaOrangTua: string
  nikOrangTua: string | null
  noHpOrangTua: string | null
  alamat: string | null
  catatanKesehatan: string | null
  penimbangans: Penimbangan[]
  imunisasis: Imunisasi[]
}

function PenimbanganModal({
  balitaId,
  tahun,
  existing,
  onClose,
  onSaved,
}: {
  balitaId: string
  tahun: number
  existing?: Penimbangan
  onClose: () => void
  onSaved: (data: Penimbangan) => void
}) {
  const now = new Date()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    bulan: existing?.bulan ?? (now.getMonth() + 1),
    tahun: existing?.tahun ?? tahun,
    beratBadan: existing?.beratBadan?.toString() ?? "",
    tinggiBadan: existing?.tinggiBadan?.toString() ?? "",
    lingkarKepala: existing?.lingkarKepala?.toString() ?? "",
    statusGizi: existing?.statusGizi ?? "",
    keluhanKondisi: existing?.keluhanKondisi ?? "",
    tindakan: existing?.tindakan ?? "",
    namaKader: existing?.namaKader ?? "",
  })

  function set(key: keyof typeof form, value: string | number) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body = {
        bulan: Number(form.bulan),
        tahun: Number(form.tahun),
        beratBadan: form.beratBadan ? parseFloat(form.beratBadan) : null,
        tinggiBadan: form.tinggiBadan ? parseFloat(form.tinggiBadan) : null,
        lingkarKepala: form.lingkarKepala ? parseFloat(form.lingkarKepala) : null,
        statusGizi: form.statusGizi || null,
        keluhanKondisi: form.keluhanKondisi || null,
        tindakan: form.tindakan || null,
        namaKader: form.namaKader || null,
      }
      const url = existing
        ? `/api/balita/${balitaId}/penimbangan/${existing.id}`
        : `/api/balita/${balitaId}/penimbangan`
      const method = existing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
      toast.success("Data penimbangan disimpan")
      onSaved(data.data)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm">{existing ? "Edit" : "Tambah"} Penimbangan</h3>
          <Button variant="ghost" size="icon-xs" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!existing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Bulan</Label>
                <select
                  value={form.bulan}
                  onChange={(e) => set("bulan", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {BULAN_NAMES.map((b, i) => {
                    const disabled =
                      Number(form.tahun) > now.getFullYear() ||
                      (Number(form.tahun) === now.getFullYear() && i + 1 > now.getMonth() + 1)
                    return (
                      <option key={i} value={i + 1} disabled={disabled}>
                        {b}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tahun</Label>
                <Input
                  type="number"
                  value={form.tahun}
                  onChange={(e) => set("tahun", e.target.value)}
                  min={2020}
                  max={now.getFullYear()}
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">BB (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.beratBadan}
                onChange={(e) => set("beratBadan", e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">TB (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.tinggiBadan}
                onChange={(e) => set("tinggiBadan", e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">LK (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.lingkarKepala}
                onChange={(e) => set("lingkarKepala", e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status Gizi</Label>
            <select
              value={form.statusGizi}
              onChange={(e) => set("statusGizi", e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">-- Pilih --</option>
              {["Baik", "Kurang", "Buruk", "Lebih", "Obesitas"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Keluhan / Kondisi</Label>
            <Textarea value={form.keluhanKondisi} onChange={(e) => set("keluhanKondisi", e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tindakan</Label>
            <Input value={form.tindakan} onChange={(e) => set("tindakan", e.target.value)} placeholder="Tindakan yang dilakukan" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nama Kader Pencatat</Label>
            <Input value={form.namaKader} onChange={(e) => set("namaKader", e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Batal</Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5 font-bold">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ImunisasiModal({
  balitaId,
  existing,
  onClose,
  onSaved,
}: {
  balitaId: string
  existing?: Imunisasi
  onClose: () => void
  onSaved: (data: Imunisasi) => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    jenisImunisasi: existing?.jenisImunisasi ?? "",
    tanggalPemberian: existing?.tanggalPemberian ? existing.tanggalPemberian.split("T")[0] : "",
    usiaAnak: existing?.usiaAnak ?? "",
    namaPetugas: existing?.namaPetugas ?? "",
    keterangan: existing?.keterangan ?? "",
  })

  function set(key: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.jenisImunisasi || !form.tanggalPemberian) { toast.error("Jenis imunisasi dan tanggal wajib diisi"); return }
    setLoading(true)
    try {
      const body = {
        jenisImunisasi: form.jenisImunisasi,
        tanggalPemberian: form.tanggalPemberian,
        usiaAnak: form.usiaAnak || null,
        namaPetugas: form.namaPetugas || null,
        keterangan: form.keterangan || null,
      }
      const url = existing
        ? `/api/balita/${balitaId}/imunisasi/${existing.id}`
        : `/api/balita/${balitaId}/imunisasi`
      const method = existing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
      toast.success("Data imunisasi disimpan")
      onSaved(data.data)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm">{existing ? "Edit" : "Tambah"} Imunisasi</h3>
          <Button variant="ghost" size="icon-xs" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Jenis Imunisasi <span className="text-destructive">*</span></Label>
            <Input value={form.jenisImunisasi} onChange={(e) => set("jenisImunisasi", e.target.value)} placeholder="e.g. BCG, DPT, Polio, Campak" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal Pemberian <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.tanggalPemberian} onChange={(e) => set("tanggalPemberian", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Usia Anak</Label>
              <Input value={form.usiaAnak} onChange={(e) => set("usiaAnak", e.target.value)} placeholder="e.g. 2 bulan" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nama Petugas</Label>
            <Input value={form.namaPetugas} onChange={(e) => set("namaPetugas", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Keterangan</Label>
            <Textarea value={form.keterangan} onChange={(e) => set("keterangan", e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Batal</Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5 font-bold">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function BalitaDetail({ balita: initialBalita }: { balita: Balita }) {
  const [balita, setBalita] = useState(initialBalita)
  const [tab, setTab] = useState<"penimbangan" | "imunisasi">("penimbangan")
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [penimbanganModal, setPenimbanganModal] = useState<{ open: boolean; existing?: Penimbangan }>({ open: false })
  const [imunisasiModal, setImunisasiModal] = useState<{ open: boolean; existing?: Imunisasi }>({ open: false })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingCatatan, setEditingCatatan] = useState(false)
  const [catatan, setCatatan] = useState(balita.catatanKesehatan ?? "")
  const [savingCatatan, setSavingCatatan] = useState(false)

  const now = new Date()
  const penimbanganTahunIni = balita.penimbangans.filter((p) => p.tahun === tahun)

  function penimbanganForBulan(bulan: number) {
    return penimbanganTahunIni.find((p) => p.bulan === bulan)
  }

  function isFutureBulan(bulan: number) {
    return tahun > now.getFullYear() || (tahun === now.getFullYear() && bulan > now.getMonth() + 1)
  }

  function onPenimbanganSaved(data: Penimbangan) {
    setBalita((prev) => {
      const filtered = prev.penimbangans.filter((p) => p.id !== data.id)
      return { ...prev, penimbangans: [...filtered, data].sort((a, b) => a.tahun - b.tahun || a.bulan - b.bulan) }
    })
  }

  function onImunisasiSaved(data: Imunisasi) {
    setBalita((prev) => {
      const filtered = prev.imunisasis.filter((i) => i.id !== data.id)
      return { ...prev, imunisasis: [...filtered, data].sort((a, b) => a.tanggalPemberian.localeCompare(b.tanggalPemberian)) }
    })
  }

  async function deletePenimbangan(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/balita/${balita.id}/penimbangan/${id}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Gagal menghapus"); return }
      setBalita((prev) => ({ ...prev, penimbangans: prev.penimbangans.filter((p) => p.id !== id) }))
      toast.success("Data penimbangan dihapus")
    } finally {
      setDeletingId(null)
    }
  }

  async function deleteImunisasi(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/balita/${balita.id}/imunisasi/${id}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Gagal menghapus"); return }
      setBalita((prev) => ({ ...prev, imunisasis: prev.imunisasis.filter((i) => i.id !== id) }))
      toast.success("Data imunisasi dihapus")
    } finally {
      setDeletingId(null)
    }
  }

  async function saveCatatan() {
    setSavingCatatan(true)
    try {
      const res = await fetch(`/api/balita/${balita.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatanKesehatan: catatan || null }),
      })
      if (!res.ok) { toast.error("Gagal menyimpan catatan"); return }
      setBalita((prev) => ({ ...prev, catatanKesehatan: catatan || null }))
      setEditingCatatan(false)
      toast.success("Catatan disimpan")
    } finally {
      setSavingCatatan(false)
    }
  }

  return (
    <>
      {/* Info Card */}
      <div className="rounded-xl border border-border bg-card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Nama Orang Tua / Wali</p>
          <p className="font-semibold mt-0.5">{balita.namaOrangTua}</p>
        </div>
        {balita.nikOrangTua && (
          <div>
            <p className="text-xs text-muted-foreground">NIK</p>
            <p className="font-semibold mt-0.5 font-mono">{balita.nikOrangTua}</p>
          </div>
        )}
        {balita.noHpOrangTua && (
          <div>
            <p className="text-xs text-muted-foreground">No. HP</p>
            <p className="font-semibold mt-0.5">{balita.noHpOrangTua}</p>
          </div>
        )}
        {balita.alamat && (
          <div>
            <p className="text-xs text-muted-foreground">Alamat</p>
            <p className="font-semibold mt-0.5">{balita.alamat}</p>
          </div>
        )}
      </div>

      {/* Catatan Kesehatan */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">Catatan Kesehatan</p>
          {!editingCatatan ? (
            <Button variant="ghost" size="sm" onClick={() => setEditingCatatan(true)} className="text-xs gap-1 h-7">
              <Pencil className="w-3 h-3" /> Edit
            </Button>
          ) : (
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => { setEditingCatatan(false); setCatatan(balita.catatanKesehatan ?? "") }} className="text-xs h-7">Batal</Button>
              <Button size="sm" onClick={saveCatatan} disabled={savingCatatan} className="text-xs h-7 gap-1 font-bold">
                {savingCatatan && <Loader2 className="w-3 h-3 animate-spin" />}
                Simpan
              </Button>
            </div>
          )}
        </div>
        {editingCatatan ? (
          <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} placeholder="Catatan riwayat kesehatan, kondisi khusus, alergi, dll." />
        ) : (
          <p className="text-sm text-muted-foreground">{balita.catatanKesehatan || "—"}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border">
          {([
            { key: "penimbangan", label: "Penimbangan Bulanan", icon: Scale },
            { key: "imunisasi", label: "Riwayat Imunisasi", icon: Syringe },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === key
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "penimbangan" && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setTahun((y) => y - 1)} className="px-2 py-1 rounded border border-border text-xs hover:bg-muted/40">‹</button>
                <span className="text-sm font-bold w-16 text-center">{tahun}</span>
                <button
                  onClick={() => setTahun((y) => y + 1)}
                  disabled={tahun >= now.getFullYear()}
                  className="px-2 py-1 rounded border border-border text-xs hover:bg-muted/40 disabled:opacity-30"
                >›</button>
              </div>
              <Button size="sm" onClick={() => setPenimbanganModal({ open: true })} className="gap-1.5 font-bold text-xs">
                <Plus className="w-3.5 h-3.5" /> Tambah
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {BULAN_NAMES.map((name, i) => {
                const bulan = i + 1
                const data = penimbanganForBulan(bulan)
                const isFuture = isFutureBulan(bulan)
                return (
                  <div
                    key={bulan}
                    className={`rounded-lg border p-3 text-xs space-y-1 ${
                      isFuture
                        ? "border-border/50 bg-muted/20 opacity-40"
                        : data
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{name}</span>
                      {data && !isFuture && (
                        <div className="flex gap-1">
                          <button onClick={() => setPenimbanganModal({ open: true, existing: data })} className="text-muted-foreground hover:text-foreground">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deletePenimbangan(data.id)}
                            disabled={deletingId === data.id}
                            className="text-destructive hover:text-destructive/80"
                          >
                            {deletingId === data.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                    {data ? (
                      <>
                        {data.beratBadan && <p className="text-emerald-700 font-bold">{data.beratBadan} kg</p>}
                        {data.tinggiBadan && <p className="text-muted-foreground">{data.tinggiBadan} cm</p>}
                        {data.statusGizi && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">{data.statusGizi}</Badge>
                        )}
                      </>
                    ) : isFuture ? (
                      <p className="text-muted-foreground">—</p>
                    ) : (
                      <p className="text-muted-foreground">Belum dicatat</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === "imunisasi" && (
          <div className="p-5 space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setImunisasiModal({ open: true })} className="gap-1.5 font-bold text-xs">
                <Plus className="w-3.5 h-3.5" /> Tambah Imunisasi
              </Button>
            </div>
            {balita.imunisasis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada data imunisasi.</p>
            ) : (
              <div className="space-y-2">
                {balita.imunisasis.map((im) => (
                  <div key={im.id} className="flex items-start gap-3 rounded-lg border border-border px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{im.jenisImunisasi}</p>
                        {im.usiaAnak && <Badge variant="outline" className="text-[10px]">{im.usiaAnak}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(im.tanggalPemberian), "d MMMM yyyy", { locale: localeId })}
                        {im.namaPetugas && ` · ${im.namaPetugas}`}
                      </p>
                      {im.keterangan && <p className="text-xs text-muted-foreground mt-0.5">{im.keterangan}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setImunisasiModal({ open: true, existing: im })} className="text-muted-foreground hover:text-foreground p-1">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteImunisasi(im.id)}
                        disabled={deletingId === im.id}
                        className="text-destructive hover:text-destructive/80 p-1"
                      >
                        {deletingId === im.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {penimbanganModal.open && (
        <PenimbanganModal
          balitaId={balita.id}
          tahun={tahun}
          existing={penimbanganModal.existing}
          onClose={() => setPenimbanganModal({ open: false })}
          onSaved={onPenimbanganSaved}
        />
      )}

      {imunisasiModal.open && (
        <ImunisasiModal
          balitaId={balita.id}
          existing={imunisasiModal.existing}
          onClose={() => setImunisasiModal({ open: false })}
          onSaved={onImunisasiSaved}
        />
      )}
    </>
  )
}
