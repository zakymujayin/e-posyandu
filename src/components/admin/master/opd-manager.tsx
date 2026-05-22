"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, X, Check } from "lucide-react"

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
        if (!res.ok) { toast.error(data.message); return }
        setOpds((prev) => prev.map((o) => (o.id === editing.id ? data.data : o)))
        toast.success("OPD diperbarui")
      } else {
        const res = await fetch("/api/admin/master/opd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.message); return }
        setOpds((prev) => [...prev, data.data])
        toast.success("OPD ditambahkan")
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
    if (!res.ok) { toast.error(data.message); return }
    setOpds((prev) => prev.map((o) => (o.id === opd.id ? data.data : o)))
  }

  async function handleDelete(opd: Opd) {
    if (!confirm(`Hapus OPD "${opd.name}"?`)) return
    const res = await fetch(`/api/admin/master/opd/${opd.id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    setOpds((prev) => prev.filter((o) => o.id !== opd.id))
    toast.success("OPD dihapus")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Tambah OPD
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{editing ? "Edit OPD" : "Tambah OPD Baru"}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama OPD</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kode OPD</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  disabled={!!editing}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prefix Tiket (maks 5 karakter)</label>
                <input
                  type="text"
                  value={form.tiketPrefix}
                  onChange={(e) => setForm((f) => ({ ...f, tiketPrefix: e.target.value.toUpperCase() }))}
                  disabled={!!editing}
                  maxLength={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Urutan Tampil</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi (opsional)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nama OPD</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Kode</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Prefix Tiket</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {opds.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada data OPD</td>
              </tr>
            ) : (
              opds.map((opd) => (
                <tr key={opd.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{opd.name}</p>
                    {opd.description && <p className="text-xs text-gray-400 mt-0.5">{opd.description}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600 hidden md:table-cell">{opd.code}</td>
                  <td className="px-4 py-3 font-mono text-gray-600 hidden md:table-cell">{opd.tiketPrefix}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(opd)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opd.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {opd.isActive ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(opd)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(opd)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
