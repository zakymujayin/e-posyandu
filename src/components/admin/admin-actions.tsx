"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, CheckCircle2, RotateCcw, AlertTriangle, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CardTitle, FormLabel } from "@/components/ui/typography"

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

  const isClosed = ["SELESAI", "DITOLAK_DESA", "DITOLAK_OPD"].includes(status)
  if (isClosed) return null

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-5 shadow-xs space-y-4 select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 bg-primary rounded-full"></span>
          <CardTitle>Panel Aksi Verifikator</CardTitle>
        </div>

        {status === "MENUNGGU_APPROVAL_DPMD" && (
          <div className="space-y-2">
            <Button
              onClick={() => openModal("approve")}
              className="w-full min-h-[44px] rounded-lg font-bold text-xs md:text-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              disabled={loading}
            >
              <CheckCircle2 className="w-4 h-4" />
              Setujui & Selesaikan
            </Button>
            <Button
              variant="outline"
              onClick={() => openModal("revisi")}
              className="w-full min-h-[44px] rounded-lg font-semibold text-xs md:text-sm gap-2"
              disabled={loading}
            >
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
              Minta Revisi OPD
            </Button>
          </div>
        )}

        <div className="space-y-2 pt-3 border-t border-border/60">
          <Button
            variant="outline"
            onClick={() => openModal("warning")}
            className="w-full min-h-[44px] rounded-lg font-semibold text-xs md:text-sm gap-2"
            disabled={loading}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Kirim Surat Teguran
          </Button>

          {sopExpired && ["MENUNGGU_VERIFIKASI", "DALAM_PROSES_OPD"].includes(status) && (
            <Button
              variant="outline"
              onClick={() => openModal("bypass")}
              className="w-full min-h-[44px] rounded-lg font-semibold text-xs md:text-sm border-amber-500/30 text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 gap-2"
              disabled={loading}
            >
              <ShieldAlert className="w-4 h-4" />
              Bypass Tahap Manual
            </Button>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <Dialog open={modal === "approve"} onOpenChange={() => setModal(null)}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-bold text-foreground">Setujui & Selesaikan Berkas?</DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-1">
              Dengan melakukan tindakan ini, Anda memverifikasi bahwa berkas tindak lanjut dinas terkait sudah benar dan memenuhi syarat. Berkas akan ditandai selesai.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" className="font-semibold text-xs md:text-sm" onClick={() => setModal(null)}>
              Kembali
            </Button>
            <Button
              onClick={() => doAction("approve", {})}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs md:text-sm"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Ya, Setujui Berkas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revisi Modal */}
      <Dialog open={modal === "revisi"} onOpenChange={() => setModal(null)}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-bold text-foreground">Ajukan Permintaan Revisi</DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-1">
              Berkas akan dikembalikan ke OPD terkait untuk dilakukan penyesuaian/revisi tindak lanjut berdasarkan catatan Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <FormLabel>Catatan Revisi <span className="text-destructive">*</span></FormLabel>
            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Berikan alasan revisi dan petunjuk perbaikan berkas secara spesifik..."
              rows={4}
              className="resize-none text-sm"
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button variant="outline" className="font-semibold text-xs md:text-sm" onClick={() => setModal(null)}>
              Batal
            </Button>
            <Button
              onClick={() => doAction("revisi", { catatan })}
              disabled={loading || !catatan.trim()}
              className="font-bold text-xs md:text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Kirim Revisi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Modal */}
      <Dialog open={modal === "warning"} onOpenChange={() => setModal(null)}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-bold text-foreground">Kirim Teguran Keterlambatan</DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-1">
              Surat teguran elektronik akan dikirimkan kepada instansi terkait sebagai peringatan penyelesaian berkas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <FormLabel>Sasaran Instansi Penerima</FormLabel>
              <Select value={targetRole} onValueChange={(v) => setTargetRole(v as "PETUGAS_DESA" | "PETUGAS_OPD")}>
                <SelectTrigger className="font-semibold text-xs md:text-sm text-foreground bg-card border-border/80"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="PETUGAS_DESA" className="text-xs md:text-sm font-semibold">Aparatur Pemerintahan Desa</SelectItem>
                  <SelectItem value="PETUGAS_OPD" className="text-xs md:text-sm font-semibold">Organisasi Perangkat Daerah (OPD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <FormLabel>Isi Teguran/Instruksi <span className="text-destructive">*</span></FormLabel>
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan pesan instruksi percepatan berkas..."
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button variant="outline" className="font-semibold text-xs md:text-sm" onClick={() => setModal(null)}>
              Batal
            </Button>
            <Button
              onClick={() => doAction("warning", { catatan, targetRole })}
              disabled={loading || !catatan.trim()}
              className="rounded-lg font-bold text-xs md:text-sm bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Kirim Teguran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bypass Modal */}
      <Dialog open={modal === "bypass"} onOpenChange={() => setModal(null)}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-bold text-foreground">Bypass Verifikasi Manual</DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-1">
              Bypass secara paksa akan melompati tahap verifikasi saat ini dan memindahkan status berkas langsung ke instansi berikutnya. Gunakan hanya jika berkas melebihi batas waktu SOP.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <FormLabel>Alasan Bypass Paksa <span className="text-destructive">*</span></FormLabel>
            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Jelaskan alasan bypass dan kondisi keterlambatan berkas..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button variant="outline" className="font-semibold text-xs md:text-sm" onClick={() => setModal(null)}>
              Batal
            </Button>
            <Button
              onClick={() => doAction("bypass", { catatan })}
              className="rounded-lg font-bold text-xs md:text-sm border-amber-500/40 text-amber-700 bg-amber-500/5 hover:bg-amber-500/10"
              variant="outline"
              disabled={loading || !catatan.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Lakukan Bypass
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
