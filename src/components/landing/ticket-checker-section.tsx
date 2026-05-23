"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TicketCheckerSection() {
  const [ticket, setTicket] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = ticket.trim().toUpperCase()
    if (!trimmed) {
      setError("Nomor tiket tidak boleh kosong")
      return
    }
    router.push(`/tracking?ticket=${encodeURIComponent(trimmed)}`)
  }

  return (
    <section id="cek-tiket" className="bg-blue-600 py-16 lg:py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-500/40 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-blue-700/40 pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <div className="size-16 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
          <Ticket className="size-8 text-white" />
        </div>
        <h2
          className="text-3xl sm:text-4xl font-bold text-white mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Sudah Punya Nomor Tiket?
        </h2>
        <p className="text-blue-100 text-[14px] mb-8 leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
          Masukkan nomor tiket yang diberikan oleh kader posyandu untuk melihat status pengajuan Anda tanpa perlu login.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <div className="flex-1">
            <Input
              value={ticket}
              onChange={(e) => { setTicket(e.target.value); setError("") }}
              placeholder="Contoh: TKT-2025-001234"
              className="bg-white/95 border-white/20 text-slate-800 placeholder:text-slate-400 rounded-xl h-12 text-[14px] font-medium focus:ring-2 focus:ring-white/50"
            />
            {error && (
              <p className="text-blue-200 text-xs mt-1.5 text-left font-medium">{error}</p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            className="bg-white text-blue-700 hover:bg-blue-50 font-bold min-h-[48px] rounded-xl shadow-md gap-2 shrink-0"
          >
            <Search className="size-4" />
            Cek Status
          </Button>
        </form>
      </div>
    </section>
  )
}
