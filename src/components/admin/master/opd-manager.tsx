"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, X, Check, Building2, HelpCircle, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormLabel, SubText } from "@/components/ui/typography"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { FormSection } from "@/components/shared/form-section"
import { MasterCsvImport } from "./master-csv-import"

interface Opd {
  id: string
  name: string
  code: string
  tiketPrefix: string
  description: string | null
  isActive: boolean
  sortOrder: number
}

export function OpdManager({ initialOpds }: { initialOpds: Opd[] }) {
  const [opds, setOpds] = useState<Opd[]>(initialOpds)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Opd | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", code: "", tiketPrefix: "", description: "", sortOrder: 0 })
  const [showImport, setShowImport] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm({ name: "", code: "", tiketPrefix: "", description: "", sortOrder: 0 })
    setShowForm(true)
  }

  function openEdit(opd: Opd) {
    setEditing(opd)
    setForm({ name: opd.name, code: opd.code, tiketPrefix: opd.tiketPrefix, description: opd.description ?? "", sortOrder: opd.sortOrder })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        const res = await fetch(`/api/admin/master/opd/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, description: form.description || null, sortOrder: form.sortOrder }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
        setOpds((prev) => prev.map((o) => (o.id === editing.id ? data.data : o)))
        toast.success("OPD berhasil diperbarui")
      } else {
        const res = await fetch("/api/admin/master/opd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
        setOpds((prev) => [...prev, data.data])
        toast.success("OPD berhasil ditambahkan")
      }
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(opd: Opd) {
    const res = await fetch(`/api/admin/master/opd/${opd.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !opd.isActive }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
    setOpds((prev) => prev.map((o) => (o.id === opd.id ? data.data : o)))
    toast.success(`OPD ${opd.name} ${!opd.isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
  }

  async function handleDelete(opd: Opd) {
    if (!confirm(`Hapus OPD "${opd.name}"?`)) return
    const res = await fetch(`/api/admin/master/opd/${opd.id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
    setOpds((prev) => prev.filter((o) => o.id !== opd.id))
    toast.success("OPD berhasil dihapus")
  }

  return (
    <div className="space-y-6">
      {showImport && (
        <MasterCsvImport
          title="Import OPD dari CSV"
          description="Upload file CSV sesuai template yang tersedia"
          apiEndpoint="/api/admin/master/opd/import"
          templateHeaders={["nama", "kode", "prefix_tiket", "urutan"]}
          templateExample={["Dinas Kesehatan", "DINKES", "DKS", "1"]}
          templateFilename="template_opd"
          onClose={() => setShowImport(false)}
        />
      )}

      <div className="flex gap-2 justify-end">
        <Button
          onClick={() => setShowImport(true)}
          variant="outline"
          size="sm"
          className="font-bold text-xs gap-1.5"
        >
          <Upload className="w-4 h-4" /> Import CSV
        </Button>
        <Button
          onClick={openCreate}
          size="sm"
          className="font-bold text-xs gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Tambah OPD Dinas
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="transition-all duration-300">
          <FormSection
            title={editing ? "Ubah Data OPD" : "Registrasi OPD Baru"}
            description="Lengkapi detail organisasi perangkat daerah yang akan dihubungkan ke sistem layanan."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FormLabel>Nama Instansi/OPD <span className="text-destructive">*</span></FormLabel>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Dinas Kesehatan"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FormLabel>Kode OPD <span className="text-destructive">*</span></FormLabel>
                <Input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="Contoh: DINKES"
                  disabled={!!editing}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FormLabel>Prefix Tiket <span className="text-destructive">*</span></FormLabel>
                <Input
                  type="text"
                  value={form.tiketPrefix}
                  onChange={(e) => setForm((f) => ({ ...f, tiketPrefix: e.target.value.toUpperCase() }))}
                  placeholder="Contoh: DKS (Maks 5 Karakter)"
                  disabled={!!editing}
                  maxLength={5}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FormLabel>Urutan Sortir</FormLabel>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <FormLabel>Deskripsi Tugas/Fungsi (Opsional)</FormLabel>
              <Input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Penjelasan ringkas bidang kerja instansi..."
              />
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
        columns={["Nama Instansi", "Kode", "Prefix Tiket", "Status", "Aksi"]}
        dataLength={opds.length}
      >
        {opds.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-semibold text-xs">
              <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-55" />
              Belum ada data OPD yang terdaftar.
            </TableCell>
          </TableRow>
        ) : (
          opds.map((opd) => (
            <TableRow key={opd.id} className="transition-colors hover:bg-muted/30">
              <TableCell className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-foreground">{opd.name}</p>
                    {opd.description && <SubText className="leading-relaxed font-semibold mt-0.5">{opd.description}</SubText>}
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3.5 font-mono text-xs text-foreground font-semibold">
                {opd.code}
              </TableCell>
              <TableCell className="px-4 py-3.5 font-mono text-xs text-muted-foreground font-semibold">
                {opd.tiketPrefix}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <button
                  onClick={() => handleToggleActive(opd)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                    opd.isActive
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      : "bg-muted/60 text-muted-foreground border-border/80"
                  }`}
                >
                  {opd.isActive ? "Aktif" : "Nonaktif"}
                </button>
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(opd)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(opd)}
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
