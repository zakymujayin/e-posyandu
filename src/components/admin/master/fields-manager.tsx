"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, X, Check, HelpCircle, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { FormSection } from "@/components/shared/form-section"

const FIELD_TYPES = ["text", "textarea", "number", "date", "select", "radio", "checkbox"] as const
const HAS_OPTIONS = ["select", "radio", "checkbox"]

interface Field {
  id: string
  layananJenisId: string
  fieldLabel: string
  fieldName: string
  fieldType: string
  fieldOptions: string | null
  isRequired: boolean
  placeholder: string | null
  helperText: string | null
  sortOrder: number
  layananJenis: { name: string; opd: { name: string } }
}

interface Opd { id: string; name: string }
interface Layanan { id: string; name: string; opdId: string }

export function FieldsManager({
  initialFields,
  opds,
  layanans,
}: {
  initialFields: Field[]
  opds: Opd[]
  layanans: Layanan[]
}) {
  const [fields, setFields] = useState<Field[]>(initialFields)
  const [filterOpd, setFilterOpd] = useState("")
  const [filterLayanan, setFilterLayanan] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Field | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    layananJenisId: "", fieldLabel: "", fieldName: "", fieldType: "text" as string,
    fieldOptions: "", isRequired: false, placeholder: "", helperText: "", sortOrder: 0,
  })

  const filteredLayanans = filterOpd ? layanans.filter((l) => l.opdId === filterOpd) : layanans
  const filteredFields = fields.filter((f) => {
    if (filterLayanan) return f.layananJenisId === filterLayanan
    if (filterOpd) return filteredLayanans.some((l) => l.id === f.layananJenisId)
    return true
  })

  function openCreate() {
    setEditing(null)
    setForm({
      layananJenisId: filterLayanan || "",
      fieldLabel: "", fieldName: "", fieldType: "text",
      fieldOptions: "", isRequired: false, placeholder: "", helperText: "", sortOrder: 0,
    })
    setShowForm(true)
  }

  function openEdit(f: Field) {
    setEditing(f)
    setForm({
      layananJenisId: f.layananJenisId,
      fieldLabel: f.fieldLabel, fieldName: f.fieldName, fieldType: f.fieldType,
      fieldOptions: f.fieldOptions ?? "", isRequired: f.isRequired,
      placeholder: f.placeholder ?? "", helperText: f.helperText ?? "", sortOrder: f.sortOrder,
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body = {
        ...form,
        fieldOptions: HAS_OPTIONS.includes(form.fieldType) ? (form.fieldOptions || null) : null,
        placeholder: form.placeholder || null,
        helperText: form.helperText || null,
        sortOrder: Number(form.sortOrder),
      }

      if (editing) {
        const res = await fetch(`/api/admin/master/fields/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fieldLabel: body.fieldLabel, fieldOptions: body.fieldOptions,
            isRequired: body.isRequired, placeholder: body.placeholder,
            helperText: body.helperText, sortOrder: body.sortOrder,
          }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.message); return }
        setFields((prev) => prev.map((f) => f.id === editing.id ? { ...data.data, layananJenis: editing.layananJenis } : f))
        toast.success("Field berhasil diperbarui")
      } else {
        const res = await fetch("/api/admin/master/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.message); return }
        const layanan = layanans.find((l) => l.id === body.layananJenisId)
        const opd = opds.find((o) => o.id === layanan?.opdId)
        setFields((prev) => [...prev, { ...data.data, layananJenis: { name: layanan?.name ?? "", opd: { name: opd?.name ?? "" } } }])
        toast.success("Field berhasil ditambahkan")
      }
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(f: Field) {
    if (!confirm(`Hapus field "${f.fieldLabel}"?`)) return
    const res = await fetch(`/api/admin/master/fields/${f.id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    setFields((prev) => prev.filter((x) => x.id !== f.id))
    toast.success("Field berhasil dihapus")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <select
            value={filterOpd}
            onChange={(e) => { setFilterOpd(e.target.value); setFilterLayanan("") }}
            className="border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-semibold focus:outline-none focus:border-primary text-foreground w-full sm:w-48"
          >
            <option value="">Semua OPD</option>
            {opds.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select
            value={filterLayanan}
            onChange={(e) => setFilterLayanan(e.target.value)}
            className="border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-semibold focus:outline-none focus:border-primary text-foreground w-full sm:w-48"
          >
            <option value="">Semua Layanan</option>
            {filteredLayanans.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <Button
          onClick={openCreate}
          size="sm"
          className="font-bold text-xs gap-1.5 shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Tambah Field Baru
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="transition-all duration-300">
          <FormSection
            title={editing ? "Ubah Konfigurasi Field" : "Tambah Field Dinamis Baru"}
            description="Isian formulir ini akan muncul otomatis di halaman pendaftaran berkas kader berdasarkan jenis layanan."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Jenis Layanan Posyandu <span className="text-destructive">*</span></Label>
                <select
                  value={form.layananJenisId}
                  onChange={(e) => setForm((f) => ({ ...f, layananJenisId: e.target.value }))}
                  disabled={!!editing}
                  className="w-full border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-semibold focus:outline-none focus:border-primary text-foreground disabled:bg-muted/50"
                  required
                >
                  <option value="">Pilih Layanan</option>
                  {layanans.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Label Input <span className="text-destructive">*</span></Label>
                <Input
                  type="text"
                  value={form.fieldLabel}
                  onChange={(e) => setForm((f) => ({ ...f, fieldLabel: e.target.value }))}
                  placeholder="Contoh: Berat Badan Balita (Kg)"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Key Database (snake_case) <span className="text-destructive">*</span></Label>
                <Input
                  type="text"
                  value={form.fieldName}
                  onChange={(e) => setForm((f) => ({ ...f, fieldName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))}
                  placeholder="Contoh: berat_badan_balita"
                  disabled={!!editing}
                  className="font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground font-semibold">Tipe Komponen Input</Label>
                <select
                  value={form.fieldType}
                  onChange={(e) => setForm((f) => ({ ...f, fieldType: e.target.value }))}
                  disabled={!!editing}
                  className="w-full border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-semibold focus:outline-none focus:border-primary text-foreground disabled:bg-muted/50"
                >
                  {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {HAS_OPTIONS.includes(form.fieldType) && (
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Daftar Pilihan / Opsi (Pisahkan dengan koma)</Label>
                  <Input
                    type="text"
                    value={form.fieldOptions}
                    onChange={(e) => setForm((f) => ({ ...f, fieldOptions: e.target.value }))}
                    placeholder="Contoh: Sangat Baik,Baik,Kurang Baik"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Placeholder Text (Opsional)</Label>
                <Input
                  type="text"
                  value={form.placeholder}
                  onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))}
                  placeholder="Petunjuk bayangan dalam input..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Helper Text (Keterangan kecil)</Label>
                <Input
                  type="text"
                  value={form.helperText}
                  onChange={(e) => setForm((f) => ({ ...f, helperText: e.target.value }))}
                  placeholder="Teks bantuan kecil di bawah input..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Urutan Sortir</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={form.isRequired}
                  onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))}
                  className="w-4 h-4 rounded-sm border-border accent-primary focus:ring-transparent cursor-pointer"
                />
                <label htmlFor="isRequired" className="text-xs font-bold text-foreground cursor-pointer">
                  Wajib Diisi (Required Field)
                </label>
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
                {loading ? "Menyimpan..." : "Simpan Field"}
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
        columns={["Nama/Label Input", "Jenis Layanan", "Tipe", "Required", "Aksi"]}
        dataLength={filteredFields.length}
      >
        {filteredFields.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-semibold text-xs">
              <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-55" />
              Belum ada field dinamis terdaftar.
            </TableCell>
          </TableRow>
        ) : (
          filteredFields.map((f) => (
            <TableRow key={f.id} className="transition-colors hover:bg-muted/30">
              <TableCell className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg shrink-0">
                    <FileQuestion className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-foreground">{f.fieldLabel}</p>
                    <p className="text-[9px] font-mono text-muted-foreground font-semibold mt-0.5">{f.fieldName}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <p className="text-xs text-foreground font-semibold">{f.layananJenis.name}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{f.layananJenis.opd.name}</p>
              </TableCell>
              <TableCell className="px-4 py-3.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                {f.fieldType}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  f.isRequired
                    ? "bg-rose-500/10 text-rose-700 border-rose-500/20"
                    : "bg-muted text-muted-foreground border-border/80"
                }`}>
                  {f.isRequired ? "Wajib" : "Opsional"}
                </span>
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(f)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(f)}
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
