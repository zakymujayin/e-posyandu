"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Modal = "approve" | "revisi" | "warning" | "bypass" | null

interface Props {
  pengajuanId: string
  status: string
  sopExpired: boolean
}

export function AdminActions({ pengajuanId, status, sopExpired }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<Modal>(null)
  const [catatan, setCatatan] = useState("")
  const [targetRole, setTargetRole] = useState<"PETUGAS_DESA" | "PETUGAS_OPD">("PETUGAS_DESA")
  const [loading, setLoading] = useState(false)

  function openModal(m: Modal) {
    setCatatan("")
    setModal(m)
  }

  async function doAction(endpoint: string, body: Record<string, unknown>) {
    setLoading(true)
    try {
      const res = await fetch(`/api/pengajuan/${pengajuanId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success(json.message ?? "Berhasil")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal melakukan aksi")
    } finally {
      setLoading(false)
      setModal(null)
    }
  }

  async function doPatch(endpoint: string, body: Record<string, unknown>) {
    setLoading(true)
    try {
      const res = await fetch(`/api/pengajuan/${pengajuanId}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success(json.message ?? "Berhasil")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal")
    } finally {
      setLoading(false)
      setModal(null)
    }
  }

  const isClosed = ["SELESAI", "DITOLAK_DESA", "DITOLAK_OPD"].includes(status)
  if (isClosed) return null

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">Panel Aksi Admin</h3>

        {status === "MENUNGGU_APPROVAL_DPMD" && (
          <div className="space-y-2">
            <Button
              onClick={() => openModal("approve")}
              className="w-full min-h-[44px] bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              ✅ Approve & Selesaikan
            </Button>
            <Button
              variant="outline"
              onClick={() => openModal("revisi")}
              className="w-full min-h-[44px]"
              disabled={loading}
            >
              🔄 Minta Revisi ke OPD
            </Button>
          </div>
        )}

        <div className="space-y-2 border-t border-gray-100 pt-3">
          <Button
            variant="outline"
            onClick={() => openModal("warning")}
            className="w-full min-h-[44px]"
            disabled={loading}
          >
            📢 Kirim Teguran
          </Button>

          {sopExpired && ["MENUNGGU_VERIFIKASI", "DALAM_PROSES_OPD"].includes(status) && (
            <Button
              variant="outline"
              onClick={() => openModal("bypass")}
              className="w-full min-h-[44px] border-orange-300 text-orange-700 hover:bg-orange-50"
              disabled={loading}
            >
              ⚡ Bypass ke Tahap Berikutnya
            </Button>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <Dialog open={modal === "approve"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Pengajuan</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            Apakah tindak lanjut OPD sudah memenuhi syarat? Pengajuan akan ditandai SELESAI.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button onClick={() => doAction("approve", {})} className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revisi Modal */}
      <Dialog open={modal === "revisi"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Minta Revisi</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Catatan Revisi <span className="text-red-500">*</span></Label>
            <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Jelaskan apa yang perlu direvisi..." rows={4} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button onClick={() => doAction("revisi", { catatan })} disabled={loading || !catatan.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kirim Revisi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Modal */}
      <Dialog open={modal === "warning"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Kirim Teguran</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Tujuan Teguran</Label>
              <Select value={targetRole} onValueChange={(v) => setTargetRole(v as "PETUGAS_DESA" | "PETUGAS_OPD")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PETUGAS_DESA">Petugas Desa</SelectItem>
                  <SelectItem value="PETUGAS_OPD">Petugas OPD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Isi Teguran <span className="text-red-500">*</span></Label>
              <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tuliskan pesan teguran..." rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button onClick={() => doAction("warning", { catatan, targetRole })} disabled={loading || !catatan.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kirim Teguran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bypass Modal */}
      <Dialog open={modal === "bypass"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bypass Manual</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Bypass akan memindahkan pengajuan ke tahap berikutnya secara paksa.
            </p>
            <Label>Catatan Bypass <span className="text-red-500">*</span></Label>
            <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Alasan bypass..." rows={3} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button
              onClick={() => doAction("bypass", { catatan })}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
              variant="outline"
              disabled={loading || !catatan.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lakukan Bypass"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
