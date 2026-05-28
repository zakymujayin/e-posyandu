"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Clock, Building2, User, CalendarRange, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/shared/status-badge"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import type { PengajuanStatus } from "@/lib/messages"

interface TrackingResult {
  tiketNumber: string
  namaPelapor: string
  status: string
  submittedAt: string
  opd: { name: string } | null
  layananJenis: { name: string } | null
  kategori?: string | null
  desa: { name: string }
  activityLogs: {
    action: string
    createdAt: string
    userRole?: string | null
  }[]
}

export default function TrackingPage() {
  const [tiket, setTiket] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [notFound, setNotFound] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!tiket.trim()) return

    setLoading(true)
    setResult(null)
    setNotFound(false)

    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(tiket.trim().toUpperCase())}`)
      const json = await res.json()
      if (json.success) {
        setResult(json.data)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container max-w-5xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center font-black text-white text-base shadow-md shadow-primary/20">
              eP
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-foreground block">e-Posyandu</span>
              <span className="block text-[9px] text-muted-foreground font-bold -mt-1 uppercase tracking-wider">DPMD KAB. LEBAK</span>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl font-bold text-xs shadow-xs hover:bg-muted/40 transition-colors">
            <Link href="/login">Portal Petugas &rarr;</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A2540] to-[#04101D] dark:from-[#05111F] dark:to-background text-white py-16 px-4 border-b border-border/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent opacity-70" />
        
        <div className="relative max-w-2xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25 uppercase tracking-wider">
            Layanan Publik Resmi
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Lacak Status Pengajuan
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
            Masukkan nomor tiket resmi yang diberikan oleh Kader Posyandu untuk memantau status persetujuan berkas pelayanan secara real-time.
          </p>
        </div>
      </section>

      {/* Main Form and Results Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto -mt-8 px-4 pb-24 space-y-6 relative z-10">
        {/* Search Panel Card */}
        <div className="bg-card border border-border/80 rounded-2xl shadow-xl p-5 md:p-6 space-y-5">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
              <Input
                value={tiket}
                onChange={(e) => setTiket(e.target.value)}
                placeholder="Contoh: DINKES-2026-0001"
                className="pl-11 min-h-[48px] rounded-xl border border-border uppercase font-semibold bg-background text-xs md:text-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 transition-all"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[48px] px-6 rounded-xl font-bold text-xs gap-1.5 shadow-xs">
              {loading ? (
                <>
                  <Clock className="size-4 animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  <Search className="size-3.5" />
                  Cari Tiket
                </>
              )}
            </Button>
          </form>

          {/* Not Found alert */}
          {notFound && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Berkas Tidak Ditemukan</AlertTitle>
              <AlertDescription>
                Nomor tiket tidak terdaftar di sistem. Mohon periksa kembali kesesuaian karakter, tanda baca slash (/), dan angka yang dimasukkan.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Result Details & Timeline Panel */}
        {result && (
          <div className="bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
            {/* Header info */}
            <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Nomor Registrasi Tiket</span>
                <span className="font-mono font-extrabold text-base md:text-lg text-foreground tracking-wide">{result.tiketNumber}</span>
              </div>
              <StatusBadge status={result.status as PengajuanStatus} className="self-start sm:self-center" />
            </div>

            {/* Structured Card Grid */}
            <div className="p-5 md:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/20">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest">OPD Penerima</span>
                    <span className="text-xs md:text-sm font-bold text-foreground block mt-0.5">{result.opd?.name ?? "Layanan Desa"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/20">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Kategori Layanan</span>
                    <span className="text-xs md:text-sm font-bold text-foreground block mt-0.5">
                      {result.kategori === "PERMOHONAN" ? (result.layananJenis?.name ?? "-") : "Pengaduan"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/20">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                    <User className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Nama Pelapor / PMT</span>
                    <span className="text-xs md:text-sm font-semibold text-foreground block mt-0.5">{result.namaPelapor}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/20">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                    <CalendarRange className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tanggal Pendaftaran</span>
                    <span className="text-xs md:text-sm font-semibold text-foreground block mt-0.5">
                      {format(new Date(result.submittedAt), "dd MMMM yyyy", { locale: localeId })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Timeline */}
              {result.activityLogs.length > 0 && (
                <div className="border-t border-border/50 pt-6 space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Timeline & Riwayat Peninjauan
                  </h4>
                  <div className="relative pl-6 border-l border-border/80 ml-3 space-y-6">
                    {result.activityLogs.map((log, i) => {
                      const isLatest = i === result.activityLogs.length - 1
                      return (
                        <div key={i} className="relative group">
                          {/* Point indicator */}
                          <div className={`absolute -left-[32px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center transition-all ${
                            isLatest 
                              ? "border-emerald-500 ring-4 ring-emerald-500/20 text-emerald-500" 
                              : "border-muted-foreground/45 text-muted-foreground/60"
                          }`}>
                            <div className={`size-1.5 rounded-full ${isLatest ? "bg-emerald-500" : "bg-muted-foreground/60"}`} />
                          </div>

                          {/* Log description */}
                          <div className="space-y-1">
                            <p className={`text-xs md:text-sm font-bold leading-none ${isLatest ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-foreground/80"}`}>
                              {log.action}
                            </p>
                            <span className="block text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wide">
                              {format(new Date(log.createdAt), "d MMMM yyyy, HH:mm", { locale: localeId })} 
                              {log.userRole && ` • VERIFIKATOR: ${log.userRole.replace("_", " ")}`}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer footer info */}
      <footer className="border-t border-border/30 bg-muted/10 py-6 text-center mt-auto">
        <p className="text-[10px] md:text-xs text-muted-foreground/75 font-semibold tracking-wider">
          © {new Date().getFullYear()} DINAS PEMBERDAYAAN MASYARAKAT & DESA (DPMD) KABUPATEN LEBAK. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  )
}