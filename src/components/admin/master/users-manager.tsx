"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, X, Check, Search } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

const ROLES = ["KADER", "PETUGAS_DESA", "PETUGAS_KECAMATAN", "PETUGAS_OPD", "ADMIN_DPMD"] as const
const ROLE_LABELS: Record<string, string> = {
  KADER: "Kader",
  PETUGAS_DESA: "Petugas Desa",
  PETUGAS_KECAMATAN: "Petugas Kecamatan",
  PETUGAS_OPD: "Petugas OPD",
  ADMIN_DPMD: "Admin DPMD",
}

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: Date | string
  lastLoginAt: Date | string | null
  desa: { name: string } | null
  kecamatan: { name: string } | null
  opd: { name: string } | null
  posyandu: { name: string } | null
}

interface Props {
  initialUsers: User[]
  desas: { id: string; name: string; kecamatan: { name: string } }[]
  kecamatans: { id: string; name: string }[]
  opds: { id: string; name: string }[]
  posyandus: { id: string; name: string }[]
}

const emptyForm = {
  name: "", email: "", password: "", role: "KADER" as string,
  desaId: "", kecamatanId: "", opdId: "", posyanduId: "", phone: "",
}

export function UsersManager({ initialUsers, desas, kecamatans, opds, posyandus }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = users.filter((u) => {
    const matchRole = filterRole ? u.role === filterRole : true
    const q = search.toLowerCase()
    const matchSearch = q ? u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) : true
    return matchRole && matchSearch
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setForm({ ...emptyForm, name: u.name, role: u.role, phone: "" })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body = {
        name: form.name,
        email: editing ? undefined : form.email,
        password: form.password || undefined,
        role: editing ? undefined : form.role,
        desaId: form.desaId || null,
        kecamatanId: form.kecamatanId || null,
        opdId: form.opdId || null,
        posyanduId: form.posyanduId || null,
        phone: form.phone || null,
      }

      const url = editing ? `/api/admin/master/users/${editing.id}` : "/api/admin/master/users"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }

      if (editing) {
        setUsers((prev) => prev.map((u) => u.id === editing.id ? { ...u, ...data.data } : u))
        toast.success("Pengguna diperbarui")
      } else {
        setUsers((prev) => [{ ...data.data, desa: null, kecamatan: null, opd: null, posyandu: null }, ...prev])
        toast.success("Pengguna ditambahkan")
      }
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(u: User) {
    const res = await fetch(`/api/admin/master/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, isActive: data.data.isActive } : x))
    toast.success(data.data.isActive ? "Akun diaktifkan" : "Akun dinonaktifkan")
  }

  const showDesa = ["KADER", "PETUGAS_DESA"].includes(form.role)
  const showKec = form.role === "PETUGAS_KECAMATAN"
  const showOpd = form.role === "PETUGAS_OPD"
  const showPosyandu = form.role === "KADER"

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama / email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Semua Role</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Tambah Pengguna
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{editing ? "Edit Pengguna" : "Tambah Pengguna"}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              {!editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{editing ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}</label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required={!editing} minLength={8} />
              </div>
              {!editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              )}
              {showDesa && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Desa</label>
                  <select value={form.desaId} onChange={(e) => setForm((f) => ({ ...f, desaId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Pilih Desa</option>
                    {desas.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.kecamatan.name})</option>)}
                  </select>
                </div>
              )}
              {showKec && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kecamatan</label>
                  <select value={form.kecamatanId} onChange={(e) => setForm((f) => ({ ...f, kecamatanId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Pilih Kecamatan</option>
                    {kecamatans.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
              )}
              {showOpd && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">OPD</label>
                  <select value={form.opdId} onChange={(e) => setForm((f) => ({ ...f, opdId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Pilih OPD</option>
                    {opds.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}
              {showPosyandu && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Posyandu</label>
                  <select value={form.posyanduId} onChange={(e) => setForm((f) => ({ ...f, posyanduId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Pilih Posyandu</option>
                    {posyandus.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
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
              <th className="px-4 py-3 text-left font-medium">Nama</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Role</th>
              <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Wilayah/OPD</th>
              <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Login Terakhir</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada pengguna</td></tr>
            ) : (
              filtered.map((u) => {
                const wilayah = u.opd?.name ?? u.desa?.name ?? u.kecamatan?.name ?? u.posyandu?.name ?? "-"
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{ROLE_LABELS[u.role]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{wilayah}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {u.lastLoginAt ? format(new Date(u.lastLoginAt), "d MMM yyyy HH:mm", { locale: localeId }) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(u)} className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
