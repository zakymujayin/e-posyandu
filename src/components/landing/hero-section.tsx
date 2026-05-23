import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PosyanduIllustration } from "./posyandu-illustration"
import { AnimateOnScroll } from "./animate-on-scroll"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-50 pt-16 pb-20 lg:pt-24 lg:pb-28">
      {/* Dot pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Green blob top-right */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none opacity-20"
        style={{ background: "radial-gradient(circle, #16a34a 0%, transparent 70%)" }}
      />
      {/* Blue blob bottom-left */}
      <div
        className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full pointer-events-none opacity-15"
        style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: teks */}
          <div className="max-w-lg">
            <AnimateOnScroll delay={0}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                Sistem Digital Posyandu Kabupaten Lebak
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={1}>
              {/* Heading */}
              <h1
                className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900 mb-5 tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Layanan Posyandu Lebak,{" "}
                <span className="text-green-600">Kini Lebih Mudah</span> &amp;{" "}
                <span className="text-blue-600">Transparan</span>
              </h1>
            </AnimateOnScroll>

            <AnimateOnScroll delay={2}>
              {/* Tagline */}
              <p className="text-base text-slate-500 italic mb-3" style={{ fontFamily: "var(--font-jakarta)" }}>
                &ldquo;Posyandu Maju, Layanan Prima, Masyarakat Sejahtera&rdquo;
              </p>
              {/* Deskripsi */}
              <p className="text-[15px] text-slate-600 leading-relaxed mb-8" style={{ fontFamily: "var(--font-jakarta)" }}>
                Portal terpadu pengajuan layanan, verifikasi, dan tindaklanjut untuk kader posyandu,
                perangkat desa, dan OPD Kabupaten Lebak.
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll delay={3}>
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold min-h-[48px] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 gap-2"
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
            </AnimateOnScroll>
          </div>

          {/* Right: ilustrasi */}
          <AnimateOnScroll delay={2} className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              {/* Card shadow dekoratif */}
              <div className="absolute inset-4 bg-green-100/50 rounded-3xl blur-2xl" />
              <PosyanduIllustration className="relative w-full h-auto drop-shadow-lg rounded-2xl" />
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  )
}
