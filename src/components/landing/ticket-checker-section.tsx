import Link from "next/link"
import { Search, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TicketCheckerSection() {
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
          Gunakan nomor tiket yang diberikan oleh kader posyandu untuk melihat status pengajuan Anda tanpa perlu login.
        </p>

        <Button
          asChild
          size="lg"
          className="bg-white text-blue-700 hover:bg-blue-50 font-bold min-h-[48px] rounded-xl shadow-md gap-2"
        >
          <Link href="/tracking">
            <Search className="size-4" />
            Cek Status Tiket
          </Link>
        </Button>
      </div>
    </section>
  )
}
