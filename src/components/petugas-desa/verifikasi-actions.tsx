"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { CardTitle, MutedText, FormLabel } from "@/components/ui/typography"

interface Props {
  pengajuanId: string
}

export function VerifikasiActions({ pengajuanId }: Props) {
  const router = useRouter()
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [alasan, setAlasan] = useState("")
  const [loading, setLoading] = useState(false)

  async function doVerifikasi(action: "APPROVE" | "REJECT") {
    if (action === "REJECT" && !alasan.trim()) {
      toast.error("Alasan penolakan wajib diisi")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/pengajuan/${pengajuanId}/verifikasi`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, catatan: alasan }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      toast.success(action === "APPROVE" ? "Pengajuan berhasil diverifikasi" : "Pengajuan berhasil ditolak")
      router.push("/petugas-desa")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal melakukan verifikasi")
    } finally {
      setLoading(false)
      setShowApproveModal(false)
      setShowRejectModal(false)
    }
  }

  return (
    <>
      <Card className="border border-border rounded-lg shadow-sm overflow-hidden select-none relative">
        {/* Amber top line */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-amber-500" />
        
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1">
            <CardTitle>Keputusan Verifikasi</CardTitle>
            <MutedText className="leading-relaxed">
              Periksa lampiran berkas dan isian data secara seksama sebelum melakukan persetujuan.
            </MutedText>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setShowApproveModal(true)}
              className="flex-1 min-h-[44px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2 text-xs md:text-sm"
              disabled={loading}
            >
              <CheckCircle2 className="size-4" />
              <span>Verifikasi & Setujui</span>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectModal(true)}
              className="flex-1 min-h-[44px] font-bold flex items-center justify-center gap-2 text-xs md:text-sm"
              disabled={loading}
            >
              <XCircle className="size-4" />
              <span>Tolak Berkas</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="rounded-lg border border-border bg-card max-w-sm select-none p-6">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <span>Konfirmasi Persetujuan</span>
            </DialogTitle>
          </DialogHeader>
          <MutedText className="leading-relaxed py-2">
            Apakah Anda yakin ingin memverifikasi berkas pengajuan ini? Data akan langsung diteruskan ke Organisasi Perangkat Daerah (OPD) untuk ditindaklanjuti.
          </MutedText>
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowApproveModal(false)} disabled={loading} className="flex-1 text-xs md:text-sm font-semibold">
              Batal
            </Button>
            <Button onClick={() => doVerifikasi("APPROVE")} className="flex-1 text-xs md:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700" disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Ya, Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="rounded-lg border border-border bg-card max-w-md select-none p-6">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              <span>Alasan Penolakan Berkas</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <MutedText className="leading-relaxed">
              Berkas yang ditolak akan ditutup secara permanen dan kader harus melakukan input ulang. Pastikan Anda menuliskan catatan koreksi secara rinci.
            </MutedText>
            <div className="space-y-1.5">
              <FormLabel className="text-muted-foreground">
                Uraian Catatan Penolakan <span className="text-destructive">*</span>
              </FormLabel>
              <Textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Tuliskan kekurangan berkas/alasan di sini secara detail..."
                rows={4}
                className="rounded-lg border-border bg-background text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={loading} className="flex-1 text-xs md:text-sm font-semibold">
              Batal
            </Button>
            <Button variant="destructive" onClick={() => doVerifikasi("REJECT")} disabled={loading || !alasan.trim()} className="flex-1 text-xs md:text-sm font-bold">
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Tolak Berkas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
