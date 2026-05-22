"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, X, Check, List, HelpCircle, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { FormSection } from "@/components/shared/form-section"
import { MasterCsvImport } from "./master-csv-import"

interface Layanan {
  id: string
  opdId: string
  name: string
  description: string | null
  isActive: boolean
  sortOrder: number
  opd: { name: string }
}

interface Opd {
  id: string
  name: string
}

export function LayananManager({ initialLayanans, opds }: { initialLayanans: Layanan[]; opds: Opd[] }) {
  const [layanans, setLayanans] = useState<Layanan[]>(initialLayanans)
  const [filterOpd, setFilterOpd] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Layanan | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ opdId: "", name: "", description: "", sortOrder: 0 })
  const [showImport, setShowImport] = useState(false)

  const filtered = filterOpd ? layanans.filter((l) => l.opdId === filterOpd) : layanans

  function openCreate() {
    setEditing(null)
    setForm({ opdId: filterOpd || "", name: "", description: "", sortOrder: 0 })
    setShowForm(true)
  }

  function openEdit(l: Layanan) {
    setEditing(l)
    setForm({ opdId: l.opdId, name: l.name, description: l.description ?? "", sortOrder: l.sortOrder })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        const res = await fetch(`/api/admin/master/layanan/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, description: form.description || null, sortOrder: form.sortOrder }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
        setLayanans((prev) => prev.map((l) => l.id === editing.id ? { ...data.data, opd: editing.opd } : l))
        toast.success("Layanan diperbarui")
      } else {
        const res = await fetch("/api/admin/master/layanan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
        const opdName = opds.find((o) => o.id === form.opdId)?.name ?? ""
        setLayanans((prev) => [...prev, { ...data.data, opd: { name: opdName } }])
        toast.success("Layanan ditambahkan")
      }
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(l: Layanan) {
    const res = await fetch(`/api/admin/master/layanan/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !l.isActive }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
    setLayanans((prev) => prev.map((x) => x.id === l.id ? { ...data.data, opd: l.opd } : x))
    toast.success(`Layanan ${l.name} ${!l.isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
  }

  async function handleDelete(l: Layanan) {
    if (!confirm(`Hapus layanan "${l.name}"?`)) return
    const res = await fetch(`/api/admin/master/layanan/${l.id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
    setLayanans((prev) => prev.filter((x) => x.id !== l.id))
    toast.success("Layanan dihapus")
  }

  return (
    <div className="space-y-6">
      {showImport && (
        <MasterCsvImport
          title="Import Layanan dari CSV"
          description="Upload file CSV sesuai template yang tersedia"
          apiEndpoint="/api/admin/master/layanan/import"
          templateHeaders={["nama", "opd_kode", "urutan"]}
          templateExample={["Pemberian Makanan Tambahan", "DINKES", "1"]}
          templateFilename="template_layanan"
          onClose={() => setShowImport(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <select
          value={filterOpd}
          onChange={(e) => setFilterOpd(e.target.value)}
          className="border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-semibold focus:outline-none focus:border-primary text-foreground w-full sm:w-64"
        >
          <option value="">Semua Dinas/OPD</option>
          {opds.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowImport(true)}
            variant="outline"
            size="sm"
            className="font-bold text-xs gap-1.5 flex-1 sm:flex-none"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button
            onClick={openCreate}
            size="sm"
            className="font-bold text-xs gap-1.5 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            Tambah Layanan Baru
          </Button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="transition-all duration-300">
          <FormSection
            title={editing ? "Ubah Data Layanan" : "Registrasi Jenis Layanan Baru"}
            description="Konfigurasi kategori pelayanan terpadu dan sambungkan ke instansi pelaksana."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground font-semibold">Penanggung Jawab OPD <span className="text-destructive">*</span></Label>
                <select
                  value={form.opdId}
                  onChange={(e) => setForm((f) => ({ ...f, opdId: e.target.value }))}
                  disabled={!!editing}
                  className="w-full border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-semibold focus:outline-none focus:border-primary text-foreground disabled:bg-muted/50"
                  required
                >
                  <option value="">Pilih OPD</option>
                  {opds.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Nama Jenis Layanan <span className="text-destructive">*</span></Label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Pemberian Makanan Tambahan (PMT)"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Urutan Tampil</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Keterangan / Deskripsi (Opsional)</Label>
                <Input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Informasi pelengkap kriteria layanan..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="font-bold text-xs gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                {loading ? "Menyimpan..." : "Simpan Data"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                className="font-bold text-xs gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Batal
              </Button>
            </div>
          </FormSection>
        </form>
      )}

      <DataTable
        columns={["Nama Layanan", "OPD Instansi", "Status", "Aksi"]}
        dataLength={filtered.length}
      >
        {filtered.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="px-4 py-8 text-center text-muted-foreground font-semibold text-xs">
              <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-55" />
              Belum ada data jenis layanan terdaftar.
            </TableCell>
          </TableRow>
        ) : (
          filtered.map((l) => (
            <TableRow key={l.id} className="transition-colors hover:bg-muted/30">
              <TableCell className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg shrink-0">
                    <List className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-foreground">{l.name}</p>
                    {l.description && <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed font-semibold">{l.description}</p>}
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-xs text-muted-foreground font-semibold">
                {l.opd.name}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <button
                  onClick={() => handleToggle(l)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all active:scale-95 cursor-pointer ${
                    l.isActive
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      : "bg-muted/60 text-muted-foreground border-border/80"
                  }`}
                >
                  {l.isActive ? "Aktif" : "Nonaktif"}
                </button>
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(l)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(l)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </DataTable>
    </div>
  )
}
