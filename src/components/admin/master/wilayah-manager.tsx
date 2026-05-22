"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, X, Check, MapPin, Building, HelpCircle, Heart, Pencil, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormLabel, SubText } from "@/components/ui/typography"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { FormSection } from "@/components/shared/form-section"
import { MasterCsvImport } from "./master-csv-import"

interface Kecamatan {
  id: string
  name: string
  code: string
  _count: { desas: number }
}

interface Desa {
  id: string
  kecamatanId: string
  name: string
  code: string
  kecamatan: { name: string }
}

interface Posyandu {
  id: string
  desaId: string
  name: string
  code: string
  isActive: boolean
  desa: { name: string; kecamatan: { name: string } }
}

export function WilayahManager({
  initialKecamatans,
  initialDesas,
  initialPosyandus,
}: {
  initialKecamatans: Kecamatan[]
  initialDesas: Desa[]
  initialPosyandus: Posyandu[]
}) {
  const [kecamatans, setKecamatans] = useState<Kecamatan[]>(initialKecamatans)
  const [desas, setDesas] = useState<Desa[]>(initialDesas)
  const [posyandus, setPosyandus] = useState<Posyandu[]>(initialPosyandus)
  const [activeTab, setActiveTab] = useState<"kecamatan" | "desa" | "posyandu">("kecamatan")
  const [filterKec, setFilterKec] = useState("")
  const [filterDesaPos, setFilterDesaPos] = useState("")
  const [showKecForm, setShowKecForm] = useState(false)
  const [showDesaForm, setShowDesaForm] = useState(false)
  const [showPosyandu, setShowPosyandu] = useState(false)
  const [kecForm, setKecForm] = useState({ name: "", code: "" })
  const [desaForm, setDesaForm] = useState({ kecamatanId: "", name: "", code: "" })
  const [posyanduForm, setPosyanduForm] = useState({ desaId: "", name: "", code: "" })
  const [loading, setLoading] = useState(false)

  // Edit/delete state
  const [editingKec, setEditingKec] = useState<Kecamatan | null>(null)
  const [editingDesa, setEditingDesa] = useState<Desa | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showImport, setShowImport] = useState<"kecamatan" | "desa" | "posyandu" | null>(null)

  async function refreshData(type: "kecamatan" | "desa" | "posyandu") {
    try {
      if (type === "kecamatan") {
        const res = await fetch("/api/admin/master/wilayah/kecamatan")
        const data = await res.json()
        if (res.ok) setKecamatans(data.data)
        else toast.error(data.error ?? "Gagal memuat data kecamatan")
      } else if (type === "desa") {
        const res = await fetch("/api/admin/master/wilayah/desa")
        const data = await res.json()
        if (res.ok) setDesas(data.data)
        else toast.error(data.error ?? "Gagal memuat data desa")
      } else {
        const res = await fetch("/api/admin/master/posyandu")
        const data = await res.json()
        if (res.ok) setPosyandus(data.data)
        else toast.error(data.error ?? "Gagal memuat data posyandu")
      }
    } catch {
      toast.error("Gagal memuat data, periksa koneksi Anda")
    }
  }

  const filteredDesas = filterKec ? desas.filter((d) => d.kecamatanId === filterKec) : desas
  const filteredPosyandus = filterDesaPos ? posyandus.filter((p) => p.desaId === filterDesaPos) : posyandus

  async function handleAddKecamatan(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/master/wilayah/kecamatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kecForm),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
      setKecamatans((prev) => [...prev, { ...data.data, _count: { desas: 0 } }])
      setKecForm({ name: "", code: "" })
      setShowKecForm(false)
      toast.success("Kecamatan berhasil ditambahkan")
    } finally {
      setLoading(false)
    }
  }

  async function handleEditKecamatan(e: React.FormEvent) {
    e.preventDefault()
    if (!editingKec) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/master/wilayah/kecamatan/${editingKec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: kecForm.name }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
      const newName = data.data.name
      setKecamatans((prev) => prev.map((k) => k.id === editingKec.id ? { ...k, name: newName } : k))
      setDesas((prev) => prev.map((d) =>
        d.kecamatanId === editingKec.id ? { ...d, kecamatan: { name: newName } } : d
      ))
      setPosyandus((prev) => prev.map((p) => {
        const parentDesa = desas.find((d) => d.id === p.desaId)
        if (parentDesa?.kecamatanId !== editingKec.id) return p
        return { ...p, desa: { ...p.desa, kecamatan: { name: newName } } }
      }))
      setEditingKec(null)
      toast.success("Kecamatan diperbarui")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteKecamatan(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/master/wilayah/kecamatan/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
      setKecamatans((prev) => prev.filter((k) => k.id !== id))
      setDeletingId(null)
      toast.success("Kecamatan dihapus")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddDesa(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/master/wilayah/desa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(desaForm),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
      const kecName = kecamatans.find((k) => k.id === desaForm.kecamatanId)?.name ?? ""
      setDesas((prev) => [...prev, { ...data.data, kecamatan: { name: kecName } }])
      setKecamatans((prev) => prev.map((k) =>
        k.id === desaForm.kecamatanId ? { ...k, _count: { desas: k._count.desas + 1 } } : k
      ))
      setDesaForm({ kecamatanId: "", name: "", code: "" })
      setShowDesaForm(false)
      toast.success("Desa berhasil ditambahkan")
    } finally {
      setLoading(false)
    }
  }

  async function handleEditDesa(e: React.FormEvent) {
    e.preventDefault()
    if (!editingDesa) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/master/wilayah/desa/${editingDesa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: desaForm.name }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
      setDesas((prev) => prev.map((d) => d.id === editingDesa.id ? { ...d, name: data.data.name } : d))
      setEditingDesa(null)
      toast.success("Desa diperbarui")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteDesa(id: string) {
    const targetDesa = desas.find((d) => d.id === id)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/master/wilayah/desa/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
      setDesas((prev) => prev.filter((d) => d.id !== id))
      if (targetDesa) {
        setKecamatans((prev) => prev.map((k) =>
          k.id === targetDesa.kecamatanId
            ? { ...k, _count: { desas: Math.max(0, k._count.desas - 1) } }
            : k
        ))
      }
      setDeletingId(null)
      toast.success("Desa dihapus")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddPosyandu(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/master/posyandu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(posyanduForm),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
      setPosyandus((prev) => [...prev, data.data])
      setPosyanduForm({ desaId: "", name: "", code: "" })
      setShowPosyandu(false)
      toast.success("Posyandu berhasil ditambahkan")
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePosyandu(p: Posyandu) {
    const res = await fetch(`/api/admin/master/posyandu/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
    setPosyandus((prev) => prev.map((x) => x.id === p.id ? { ...data.data } : x))
    toast.success(`Posyandu ${p.name} ${!p.isActive ? "diaktifkan" : "dinonaktifkan"}`)
  }

  async function handleDeletePosyandu(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/master/posyandu/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
      setPosyandus((prev) => prev.filter((p) => p.id !== id))
      setDeletingId(null)
      toast.success("Posyandu dihapus")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Import Modal */}
      {showImport === "kecamatan" && (
        <MasterCsvImport
          title="Import Kecamatan dari CSV"
          description="Upload file CSV sesuai template yang tersedia"
          apiEndpoint="/api/admin/master/wilayah/kecamatan/import"
          templateHeaders={["nama", "kode"]}
          templateExample={["Kecamatan Parung", "KEC-PAR"]}
          templateFilename="template_kecamatan"
          onClose={() => setShowImport(null)}
          onSuccess={() => refreshData("kecamatan")}
        />
      )}
      {showImport === "desa" && (
        <MasterCsvImport
          title="Import Desa dari CSV"
          description="Upload file CSV sesuai template yang tersedia"
          apiEndpoint="/api/admin/master/wilayah/desa/import"
          templateHeaders={["nama", "kode", "kecamatan_kode"]}
          templateExample={["Desa Waru", "DES-WAR", "KEC-PAR"]}
          templateFilename="template_desa"
          onClose={() => setShowImport(null)}
          onSuccess={() => refreshData("desa")}
        />
      )}
      {showImport === "posyandu" && (
        <MasterCsvImport
          title="Import Posyandu dari CSV"
          description="Upload file CSV sesuai template yang tersedia"
          apiEndpoint="/api/admin/master/posyandu/import"
          templateHeaders={["nama", "kode", "desa_kode"]}
          templateExample={["Posyandu Mawar", "POS-MAW", "DES-WAR"]}
          templateFilename="template_posyandu"
          onClose={() => setShowImport(null)}
          onSuccess={() => refreshData("posyandu")}
        />
      )}

      {/* Premium Tabs */}
      <div className="flex bg-muted/65 border border-border p-1 rounded-lg w-fit select-none shadow-xs">
        <Button
          variant={activeTab === "kecamatan" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("kecamatan")}
          className="font-bold text-xs whitespace-nowrap px-4"
        >
          Kecamatan ({kecamatans.length})
        </Button>
        <Button
          variant={activeTab === "desa" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("desa")}
          className="font-bold text-xs whitespace-nowrap px-4"
        >
          Desa ({desas.length})
        </Button>
        <Button
          variant={activeTab === "posyandu" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("posyandu")}
          className="font-bold text-xs whitespace-nowrap px-4"
        >
          Posyandu ({posyandus.length})
        </Button>
      </div>

      {/* Kecamatan Tab */}
      {activeTab === "kecamatan" && (
        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => setShowImport("kecamatan")}
              variant="outline"
              size="sm"
              className="font-bold text-xs gap-1.5"
            >
              <Upload className="w-4 h-4" /> Import CSV
            </Button>
            <Button
              onClick={() => { setEditingKec(null); setShowKecForm(true) }}
              size="sm"
              className="font-bold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Kecamatan
            </Button>
          </div>

          {showKecForm && (
            <form onSubmit={handleAddKecamatan} className="transition-all duration-300">
              <FormSection
                title="Tambah Kecamatan Baru"
                description="Masukkan data kecamatan pembagian wilayah administrasi kabupaten."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <FormLabel>Nama Kecamatan <span className="text-destructive">*</span></FormLabel>
                    <Input
                      type="text"
                      value={kecForm.name}
                      onChange={(e) => setKecForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Contoh: Kecamatan Parung"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FormLabel>Kode Kecamatan <span className="text-destructive">*</span></FormLabel>
                    <Input
                      type="text"
                      value={kecForm.code}
                      onChange={(e) => setKecForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="Contoh: KEC-PAR"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" disabled={loading} className="font-bold text-xs gap-1">
                    <Check className="w-3.5 h-3.5" /> Simpan
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowKecForm(false)} className="font-bold text-xs gap-1">
                    <X className="w-3.5 h-3.5" /> Batal
                  </Button>
                </div>
              </FormSection>
            </form>
          )}

          <DataTable
            columns={["Nama Kecamatan", "Kode Wilayah", "Jumlah Desa", ""]}
            dataLength={kecamatans.length}
          >
            {kecamatans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="px-4 py-8 text-center text-muted-foreground font-semibold text-xs">
                  <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-55" />
                  Belum ada data kecamatan terdaftar.
                </TableCell>
              </TableRow>
            ) : (
              kecamatans.map((k) => (
                editingKec?.id === k.id ? (
                  <TableRow key={k.id}>
                    <TableCell colSpan={4} className="px-4 py-3">
                      <form onSubmit={handleEditKecamatan} className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={kecForm.name}
                          onChange={(e) => setKecForm((f) => ({ ...f, name: e.target.value }))}
                          className="h-8 text-xs flex-1 max-w-xs"
                          required
                          autoFocus
                        />
                        <Button type="submit" size="sm" disabled={loading} className="font-bold text-xs gap-1 h-8">
                          <Check className="w-3 h-3" /> Simpan
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setEditingKec(null)} className="font-bold text-xs gap-1 h-8">
                          <X className="w-3 h-3" /> Batal
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ) : deletingId === k.id ? (
                  <TableRow key={k.id} className="bg-destructive/5">
                    <TableCell colSpan={4} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-destructive font-semibold flex-1">Yakin hapus kecamatan <strong>{k.name}</strong>?</p>
                        <Button size="sm" disabled={loading} onClick={() => handleDeleteKecamatan(k.id)} className="font-bold text-xs gap-1 h-8 bg-destructive hover:bg-destructive/90">
                          <Trash2 className="w-3 h-3" /> Hapus
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setDeletingId(null)} className="font-bold text-xs h-8">
                          Batal
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={k.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-xs text-foreground">{k.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 font-mono text-xs text-foreground font-semibold">
                      {k.code}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-xs text-muted-foreground font-semibold">
                      {k._count.desas} Desa terdaftar
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => { setEditingKec(k); setKecForm({ name: k.name, code: k.code }); setShowKecForm(false) }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingId(k.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ))
            )}
          </DataTable>
        </div>
      )}

      {/* Posyandu Tab */}
      {activeTab === "posyandu" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <select
              value={filterDesaPos}
              onChange={(e) => setFilterDesaPos(e.target.value)}
              className="border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-semibold focus:outline-none focus:border-primary text-foreground w-full sm:w-64"
            >
              <option value="">Semua Desa</option>
              {desas.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setShowImport("posyandu")}
                variant="outline"
                size="sm"
                className="font-bold text-xs gap-1.5 flex-1 sm:flex-none"
              >
                <Upload className="w-4 h-4" /> Import CSV
              </Button>
              <Button
                onClick={() => setShowPosyandu(true)}
                size="sm"
                className="font-bold text-xs gap-1.5 flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4" /> Tambah Posyandu
              </Button>
            </div>
          </div>

          {showPosyandu && (
            <form onSubmit={handleAddPosyandu} className="transition-all duration-300">
              <FormSection
                title="Tambah Posyandu Baru"
                description="Daftarkan unit posyandu ke desa terkait."
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <FormLabel>Desa Induk <span className="text-destructive">*</span></FormLabel>
                    <select
                      value={posyanduForm.desaId}
                      onChange={(e) => setPosyanduForm((f) => ({ ...f, desaId: e.target.value }))}
                      className="w-full border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-semibold focus:outline-none focus:border-primary text-foreground"
                      required
                    >
                      <option value="">Pilih Desa</option>
                      {desas.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <FormLabel>Nama Posyandu <span className="text-destructive">*</span></FormLabel>
                    <Input
                      type="text"
                      value={posyanduForm.name}
                      onChange={(e) => setPosyanduForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Contoh: Posyandu Mawar"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FormLabel>Kode Posyandu <span className="text-destructive">*</span></FormLabel>
                    <Input
                      type="text"
                      value={posyanduForm.code}
                      onChange={(e) => setPosyanduForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="Contoh: POS-MAW"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" disabled={loading} className="font-bold text-xs gap-1">
                    <Check className="w-3.5 h-3.5" /> Simpan
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowPosyandu(false)} className="font-bold text-xs gap-1">
                    <X className="w-3.5 h-3.5" /> Batal
                  </Button>
                </div>
              </FormSection>
            </form>
          )}

          <DataTable
            columns={["Nama Posyandu", "Desa", "Kecamatan", "Status", ""]}
            dataLength={filteredPosyandus.length}
          >
            {filteredPosyandus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-semibold text-xs">
                  <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-55" />
                  Belum ada posyandu terdaftar.
                </TableCell>
              </TableRow>
            ) : (
              filteredPosyandus.map((p) => (
                deletingId === p.id ? (
                  <TableRow key={p.id} className="bg-destructive/5">
                    <TableCell colSpan={5} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-destructive font-semibold flex-1">Yakin hapus posyandu <strong>{p.name}</strong>?</p>
                        <Button size="sm" disabled={loading} onClick={() => handleDeletePosyandu(p.id)} className="font-bold text-xs gap-1 h-8 bg-destructive hover:bg-destructive/90">
                          <Trash2 className="w-3 h-3" /> Hapus
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setDeletingId(null)} className="font-bold text-xs h-8">
                          Batal
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/10 text-pink-600 border border-pink-500/20 rounded-lg shrink-0">
                          <Heart className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-foreground">{p.name}</p>
                          <p className="font-mono text-xs text-muted-foreground mt-0.5">{p.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-xs text-muted-foreground font-semibold">
                      {p.desa.name}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-xs text-muted-foreground font-semibold">
                      {p.desa.kecamatan.name}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <button
                        onClick={() => handleTogglePosyandu(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all active:scale-95 cursor-pointer ${
                          p.isActive
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                            : "bg-muted/60 text-muted-foreground border-border/80"
                        }`}
                      >
                        {p.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingId(p.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              ))
            )}
          </DataTable>
        </div>
      )}

      {/* Desa Tab */}
      {activeTab === "desa" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <select
              value={filterKec}
              onChange={(e) => setFilterKec(e.target.value)}
              className="border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-semibold focus:outline-none focus:border-primary text-foreground w-full sm:w-64"
            >
              <option value="">Semua Kecamatan</option>
              {kecamatans.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setShowImport("desa")}
                variant="outline"
                size="sm"
                className="font-bold text-xs gap-1.5 flex-1 sm:flex-none"
              >
                <Upload className="w-4 h-4" /> Import CSV
              </Button>
              <Button
                onClick={() => { setEditingDesa(null); setShowDesaForm(true) }}
                size="sm"
                className="font-bold text-xs gap-1.5 flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4" /> Tambah Desa Baru
              </Button>
            </div>
          </div>

          {showDesaForm && (
            <form onSubmit={handleAddDesa} className="transition-all duration-300">
              <FormSection
                title="Tambah Desa Baru"
                description="Masukkan data desa dan posyandu pendukung yang terikat ke kecamatan."
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <FormLabel>Kecamatan Induk <span className="text-destructive">*</span></FormLabel>
                    <select
                      value={desaForm.kecamatanId}
                      onChange={(e) => setDesaForm((f) => ({ ...f, kecamatanId: e.target.value }))}
                      className="w-full border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-semibold focus:outline-none focus:border-primary text-foreground"
                      required
                    >
                      <option value="">Pilih Kecamatan</option>
                      {kecamatans.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <FormLabel>Nama Desa <span className="text-destructive">*</span></FormLabel>
                    <Input
                      type="text"
                      value={desaForm.name}
                      onChange={(e) => setDesaForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Contoh: Desa Waru"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FormLabel>Kode Desa <span className="text-destructive">*</span></FormLabel>
                    <Input
                      type="text"
                      value={desaForm.code}
                      onChange={(e) => setDesaForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="Contoh: DES-WAR"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" disabled={loading} className="font-bold text-xs gap-1">
                    <Check className="w-3.5 h-3.5" /> Simpan Desa
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowDesaForm(false)} className="font-bold text-xs gap-1">
                    <X className="w-3.5 h-3.5" /> Batal
                  </Button>
                </div>
              </FormSection>
            </form>
          )}

          <DataTable
            columns={["Nama Desa", "Kecamatan", "Kode Wilayah", ""]}
            dataLength={filteredDesas.length}
          >
            {filteredDesas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="px-4 py-8 text-center text-muted-foreground font-semibold text-xs">
                  <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-55" />
                  Belum ada data desa terdaftar.
                </TableCell>
              </TableRow>
            ) : (
              filteredDesas.map((d) => (
                editingDesa?.id === d.id ? (
                  <TableRow key={d.id}>
                    <TableCell colSpan={4} className="px-4 py-3">
                      <form onSubmit={handleEditDesa} className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={desaForm.name}
                          onChange={(e) => setDesaForm((f) => ({ ...f, name: e.target.value }))}
                          className="h-8 text-xs flex-1 max-w-xs"
                          required
                          autoFocus
                        />
                        <Button type="submit" size="sm" disabled={loading} className="font-bold text-xs gap-1 h-8">
                          <Check className="w-3 h-3" /> Simpan
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setEditingDesa(null)} className="font-bold text-xs gap-1 h-8">
                          <X className="w-3 h-3" /> Batal
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ) : deletingId === d.id ? (
                  <TableRow key={d.id} className="bg-destructive/5">
                    <TableCell colSpan={4} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-destructive font-semibold flex-1">Yakin hapus desa <strong>{d.name}</strong>?</p>
                        <Button size="sm" disabled={loading} onClick={() => handleDeleteDesa(d.id)} className="font-bold text-xs gap-1 h-8 bg-destructive hover:bg-destructive/90">
                          <Trash2 className="w-3 h-3" /> Hapus
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setDeletingId(null)} className="font-bold text-xs h-8">
                          Batal
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={d.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-xs text-foreground">{d.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-xs text-muted-foreground font-semibold">
                      {d.kecamatan.name}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 font-mono text-xs text-foreground font-semibold">
                      {d.code}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => { setEditingDesa(d); setDesaForm({ kecamatanId: d.kecamatanId, name: d.name, code: d.code }); setShowDesaForm(false) }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingId(d.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ))
            )}
          </DataTable>
        </div>
      )}
    </div>
  )
}
