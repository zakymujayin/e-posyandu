"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, X, Check } from "lucide-react"

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

export function WilayahManager({
  initialKecamatans,
  initialDesas,
}: {
  initialKecamatans: Kecamatan[]
  initialDesas: Desa[]
}) {
  const [kecamatans, setKecamatans] = useState<Kecamatan[]>(initialKecamatans)
  const [desas, setDesas] = useState<Desa[]>(initialDesas)
  const [activeTab, setActiveTab] = useState<"kecamatan" | "desa">("kecamatan")
  const [filterKec, setFilterKec] = useState("")
  const [showKecForm, setShowKecForm] = useState(false)
  const [showDesaForm, setShowDesaForm] = useState(false)
  const [kecForm, setKecForm] = useState({ name: "", code: "" })
  const [desaForm, setDesaForm] = useState({ kecamatanId: "", name: "", code: "" })
  const [loading, setLoading] = useState(false)

  const filteredDesas = filterKec ? desas.filter((d) => d.kecamatanId === filterKec) : desas

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
      if (!res.ok) { toast.error(data.message); return }
      setKecamatans((prev) => [...prev, { ...data.data, _count: { desas: 0 } }])
      setKecForm({ name: "", code: "" })
      setShowKecForm(false)
      toast.success("Kecamatan ditambahkan")
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
      if (!res.ok) { toast.error(data.message); return }
      const kecName = kecamatans.find((k) => k.id === desaForm.kecamatanId)?.name ?? ""
      setDesas((prev) => [...prev, { ...data.data, kecamatan: { name: kecName } }])
      setDesaForm({ kecamatanId: "", name: "", code: "" })
      setShowDesaForm(false)
      toast.success("Desa ditambahkan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["kecamatan", "desa"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "kecamatan" ? `Kecamatan (${kecamatans.length})` : `Desa (${desas.length})`}
          </button>
        ))}
      </div>

      {activeTab === "kecamatan" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowKecForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Tambah Kecamatan
            </button>
          </div>
          {showKecForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <form onSubmit={handleAddKecamatan} className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nama Kecamatan</label>
                  <input type="text" value={kecForm.name} onChange={(e) => setKecForm((f) => ({ ...f, name: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kode</label>
                  <input type="text" value={kecForm.code} onChange={(e) => setKecForm((f) => ({ ...f, code: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"><Check className="w-4 h-4" />Simpan</button>
                <button type="button" onClick={() => setShowKecForm(false)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"><X className="w-4 h-4" />Batal</button>
              </form>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nama Kecamatan</th>
                  <th className="px-4 py-3 text-left font-medium">Kode</th>
                  <th className="px-4 py-3 text-left font-medium">Jumlah Desa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kecamatans.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Belum ada kecamatan</td></tr>
                ) : (
                  kecamatans.map((k) => (
                    <tr key={k.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{k.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{k.code}</td>
                      <td className="px-4 py-3 text-gray-500">{k._count.desas}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "desa" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <select value={filterKec} onChange={(e) => setFilterKec(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Semua Kecamatan</option>
              {kecamatans.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
            <button onClick={() => setShowDesaForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Tambah Desa
            </button>
          </div>
          {showDesaForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <form onSubmit={handleAddDesa} className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kecamatan</label>
                  <select value={desaForm.kecamatanId} onChange={(e) => setDesaForm((f) => ({ ...f, kecamatanId: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="">Pilih Kecamatan</option>
                    {kecamatans.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nama Desa</label>
                  <input type="text" value={desaForm.name} onChange={(e) => setDesaForm((f) => ({ ...f, name: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kode</label>
                  <input type="text" value={desaForm.code} onChange={(e) => setDesaForm((f) => ({ ...f, code: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"><Check className="w-4 h-4" />Simpan</button>
                <button type="button" onClick={() => setShowDesaForm(false)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"><X className="w-4 h-4" />Batal</button>
              </form>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nama Desa</th>
                  <th className="px-4 py-3 text-left font-medium">Kecamatan</th>
                  <th className="px-4 py-3 text-left font-medium">Kode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDesas.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Belum ada desa</td></tr>
                ) : (
                  filteredDesas.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                      <td className="px-4 py-3 text-gray-600">{d.kecamatan.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-500">{d.code}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
