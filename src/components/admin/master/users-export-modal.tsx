"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FormLabel } from "@/components/ui/typography"

const ROLES = ["POSYANDU", "PETUGAS_DESA", "PETUGAS_KECAMATAN", "PETUGAS_OPD", "ADMIN_DPMD"] as const
const ROLE_LABELS: Record<string, string> = {
  POSYANDU: "Akun Posyandu",
  PETUGAS_DESA: "Petugas Desa",
  PETUGAS_KECAMATAN: "Petugas Kecamatan",
  PETUGAS_OPD: "Petugas OPD",
  ADMIN_DPMD: "Admin DPMD",
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  kecamatans: { id: string; name: string }[]
  desas: { id: string; name: string; kecamatanId: string }[]
}

export function UsersExportModal({ open, onOpenChange, kecamatans, desas }: Props) {
  const [role, setRole] = useState("")
  const [isActive, setIsActive] = useState("")
  const [kecId, setKecId] = useState("")
  const [desaId, setDesaId] = useState("")

  const filteredDesas = kecId ? desas.filter((d) => d.kecamatanId === kecId) : desas

  function handleKecChange(value: string) {
    setKecId(value)
    setDesaId("")
  }

  function handleDownload() {
    const params = new URLSearchParams()
    if (role) params.set("role", role)
    if (isActive) params.set("isActive", isActive)
    if (kecId) params.set("kecId", kecId)
    if (desaId) params.set("desaId", desaId)
    window.open(`/api/admin/master/users/export?${params.toString()}`, "_blank")
    onOpenChange(false)
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setRole("")
      setIsActive("")
      setKecId("")
      setDesaId("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-lg border border-border bg-card max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Daftar Pengguna
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <FormLabel>Hak Akses / Role</FormLabel>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-border/80 rounded-lg px-3 py-2 text-sm bg-card font-normal focus:outline-none focus:border-primary text-foreground"
            >
              <option value="">Semua Role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <FormLabel>Status Akun</FormLabel>
            <select
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              className="w-full border border-border/80 rounded-lg px-3 py-2 text-sm bg-card font-normal focus:outline-none focus:border-primary text-foreground"
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <FormLabel>Kecamatan</FormLabel>
            <select
              value={kecId}
              onChange={(e) => handleKecChange(e.target.value)}
              className="w-full border border-border/80 rounded-lg px-3 py-2 text-sm bg-card font-normal focus:outline-none focus:border-primary text-foreground"
            >
              <option value="">Semua Kecamatan</option>
              {kecamatans.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <FormLabel>Desa</FormLabel>
            <select
              value={desaId}
              onChange={(e) => setDesaId(e.target.value)}
              disabled={!kecId}
              className="w-full border border-border/80 rounded-lg px-3 py-2 text-sm bg-card font-normal focus:outline-none focus:border-primary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Semua Desa</option>
              {filteredDesas.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 text-xs font-semibold"
          >
            Batal
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1 text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Download Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
