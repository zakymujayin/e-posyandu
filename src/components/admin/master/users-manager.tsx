"use client"

import { useState, lazy, Suspense } from "react"

const UsersCsvImport = lazy(() =>
  import("@/components/admin/master/users-csv-import").then((m) => ({ default: m.UsersCsvImport }))
)
import { toast } from "sonner"
import { Plus, Pencil, X, Check, Search, UserCheck, HelpCircle, Upload, Eye, EyeOff, Trash2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormLabel, SubText } from "@/components/ui/typography"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { DataTable } from "@/components/shared/data-table"
import { Pagination } from "@/components/ui/pagination"
import { TableRow, TableCell } from "@/components/ui/table"
import { FormSection } from "@/components/shared/form-section"
import { UsersExportModal } from "@/components/admin/master/users-export-modal"

const ROLES = ["POSYANDU", "PETUGAS_DESA", "PETUGAS_KECAMATAN", "PETUGAS_OPD", "ADMIN_DPMD"] as const
const ROLE_LABELS: Record<string, string> = {
  POSYANDU: "Akun Posyandu",
  PETUGAS_DESA: "Petugas Desa",
  PETUGAS_KECAMATAN: "Petugas Kecamatan",
  PETUGAS_OPD: "Petugas OPD",
  ADMIN_DPMD: "Admin DPMD",
}

interface User {
  id: string
  name: string
  email: string
  username?: string | null
  role: string
  isActive: boolean
  createdAt: Date | string
  lastLoginAt: Date | string | null
  desaId?: string | null
  kecamatanId?: string | null
  opdId?: string | null
  posyanduId?: string | null
  desa: { name: string; kecamatan: { name: string } } | null
  kecamatan: { name: string } | null
  opd: { name: string } | null
  posyandu: { name: string; desa: { name: string; kecamatan: { name: string } } } | null
}

interface Props {
  initialUsers: User[]
  desas: { id: string; name: string; kecamatanId: string; kecamatan: { name: string } }[]
  kecamatans: { id: string; name: string }[]
  opds: { id: string; name: string }[]
  posyandus: { id: string; name: string; desaId: string }[]
}

const emptyForm = {
  name: "", email: "", username: "", password: "", role: "POSYANDU" as string,
  desaId: "", kecamatanId: "", opdId: "", posyanduId: "", phone: "",
}

export function UsersManager({ initialUsers, desas, kecamatans, opds, posyandus }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterActive, setFilterActive] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [rawPage, setRawPage] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const limit = 10

  const filtered = users.filter((u) => {
    const matchRole = filterRole ? u.role === filterRole : true
    const matchActive = filterActive === "true" ? u.isActive : filterActive === "false" ? !u.isActive : true
    const q = search.toLowerCase()
    const matchSearch = q ? u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) : true
    return matchRole && matchActive && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / limit) || 1
  const page = Math.min(rawPage, totalPages)
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setForm({
      ...emptyForm,
      name: u.name,
      role: u.role,
      desaId: u.desaId ?? "",
      kecamatanId: u.kecamatanId ?? "",
      opdId: u.opdId ?? "",
      posyanduId: u.posyanduId ?? "",
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body = {
        name: form.name,
        email: editing ? undefined : form.email,
        username: editing ? undefined : form.username,
        password: form.password || undefined,
        role: form.role,
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
      if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }

      if (editing) {
        setUsers((prev) => prev.map((u) => u.id === editing.id ? { ...u, ...data.data } : u))
        toast.success("Pengguna diperbarui")
      } else {
        setUsers((prev) => [data.data, ...prev])
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
    if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, isActive: data.data.isActive } : x))
    toast.success(data.data.isActive ? "Akun diaktifkan" : "Akun dinonaktifkan")
  }

  async function handleDelete(u: User) {
    if (!confirm(`Hapus pengguna "${u.name}"?\n\nAkun dengan histori data akan dinonaktifkan. Akun tanpa data akan dihapus permanen.`)) return
    const res = await fetch(`/api/admin/master/users/${u.id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? "Terjadi kesalahan"); return }
    if (data.data?.isActive === false) {
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, isActive: false } : x))
    } else {
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
    }
    toast.success(data.message ?? "Pengguna berhasil dihapus")
  }

  function handleExportExcel() {
    setShowExportModal(true)
  }

  const showDesa = ["POSYANDU", "PETUGAS_DESA"].includes(form.role)
  const showKec = form.role === "PETUGAS_KECAMATAN"
  const showOpd = form.role === "PETUGAS_OPD"
  const showPosyandu = form.role === "POSYANDU"

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama / email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-normal focus:outline-none focus:border-primary text-foreground w-full sm:w-48"
          >
            <option value="">Semua Peran/Role</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="border border-border/80 rounded-lg px-3 py-2 text-xs bg-card font-normal focus:outline-none focus:border-primary text-foreground w-full sm:w-40"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExportExcel}
            variant="default"
            size="sm"
            className="font-bold text-xs gap-1.5 flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </Button>
          <Button
            onClick={() => setShowImport(true)}
            variant="outline"
            size="sm"
            className="font-bold text-xs gap-1.5 flex-1 sm:flex-none"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button
            onClick={openCreate}
            size="sm"
            className="font-bold text-xs gap-1.5 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            Registrasi Pengguna
          </Button>
        </div>
      </div>

      {showImport && (
        <Suspense fallback={null}>
          <UsersCsvImport onClose={() => setShowImport(false)} />
        </Suspense>
      )}

      <UsersExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        kecamatans={kecamatans}
        desas={desas}
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="transition-all duration-300">
          <FormSection
            title={editing ? "Ubah Akun Pengguna" : "Registrasi Akun Pengguna Baru"}
            description="Konfigurasi kredensial dan sambungkan hak akses ke instansi/wilayah kerja yang sesuai."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FormLabel htmlFor="users-name">
                  {form.role === "POSYANDU" ? "Nama Posyandu" : "Nama Lengkap"} <span className="text-destructive">*</span>
                </FormLabel>
                <Input
                  id="users-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={form.role === "POSYANDU" ? "Contoh: Posyandu Melati" : "Nama lengkap tanpa gelar..."}
                  required
                />
              </div>
              {!editing && (
                <div className="space-y-1.5">
                  <FormLabel htmlFor="users-email">Alamat Email <span className="text-destructive">*</span></FormLabel>
                  <Input
                    id="users-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="Contoh: petugas@dinas.go.id"
                    required
                  />
                </div>
              )}
              {!editing && (
                <div className="space-y-1.5">
                  <FormLabel htmlFor="users-username">Username Login <span className="text-destructive">*</span></FormLabel>
                  <Input
                    id="users-username"
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
                    placeholder="Contoh: petugas_desa01"
                    required
                  />
                  <SubText>Huruf kecil, angka, dan underscore saja</SubText>
                </div>
              )}
              <div className="space-y-1.5">
                <FormLabel htmlFor="users-password">{editing ? "Kata Sandi Baru (Kosongkan jika tidak diubah)" : "Kata Sandi Baru"}</FormLabel>
                <div className="relative">
                  <Input
                    id="users-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Minimal 8 karakter..."
                    required={!editing}
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <FormLabel htmlFor="users-role">Hak Akses / Peran Sistem <span className="text-destructive">*</span></FormLabel>
                <select
                  id="users-role"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-border/80 rounded-lg px-3 py-2 text-[15px] xl:text-[16px] bg-card font-normal focus:outline-none focus:border-primary text-foreground"
                  required
                >
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              {showDesa && (
                <div className="space-y-1.5">
                  <FormLabel htmlFor="users-desaId">
                    Wilayah Kerja Desa
                    {form.role === "PETUGAS_DESA" && <span className="text-destructive"> *</span>}
                  </FormLabel>
                  <select
                    id="users-desaId"
                    value={form.desaId}
                    onChange={(e) => setForm((f) => ({ ...f, desaId: e.target.value, posyanduId: "" }))}
                    className="w-full border border-border/80 rounded-lg px-3 py-2 text-[15px] xl:text-[16px] bg-card font-normal focus:outline-none focus:border-primary text-foreground"
                    required={form.role === "PETUGAS_DESA"}
                  >
                    <option value="">Pilih Desa</option>
                    {desas.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.kecamatan.name})</option>)}
                  </select>
                </div>
              )}
              {showPosyandu && (
                <div className="space-y-1.5">
                  <FormLabel htmlFor="users-posyanduId">Posyandu <span className="text-destructive">*</span></FormLabel>
                  <select
                    id="users-posyanduId"
                    value={form.posyanduId}
                    onChange={(e) => setForm((f) => ({ ...f, posyanduId: e.target.value }))}
                    className="w-full border border-border/80 rounded-lg px-3 py-2 text-[15px] xl:text-[16px] bg-card font-normal focus:outline-none focus:border-primary text-foreground"
                    required
                  >
                    <option value="">Pilih Posyandu</option>
                    {posyandus
                      .filter((p) => !form.desaId || p.desaId === form.desaId)
                      .map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              {showKec && (
                <div className="space-y-1.5">
                  <FormLabel htmlFor="users-kecamatanId">Wilayah Kerja Kecamatan <span className="text-destructive">*</span></FormLabel>
                  <select
                    id="users-kecamatanId"
                    value={form.kecamatanId}
                    onChange={(e) => setForm((f) => ({ ...f, kecamatanId: e.target.value }))}
                    className="w-full border border-border/80 rounded-lg px-3 py-2 text-[15px] xl:text-[16px] bg-card font-normal focus:outline-none focus:border-primary text-foreground"
                    required
                  >
                    <option value="">Pilih Kecamatan</option>
                    {kecamatans.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
              )}
              {showOpd && (
                <div className="space-y-1.5">
                  <FormLabel htmlFor="users-opdId">Dinas / OPD Instansi <span className="text-destructive">*</span></FormLabel>
                  <select
                    id="users-opdId"
                    value={form.opdId}
                    onChange={(e) => setForm((f) => ({ ...f, opdId: e.target.value }))}
                    className="w-full border border-border/80 rounded-lg px-3 py-2 text-[15px] xl:text-[16px] bg-card font-normal focus:outline-none focus:border-primary text-foreground"
                    required
                  >
                    <option value="">Pilih OPD</option>
                    {opds.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="font-bold text-xs gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                {loading ? "Menyimpan..." : "Simpan Pengguna"}
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
        columns={["Nama & Email", "Username Login", "Hak Akses/Role", "Unit/Wilayah Kerja", "Login Terakhir", "Status", "Aksi"]}
        dataLength={paginated.length}
      >
        {paginated.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="px-4 py-8 text-center text-muted-foreground font-semibold text-xs">
              <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-55" />
              Tidak ada pengguna terdaftar yang cocok.
            </TableCell>
          </TableRow>
        ) : (
          paginated.map((u) => {
            const wilayah = u.opd?.name
              ?? (u.desa ? `${u.desa.name}, Kec. ${u.desa.kecamatan.name}` : null)
              ?? (u.kecamatan ? `Kec. ${u.kecamatan.name}` : null)
              ?? (u.posyandu ? `${u.posyandu.name}, Desa ${u.posyandu.desa.name}, Kec. ${u.posyandu.desa.kecamatan.name}` : null)
              ?? "Pusat Kabupaten"
            return (
              <TableRow key={u.id} className="transition-colors hover:bg-muted/30">
                <TableCell className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-foreground">{u.name}</p>
                      <SubText className="font-semibold mt-0.5">{u.email}</SubText>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  {u.username
                    ? <SubText className="font-mono text-blue-600">{u.username}</SubText>
                    : <SubText className="italic text-muted-foreground/50">Belum diset</SubText>
                  }
                </TableCell>
                <TableCell className="px-4 py-3.5 font-semibold text-xs text-foreground">
                    <span className="px-2 py-0.5 bg-muted rounded-md text-xs font-bold border border-border/60">
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs text-muted-foreground font-semibold">
                  {wilayah}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs text-muted-foreground font-semibold">
                  {u.lastLoginAt ? format(new Date(u.lastLoginAt), "d MMM yyyy HH:mm", { locale: localeId }) : "-"}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <button
                    onClick={() => handleToggle(u)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                      u.isActive
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                        : "bg-muted/60 text-muted-foreground border-border/80"
                    }`}
                  >
                    {u.isActive ? "Aktif" : "Nonaktif"}
                  </button>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(u)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                    aria-label={`Edit ${u.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(u)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    aria-label={`Hapus ${u.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </DataTable>
      <Pagination page={page} totalPages={totalPages} total={filtered.length} onPageChange={setRawPage} />
    </div>
  )
}
