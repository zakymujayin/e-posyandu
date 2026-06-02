import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PosyanduIllustration } from "./posyandu-illustration"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-50 pt-16 pb-20 lg:pt-24 lg:pb-28">
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none opacity-15"
        style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full pointer-events-none opacity-10"
        style={{ background: "radial-gradient(circle, #1d4ed8 0%, transparent 70%)" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="max-w-lg">
            <div className="hero-fade inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-md mb-6">
              <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
              Sistem Digital Posyandu Kabupaten Lebak
            </div>

            <h1
              className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900 mb-5 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Layanan Posyandu Kabupaten Lebak,{" "}
              <span className="text-blue-700">Kini Lebih Mudah</span>{" "}
              &amp;{" "}
              <span className="text-blue-500">Transparan</span>
            </h1>

            <div className="hero-fade-d1">
              <div className="border-l-2 border-blue-300 pl-3 mb-4">
                <p className="text-sm text-slate-500 italic">
                  &ldquo;Posyandu Maju, Layanan Prima, Masyarakat Sejahtera&rdquo;
                </p>
              </div>
              <p className="text-[15px] text-slate-600 leading-relaxed mb-8">
                Portal terpadu pengajuan layanan, verifikasi, dan tindaklanjut untuk kader posyandu,
                perangkat desa, dan OPD Kabupaten Lebak.
              </p>
            </div>

            <div className="hero-fade-d3 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold min-h-[48px] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 gap-2"
              >
                <Link href="/login">
                  Masuk ke Sistem
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold min-h-[48px] rounded-xl gap-2"
              >
                <a href="#cek-tiket">
                  <Search className="size-4" />
                  Cek Status Tiket
                </a>
              </Button>
            </div>
          </div>

          <div className="hero-fade-d2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
              <PosyanduIllustration className="relative w-full h-auto drop-shadow-xl rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
