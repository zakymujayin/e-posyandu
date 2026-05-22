"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, X, Check } from "lucide-react"

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
        if (!res.ok) { toast.error(data.message); return }
        setLayanans((prev) => prev.map((l) => l.id === editing.id ? { ...data.data, opd: editing.opd } : l))
        toast.success("Layanan diperbarui")
      } else {
        const res = await fetch("/api/admin/master/layanan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.message); return }
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
    if (!res.ok) { toast.error(data.message); return }
    setLayanans((prev) => prev.map((x) => x.id === l.id ? { ...data.data, opd: l.opd } : x))
  }

  async function handleDelete(l: Layanan) {
    if (!confirm(`Hapus layanan "${l.name}"?`)) return
    const res = await fetch(`/api/admin/master/layanan/${l.id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    setLayanans((prev) => prev.filter((x) => x.id !== l.id))
    toast.success("Layanan dihapus")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <select
          value={filterOpd}
          onChange={(e) => setFilterOpd(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Semua OPD</option>
          {opds.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Tambah Layanan
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{editing ? "Edit Layanan" : "Tambah Layanan"}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">OPD</label>
                <select
                  value={form.opdId}
                  onChange={(e) => setForm((f) => ({ ...f, opdId: e.target.value }))}
                  disabled={!!editing}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  required
                >
                  <option value="">Pilih OPD</option>
                  {opds.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Layanan</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Urutan</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi (opsional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                <Check className="w-4 h-4" />
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
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
              <th className="px-4 py-3 text-left font-medium">Nama Layanan</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">OPD</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Belum ada layanan</td></tr>
            ) : (
              filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{l.name}</p>
                    {l.description && <p className="text-xs text-gray-400 mt-0.5">{l.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{l.opd.name}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(l)} className={`px-2 py-1 rounded-full text-xs font-medium ${l.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {l.isActive ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(l)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(l)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
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
