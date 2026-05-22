"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { User, Lock } from "lucide-react"

export function ProfilForms({ initialName }: { initialName: string }) {
  const router = useRouter()
  const nameRef = useRef<HTMLInputElement>(null)
  const [savingName, setSavingName] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pw, setPw] = useState({ current: "", new: "", confirm: "" })

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault()
    const name = nameRef.current?.value.trim()
    if (!name) return
    setSavingName(true)
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan")
      toast.success("Nama berhasil diperbarui")
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSavingName(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!pw.current) {
      toast.error("Password lama wajib diisi")
      return
    }
    if (pw.new.length < 6) {
      toast.error("Password baru minimal 6 karakter")
      return
    }
    if (pw.new !== pw.confirm) {
      toast.error("Konfirmasi password tidak cocok")
      return
    }
    setSavingPw(true)
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameRef.current?.value.trim() || initialName,
          currentPassword: pw.current,
          newPassword: pw.new,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan")
      toast.success("Password berhasil diubah")
      setPw({ current: "", new: "", confirm: "" })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <>
      {/* Update Nama */}
      <form onSubmit={handleUpdateName} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 text-gray-700">
          <User className="w-4 h-4" />
          <h2 className="text-sm font-semibold">Informasi Akun</h2>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Nama Lengkap</label>
          <input
            ref={nameRef}
            type="text"
            defaultValue={initialName}
            required
            className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button type="submit" size="sm" className="text-xs" disabled={savingName}>
          {savingName ? "Menyimpan…" : "Simpan Nama"}
        </Button>
      </form>

      {/* Ganti Password */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Lock className="w-4 h-4" />
          <h2 className="text-sm font-semibold">Ganti Password</h2>
        </div>
        {(["current", "new", "confirm"] as const).map((field) => (
          <div key={field} className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              {field === "current" ? "Password Lama" : field === "new" ? "Password Baru" : "Konfirmasi Password Baru"}
            </label>
            <input
              type="password"
              value={pw[field]}
              onChange={(e) => setPw((p) => ({ ...p, [field]: e.target.value }))}
              required
              minLength={field === "current" ? 1 : 6}
              className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <Button type="submit" size="sm" className="text-xs" disabled={savingPw}>
          {savingPw ? "Menyimpan…" : "Ganti Password"}
        </Button>
      </form>
    </>
  )
}
