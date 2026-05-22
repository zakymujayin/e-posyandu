"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">Aksi Verifikasi</h3>
        <p className="text-sm text-gray-500">
          Periksa detail pengajuan di atas sebelum mengambil keputusan.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowApproveModal(true)}
            className="flex-1 min-h-[44px] bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            ✅ Verifikasi & Teruskan ke OPD
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowRejectModal(true)}
            className="flex-1 min-h-[44px]"
            disabled={loading}
          >
            ❌ Tolak Pengajuan
          </Button>
        </div>
      </div>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Verifikasi</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Apakah Anda yakin ingin memverifikasi dan meneruskan pengajuan ini ke OPD?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowApproveModal(false)} disabled={loading}>Batal</Button>
            <Button onClick={() => doVerifikasi("APPROVE")} className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Verifikasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pengajuan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Pengajuan yang ditolak akan ditutup permanen. Masyarakat harus mengajukan ulang.
            </p>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Tuliskan alasan penolakan..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={loading}>Batal</Button>
            <Button variant="destructive" onClick={() => doVerifikasi("REJECT")} disabled={loading || !alasan.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tolak Pengajuan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
