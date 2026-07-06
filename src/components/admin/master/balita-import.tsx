"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Upload, Download, X, CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ParsedRow {
  nama_balita: string
  jenis_kelamin: string
  tanggal_lahir: string
  alamat: string
  tanggal_ukur: string
  bb_u: string
  tb_u: string
  bb_tb: string
}

interface ImportResult {
  row: number
  status: "ok" | "error"
  name: string
  message?: string
  action?: "create" | "skip"
}

interface BalitaImportProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  posyanduId: string
  posyanduName: string
}

const MAX_ROWS = 500
const MAX_FILE_SIZE = 10 * 1024 * 1024

export function BalitaImport({ open, onClose, onSuccess, posyanduId, posyanduName }: BalitaImportProps) {
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
      if (file.size > MAX_FILE_SIZE) { toast.error("File terlalu besar (maksimal 10MB)"); return }
      const text = await file.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, "text/html")
      const table = doc.querySelector("#simple-table") || doc.querySelector("table")
      if (!table) { toast.error("Format file tidak dikenal (tabel tidak ditemukan)"); return }

      const trs = table.querySelectorAll("tr")
      if (trs.length < 2) { toast.error("File kosong atau hanya berisi header"); return }

      const rows: ParsedRow[] = []
      for (let i = 1; i < trs.length; i++) {
        const cells = trs[i].querySelectorAll("td, th")
        if (cells.length < 15) continue

        const nama = (cells[2]?.textContent ?? "").trim()
        if (!nama) continue

        const jk = (cells[3]?.textContent ?? "").trim().toUpperCase()
        const tglLahir = (cells[4]?.textContent ?? "").trim()
        const alamat = (cells[13]?.textContent ?? "").trim()
        const tglUkur = (cells[14]?.textContent ?? "").trim()
        const bbU = (cells[15]?.textContent ?? "").trim()
        const tbU = (cells[16]?.textContent ?? "").trim()
        const bbTb = (cells[17]?.textContent ?? "").trim()

        rows.push({
          nama_balita: nama,
          jenis_kelamin: jk,
          tanggal_lahir: tglLahir,
          alamat,
          tanggal_ukur: tglUkur,
          bb_u: bbU,
          tb_u: tbU,
          bb_tb: bbTb,
        })
      }

      if (rows.length === 0) { toast.error("Tidak ada data balita ditemukan dalam file"); return }

      setParsedRows(rows)
    } catch {
      toast.error("Gagal membaca file")
    }
  }

  async function handlePreview() {
    if (parsedRows.length === 0) { toast.error("File kosong atau format tidak valid"); return }
    if (parsedRows.length > MAX_ROWS) { toast.error(`Maksimal ${MAX_ROWS} baris per import`); return }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/master/balita/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posyanduId, rows: parsedRows, previewOnly: true }),
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
    if (parsedRows.length > MAX_ROWS) { toast.error(`Maksimal ${MAX_ROWS} baris per import`); return }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/master/balita/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posyanduId, rows: parsedRows }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? data.message); return }
      setResults(data.data.results)
      setStep("done")
      toast.success(`${data.data.imported} balita berhasil diimport`)
      onSuccess?.()
    } finally {
      setLoading(false)
    }
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
            <h2 className="font-bold text-base text-foreground">Import Balita dari Excel</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload file .xls hasil export SIGIZI — Posyandu: <strong>{posyanduName}</strong>
            </p>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-4 py-3">
            <div>
              <p className="text-xs font-bold text-foreground">Format File</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                File .xls hasil export SIGIZI Terpadu (HTML table) — kolom NIK, Nama, JK, Tgl Lahir, Tanggal Ukur, BB/U, TB/U, BB/TB
              </p>
            </div>
            <Button variant="outline" size="sm" disabled className="font-bold text-xs gap-1.5 opacity-50">
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
          </div>

          {step === "upload" && (
            <div>
              <input ref={fileRef} type="file" accept=".xls" onChange={handleFileChange} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
              >
                <Upload className="w-8 h-8 opacity-50" />
                <p className="text-sm font-semibold">{fileName || "Klik untuk upload file Excel (.xls)"}</p>
                {parsedRows.length > 0 && (
                  <p className="text-xs text-primary font-bold">{parsedRows.length} balita ditemukan</p>
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
                  {skippedCount} balita sudah ada di sistem — akan dilewati.
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
                  {validCount} balita baru diimport{skippedCount > 0 ? `, ${skippedCount} dilewati (sudah ada)` : ""}.
                </div>
              )}
            </div>
          )}

          {step === "upload" && parsedRows.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-4 py-3 text-xs">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">{fileName}</span>
              <span className="text-muted-foreground">— {parsedRows.length} balita</span>
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
