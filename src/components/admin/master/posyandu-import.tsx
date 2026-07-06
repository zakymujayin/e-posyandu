"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import ExcelJS from "exceljs"
import { Upload, Download, X, CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ParsedRow {
  nama_posyandu: string
  alamat: string
  desa: string
  kecamatan: string
}

interface ImportResult {
  row: number
  status: "ok" | "error"
  name: string
  message?: string
  action?: "create" | "skip"
}

interface PosyanduImportProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PosyanduImport({ open, onClose, onSuccess }: PosyanduImportProps) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState("")
  const [results, setResults] = useState<ImportResult[] | null>(null)
  const [previewResults, setPreviewResults] = useState<ImportResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload")
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setPreviewResults(null)
    setResults(null)
    setStep("upload")

    try {
      const buffer = await file.arrayBuffer()
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(buffer)
      const ws = wb.worksheets[0]
      if (!ws) { toast.error("File Excel kosong"); return }

      let headerRow = -1
      for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
        const row = ws.getRow(r)
        let hasNama = false, hasAlamat = false, hasDesa = false
        row.eachCell((cell) => {
          const v = String(cell.value ?? "").toUpperCase()
          if (v.includes("NAMA")) hasNama = true
          if (v.includes("ALAMAT")) hasAlamat = true
          if (v.includes("DESA")) hasDesa = true
        })
        if (hasNama && hasAlamat && hasDesa) headerRow = r
      }
      if (headerRow < 0) { toast.error("Header tidak ditemukan (butuh kolom: NAMA POSYANDU, ALAMAT, DESA, KECAMATAN)"); return }

      const rows: ParsedRow[] = []
      for (let r = headerRow + 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r)
        const nama = (row.getCell(2).text || String(row.getCell(2).value ?? "")).trim()
        const alamat = (row.getCell(3).text || String(row.getCell(3).value ?? "")).trim()
        const desa = (row.getCell(4).text || String(row.getCell(4).value ?? "")).trim()
        const kec = (row.getCell(5).text || String(row.getCell(5).value ?? "")).trim()
        if (!nama) continue
        rows.push({ nama_posyandu: nama, alamat, desa, kecamatan: kec })
      }

      setParsedRows(rows)
    } catch {
      toast.error("Gagal membaca file Excel")
    }
  }

  async function handlePreview() {
    if (parsedRows.length === 0) { toast.error("File kosong atau format tidak valid"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/master/posyandu-batch/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows, previewOnly: true }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? data.message); return }
      setPreviewResults(data.data.results)
      setStep("preview")
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/master/posyandu-batch/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? data.message); return }
      setResults(data.data.results)
      setStep("done")
      toast.success(`${data.data.imported} posyandu berhasil diimport`)
      onSuccess?.()
    } finally {
      setLoading(false)
    }
  }

  function downloadTemplate() {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("TEMPLATE")
    ws.columns = [
      { header: "NO", key: "no", width: 8 },
      { header: "NAMA POSYANDU", key: "nama", width: 30 },
      { header: "ALAMAT", key: "alamat", width: 50 },
      { header: "DESA", key: "desa", width: 25 },
      { header: "KECAMATAN", key: "kecamatan", width: 25 },
    ]
    ws.addRow({ no: 1, nama: "MELATI 1", alamat: "KP. SUKAJAYA", desa: "CIMANCAK", kecamatan: "BAYAH" })
    wb.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = "template_posyandu.xlsx"; a.click()
      URL.revokeObjectURL(url)
    })
  }

  const displayResults = results ?? previewResults
  const validCount = displayResults?.filter(r => r.status === "ok" && r.action !== "skip").length ?? 0
  const skippedCount = displayResults?.filter(r => r.action === "skip").length ?? 0
  const errorCount = displayResults?.filter(r => r.status === "error").length ?? 0

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-base text-foreground">Import Posyandu dari Excel</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Upload file .xlsx hasil konsolidasi data posyandu</p>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-4 py-3">
            <div>
              <p className="text-xs font-bold text-foreground">Template Excel</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Kolom: NO, NAMA POSYANDU, ALAMAT, DESA, KECAMATAN
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="font-bold text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
          </div>

          {step === "upload" && (
            <div>
              <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
              >
                <Upload className="w-8 h-8 opacity-50" />
                <p className="text-sm font-semibold">{fileName || "Klik untuk upload file Excel (.xlsx)"}</p>
                {parsedRows.length > 0 && (
                  <p className="text-xs text-primary font-bold">{parsedRows.length} posyandu ditemukan</p>
                )}
              </button>
            </div>
          )}

          {(step === "preview" || step === "done") && displayResults && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{validCount}</p>
                  <p className="text-[10px] font-bold text-emerald-600">Baris Valid</p>
                </div>
                <div className="flex-1 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-destructive">{errorCount}</p>
                  <p className="text-[10px] font-bold text-destructive">Baris Error</p>
                </div>
              </div>

              {skippedCount > 0 && !results && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-xs font-semibold text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {skippedCount} posyandu sudah ada di sistem — akan dilewati.
                </div>
              )}

              {errorCount > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-foreground">Detail Error:</p>
                  {displayResults.filter(r => r.status === "error").map(r => (
                    <div key={r.row} className="flex items-start gap-2 bg-destructive/5 border border-destructive/15 rounded-lg px-3 py-2 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                      <span className="text-destructive font-semibold">Baris {r.row}</span>
                      <span className="text-muted-foreground">({r.name || "—"})</span>
                      <span className="text-foreground">{r.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {step === "done" && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {validCount} posyandu baru diimport{skippedCount > 0 ? `, ${skippedCount} dilewati (sudah ada)` : ""}.
                </div>
              )}
            </div>
          )}

          {step === "upload" && parsedRows.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-4 py-3 text-xs">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">{fileName}</span>
              <span className="text-muted-foreground">— {parsedRows.length} posyandu</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="font-bold text-xs">
            {step === "done" ? "Tutup" : "Batal"}
          </Button>
          <div className="flex gap-2">
            {step === "upload" && parsedRows.length > 0 && (
              <Button size="sm" onClick={handlePreview} disabled={loading} className="font-bold text-xs gap-1.5">
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Validasi Data
              </Button>
            )}
            {step === "preview" && validCount > 0 && (
              <Button size="sm" onClick={handleImport} disabled={loading} className="font-bold text-xs gap-1.5">
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Import {validCount} Data Valid
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
