"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Upload, Download, X, CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ParsedRow {
  [key: string]: string
}

interface ImportResult {
  row: number
  status: "ok" | "error"
  name: string
  message?: string
}

interface MasterCsvImportProps {
  title: string
  description: string
  apiEndpoint: string
  templateHeaders: string[]
  templateExample: string[]
  templateFilename: string
  onClose: () => void
  onSuccess?: () => void
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim())
    const row: ParsedRow = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? "" })
    return row
  })
}

function downloadTemplate(headers: string[], example: string[], filename: string) {
  const csv = [headers.join(","), example.join(",")].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function MasterCsvImport(props: MasterCsvImportProps) {
  const { title, description, apiEndpoint, templateHeaders, templateExample, templateFilename, onClose } = props
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState("")
  const [results, setResults] = useState<ImportResult[] | null>(null)
  const [previewResults, setPreviewResults] = useState<ImportResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload")
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setPreviewResults(null)
    setResults(null)
    setStep("upload")
    const reader = new FileReader()
    reader.onload = (ev) => {
      setParsedRows(parseCsv(ev.target?.result as string))
    }
    reader.readAsText(file)
  }

  async function handlePreview() {
    if (parsedRows.length === 0) { toast.error("File CSV kosong atau format tidak valid"); return }
    setLoading(true)
    try {
      const res = await fetch(apiEndpoint, {
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
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? data.message); return }
      setResults(data.data.results)
      setStep("done")
      toast.success(`${data.data.imported} data berhasil diimport`)
      props.onSuccess?.()
    } finally {
      setLoading(false)
    }
  }

  const displayResults = results ?? previewResults
  const validCount = displayResults?.filter((r) => r.status === "ok").length ?? 0
  const errorCount = displayResults?.filter((r) => r.status === "error").length ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-base text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Download Template */}
          <div className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-4 py-3">
            <div>
              <p className="text-xs font-bold text-foreground">Template CSV</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Kolom: {templateHeaders.join(", ")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate(templateHeaders, templateExample, templateFilename)}
              className="font-bold text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
          </div>

          {/* Upload File */}
          {step === "upload" && (
            <div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Upload className="w-8 h-8 opacity-50" />
                <p className="text-sm font-semibold">{fileName || "Klik untuk upload file CSV"}</p>
                {parsedRows.length > 0 && (
                  <p className="text-xs text-primary font-bold">{parsedRows.length} baris ditemukan</p>
                )}
              </button>
            </div>
          )}

          {/* Preview / Done Results */}
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

              {errorCount > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-foreground">Detail Error:</p>
                  {displayResults.filter((r) => r.status === "error").map((r) => (
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
                  {validCount} data berhasil diimport ke sistem.
                </div>
              )}
            </div>
          )}

          {/* File info after upload */}
          {step === "upload" && parsedRows.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-4 py-3 text-xs">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">{fileName}</span>
              <span className="text-muted-foreground">— {parsedRows.length} baris</span>
            </div>
          )}
        </div>

        {/* Footer */}
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
