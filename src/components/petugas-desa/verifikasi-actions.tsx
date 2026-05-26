"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, CheckCircle2, AlertTriangle, XCircle, ArrowUpCircle, Building2, Upload, FileText, X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { CardTitle, MutedText, FormLabel } from "@/components/ui/typography"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Opd {
  id: string
  name: string
}

interface Props {
  pengajuanId: string
  isDesa?: boolean
}

export function VerifikasiActions({ pengajuanId, isDesa = false }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showSelesaiDesaModal, setShowSelesaiDesaModal] = useState(false)
  const [showEskalasiModal, setShowEskalasiModal] = useState(false)

  // Form state
  const [alasan, setAlasan] = useState("")
  const [catatanDesa, setCatatanDesa] = useState("")
  const [catatanEskalasi, setCatatanEskalasi] = useState("")
  const [selectedOpdId, setSelectedOpdId] = useState("")
  const [opds, setOpds] = useState<Opd[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<{ path: string; name: string; size: number; mime: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (showEskalasiModal && opds.length === 0) {
      fetch("/api/opd")
        .then((r) => r.json())
        .then((json) => { if (json.success) setOpds(json.data) })
        .catch(() => toast.error("Gagal memuat daftar OPD"))
    }
  }, [showEskalasiModal, opds.length])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (uploadedFiles.length + files.length > 5) {
      toast.error("Maksimal 5 file")
      return
    }
    setUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        setUploadError(null)
        setUploadedFiles((prev) => [...prev, { path: json.data.url, name: json.data.fileName, size: json.data.size, mime: json.data.mimeType }])
      }
      toast.success("File berhasil diunggah")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal upload")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

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

  async function doSelesaiDesa() {
    if (uploadedFiles.length === 0) {
      setUploadError("Wajib upload minimal 1 file bukti penyelesaian")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/pengajuan/${pengajuanId}/verifikasi`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SELESAI_DESA",
          catatan: catatanDesa,
          attachments: uploadedFiles.map((f) => ({
            attachmentType: "FILE",
            filePath: f.path,
            fileName: f.name,
            fileSize: f.size,
            mimeType: f.mime,
          })),
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success("Pengajuan berhasil diselesaikan di tingkat desa")
      router.push("/petugas-desa")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyelesaikan pengajuan")
    } finally {
      setLoading(false)
      setShowSelesaiDesaModal(false)
    }
  }

  async function doEskalasi() {
    if (!selectedOpdId) {
      toast.error("Pilih OPD tujuan terlebih dahulu")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/pengajuan/${pengajuanId}/verifikasi`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ESKALASI_OPD",
          opdId: selectedOpdId,
          catatan: catatanEskalasi,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success("Pengajuan berhasil dieskalasikan ke OPD")
      router.push("/petugas-desa")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengeskalasikan pengajuan")
    } finally {
      setLoading(false)
      setShowEskalasiModal(false)
    }
  }

  if (!isDesa) {
    return (
      <>
        <Card className="border border-border rounded-lg shadow-sm overflow-hidden relative">
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
          <DialogContent className="rounded-lg border border-border bg-card max-w-sm p-6">
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
          <DialogContent className="rounded-lg border border-border bg-card max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                <span>Alasan Penolakan Berkas</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <MutedText className="leading-relaxed">
                Berkas yang ditolak akan ditutup secara permanen dan kader harus melakukan input ulang.
              </MutedText>
              <div className="space-y-1.5">
                <FormLabel htmlFor="verifikasi-alasan" className="text-muted-foreground">
                  Uraian Catatan Penolakan <span className="text-destructive">*</span>
                </FormLabel>
                <Textarea
                  id="verifikasi-alasan"
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

  // Layanan desa — 3 opsi
  return (
    <>
      <Card className="border border-border rounded-lg shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-500" />
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1">
            <CardTitle>Keputusan Verifikasi</CardTitle>
          </div>

          {/* Hint banner */}
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
            <Info className="size-4 shrink-0 mt-0.5" />
            <span>Pengaduan/layanan ini merupakan kewenangan desa. Anda dapat menyelesaikan langsung atau meneruskan ke OPD jika tidak sanggup ditangani.</span>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              onClick={() => setShowSelesaiDesaModal(true)}
              className="w-full min-h-[44px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2 text-xs md:text-sm"
              disabled={loading}
            >
              <CheckCircle2 className="size-4" />
              <span>Selesaikan di Desa</span>
            </Button>
            <Button
              onClick={() => setShowEskalasiModal(true)}
              className="w-full min-h-[44px] font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2 text-xs md:text-sm"
              disabled={loading}
            >
              <ArrowUpCircle className="size-4" />
              <span>Eskalasikan ke OPD</span>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectModal(true)}
              className="w-full min-h-[44px] font-bold flex items-center justify-center gap-2 text-xs md:text-sm"
              disabled={loading}
            >
              <XCircle className="size-4" />
              <span>Tolak Berkas</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selesaikan di Desa Modal */}
      <Dialog open={showSelesaiDesaModal} onOpenChange={(open) => {
        if (!open) { setUploadedFiles([]); setUploadError(null); setCatatanDesa("") }
        setShowSelesaiDesaModal(open)
      }}>
        <DialogContent className="rounded-lg border border-border bg-card max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <span>Selesaikan di Tingkat Desa</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* File Upload */}
            <div className="space-y-2">
              <FormLabel htmlFor="selesai-desa-file">
                Upload Bukti Penyelesaian <span className="text-destructive">*</span>
              </FormLabel>
              <label
                htmlFor="selesai-desa-file"
                className="group relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border/80 rounded-lg p-6 cursor-pointer text-center transition-all hover:bg-muted/30 hover:border-primary/50"
              >
                <div className="p-2.5 bg-muted group-hover:bg-primary/5 rounded-lg transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    {uploading ? "Sedang Mengupload..." : "Klik untuk Pilih File"}
                  </span>
                  <MutedText className="text-xs">JPG, PNG, atau PDF (Maks. 5MB)</MutedText>
                </div>
                <input
                  id="selesai-desa-file"
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading || uploadedFiles.length >= 5}
                />
              </label>
              {uploadError && <p className="text-xs font-semibold text-destructive">{uploadError}</p>}
              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-muted/40 border border-border/50 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate font-semibold">{f.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => { setUploadError(null); setUploadedFiles((p) => p.filter((_, idx) => idx !== i)) }}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Catatan */}
            <div className="space-y-1.5">
              <FormLabel htmlFor="selesai-desa-catatan" className="text-muted-foreground">
                Catatan Penyelesaian <span className="text-muted-foreground text-xs">(opsional)</span>
              </FormLabel>
              <Textarea
                id="selesai-desa-catatan"
                value={catatanDesa}
                onChange={(e) => setCatatanDesa(e.target.value)}
                placeholder="Tuliskan keterangan penyelesaian..."
                rows={3}
                className="rounded-lg border-border bg-background text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => { setShowSelesaiDesaModal(false); setUploadedFiles([]); setUploadError(null); setCatatanDesa("") }}
              disabled={loading}
              className="flex-1 text-xs md:text-sm font-semibold"
            >
              Batal
            </Button>
            <Button
              onClick={doSelesaiDesa}
              className="flex-1 text-xs md:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={loading || uploading}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Tandai Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eskalasi ke OPD Modal */}
      <Dialog open={showEskalasiModal} onOpenChange={(open) => {
        if (!open) { setSelectedOpdId(""); setCatatanEskalasi("") }
        setShowEskalasiModal(open)
      }}>
        <DialogContent className="rounded-lg border border-border bg-card max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="size-5 text-blue-500" />
              <span>Eskalasikan ke OPD</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <MutedText className="leading-relaxed text-xs">
              Pilih OPD yang paling relevan untuk menangani pengaduan ini. Pengajuan akan langsung masuk ke antrian tindak lanjut OPD tersebut.
            </MutedText>

            <div className="space-y-1.5">
              <FormLabel htmlFor="eskalasi-opd">
                OPD Tujuan <span className="text-destructive">*</span>
              </FormLabel>
              <Select value={selectedOpdId} onValueChange={(v) => setSelectedOpdId(v ?? "")}>
                <SelectTrigger id="eskalasi-opd" className="w-full text-sm">
                  <SelectValue placeholder="Pilih OPD..." />
                </SelectTrigger>
                <SelectContent>
                  {opds.map((opd) => (
                    <SelectItem key={opd.id} value={opd.id}>
                      {opd.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <FormLabel htmlFor="eskalasi-catatan" className="text-muted-foreground">
                Alasan Eskalasi <span className="text-muted-foreground text-xs">(opsional)</span>
              </FormLabel>
              <Textarea
                id="eskalasi-catatan"
                value={catatanEskalasi}
                onChange={(e) => setCatatanEskalasi(e.target.value)}
                placeholder="Jelaskan mengapa pengaduan ini perlu diteruskan ke OPD..."
                rows={3}
                className="rounded-lg border-border bg-background text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => { setShowEskalasiModal(false); setSelectedOpdId(""); setCatatanEskalasi("") }}
              disabled={loading}
              className="flex-1 text-xs md:text-sm font-semibold"
            >
              Batal
            </Button>
            <Button
              onClick={doEskalasi}
              className="flex-1 text-xs md:text-sm font-bold bg-blue-600 text-white hover:bg-blue-700"
              disabled={loading || !selectedOpdId}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Eskalasikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="rounded-lg border border-border bg-card max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              <span>Alasan Penolakan Berkas</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <MutedText className="leading-relaxed">
              Berkas yang ditolak akan ditutup secara permanen dan kader harus melakukan input ulang.
            </MutedText>
            <div className="space-y-1.5">
              <FormLabel htmlFor="verifikasi-alasan-desa" className="text-muted-foreground">
                Uraian Catatan Penolakan <span className="text-destructive">*</span>
              </FormLabel>
              <Textarea
                id="verifikasi-alasan-desa"
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
