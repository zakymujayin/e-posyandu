"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, X, Check, CalendarDays, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { FormSection } from "@/components/shared/form-section"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface Holiday {
  id: string
  date: string
  name: string
}

export function HolidaysManager({ initialHolidays }: { initialHolidays: Holiday[] }) {
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ date: "", name: "" })
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())

  const years = Array.from(new Set(holidays.map((h) => new Date(h.date).getFullYear().toString())))
    .sort((a, b) => Number(b) - Number(a))
  if (!years.includes(filterYear)) years.unshift(filterYear)

  const filtered = filterYear
    ? holidays.filter((h) => new Date(h.date).getFullYear().toString() === filterYear)
    : holidays

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/master/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? data.message); return }
      setHolidays((prev) => [...prev, data.data].sort((a, b) => a.date.localeCompare(b.date)))
      setForm({ date: "", name: "" })
      setShowForm(false)
      toast.success("Hari libur ditambahkan")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(h: Holiday) {
    if (!confirm(`Hapus hari libur "${h.name}" (${format(new Date(h.date), "d MMMM yyyy", { locale: localeId })})?`)) return
    const res = await fetch(`/api/admin/master/holidays/${h.id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? data.message); return }
    setHolidays((prev) => prev.filter((x) => x.id !== h.id))
    toast.success("Hari libur dihapus")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center select-none">
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-semibold focus:outline-none focus:border-primary text-foreground w-full sm:w-40"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <Button onClick={() => setShowForm(true)} size="sm" className="font-bold text-xs gap-1.5 shrink-0 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Tambah Hari Libur
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="transition-all duration-300">
          <FormSection
            title="Tambah Hari Libur Nasional"
            description="Daftarkan tanggal hari libur agar tidak dihitung sebagai hari kerja dalam kalkulasi SOP."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Tanggal <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Nama Hari Libur <span className="text-destructive">*</span></Label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Hari Kemerdekaan RI"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm" disabled={loading} className="font-bold text-xs gap-1">
                <Check className="w-3.5 h-3.5" />
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} className="font-bold text-xs gap-1">
                <X className="w-3.5 h-3.5" />
                Batal
              </Button>
            </div>
          </FormSection>
        </form>
      )}

      <DataTable
        columns={["Tanggal", "Hari", "Nama Hari Libur", "Aksi"]}
        dataLength={filtered.length}
      >
        {filtered.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="px-4 py-8 text-center text-muted-foreground font-semibold text-xs">
              <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-55" />
              Belum ada hari libur terdaftar untuk tahun {filterYear}.
            </TableCell>
          </TableRow>
        ) : (
          filtered.map((h) => {
            const d = new Date(h.date)
            const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
            return (
              <TableRow key={h.id} className="transition-colors hover:bg-muted/30">
                <TableCell className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-lg shrink-0">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-xs text-foreground">
                      {format(d, "d MMMM yyyy", { locale: localeId })}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs text-muted-foreground font-semibold">
                  {dayNames[d.getDay()]}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs text-foreground font-semibold">
                  {h.name}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(h)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </DataTable>
    </div>
  )
}
