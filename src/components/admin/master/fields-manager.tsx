"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, X, Check } from "lucide-react"

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
        toast.success("Field diperbarui")
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
        toast.success("Field ditambahkan")
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
    toast.success("Field dihapus")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select value={filterOpd} onChange={(e) => { setFilterOpd(e.target.value); setFilterLayanan("") }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Semua OPD</option>
            {opds.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select value={filterLayanan} onChange={(e) => setFilterLayanan(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Semua Layanan</option>
            {filteredLayanans.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Tambah Field
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{editing ? "Edit Field" : "Tambah Field"}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Layanan</label>
                <select value={form.layananJenisId} onChange={(e) => setForm((f) => ({ ...f, layananJenisId: e.target.value }))} disabled={!!editing} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100" required>
                  <option value="">Pilih Layanan</option>
                  {layanans.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Label Field</label>
                <input type="text" value={form.fieldLabel} onChange={(e) => setForm((f) => ({ ...f, fieldLabel: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Field (snake_case)</label>
                <input type="text" value={form.fieldName} onChange={(e) => setForm((f) => ({ ...f, fieldName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))} disabled={!!editing} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipe Field</label>
                <select value={form.fieldType} onChange={(e) => setForm((f) => ({ ...f, fieldType: e.target.value }))} disabled={!!editing} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100">
                  {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {HAS_OPTIONS.includes(form.fieldType) && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Opsi (pisahkan dengan koma)</label>
                  <input type="text" value={form.fieldOptions} onChange={(e) => setForm((f) => ({ ...f, fieldOptions: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Opsi 1,Opsi 2,Opsi 3" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
                <input type="text" value={form.placeholder} onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Helper Text</label>
                <input type="text" value={form.helperText} onChange={(e) => setForm((f) => ({ ...f, helperText: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Urutan</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="isRequired" checked={form.isRequired} onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="isRequired" className="text-sm text-gray-700">Wajib diisi</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"><Check className="w-4 h-4" />{loading ? "Menyimpan..." : "Simpan"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"><X className="w-4 h-4" />Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Label</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Layanan</th>
              <th className="px-4 py-3 text-left font-medium">Tipe</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Wajib</th>
              <th className="px-4 py-3 text-left font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredFields.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada field</td></tr>
            ) : (
              filteredFields.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{f.fieldLabel}</p>
                    <p className="text-xs font-mono text-gray-400">{f.fieldName}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-gray-700">{f.layananJenis.name}</p>
                    <p className="text-xs text-gray-400">{f.layananJenis.opd.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{f.fieldType}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs ${f.isRequired ? "text-red-600 font-medium" : "text-gray-400"}`}>
                      {f.isRequired ? "Ya" : "Tidak"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(f)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(f)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
