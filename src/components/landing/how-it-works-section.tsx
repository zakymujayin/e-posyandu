import { Send, ShieldCheck, CheckSquare } from "lucide-react"
import { AnimateOnScroll } from "./animate-on-scroll"

const steps = [
  {
    number: "01",
    icon: Send,
    title: "Kader Ajukan",
    description: "Kader posyandu isi form pengajuan layanan atau laporkan pengaduan masyarakat langsung dari aplikasi.",
    color: "text-blue-700",
    bg: "bg-blue-700",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Desa Verifikasi",
    description: "Petugas desa meninjau, memverifikasi kelengkapan data, lalu meneruskan pengajuan ke OPD terkait.",
    color: "text-blue-600",
    bg: "bg-blue-600",
  },
  {
    number: "03",
    icon: CheckSquare,
    title: "OPD Tindaklanjut",
    description: "OPD menyelesaikan pengajuan sesuai SOP dan mengupload bukti penyelesaian sebagai dokumentasi.",
    color: "text-blue-500",
    bg: "bg-blue-500",
  },
]

export function HowItWorksSection() {
  return (
    <section className="bg-slate-50 py-20 lg:py-24 relative overflow-hidden">
      {/* Background dot pattern — biru */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, #2563eb 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <AnimateOnScroll>
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 block">
              Cara Kerja
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold text-slate-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Bagaimana Cara Kerjanya?
            </h2>
            <p className="text-[14px] text-slate-500 mt-3 max-w-lg mx-auto" style={{ fontFamily: "var(--font-jakarta)" }}>
              Proses sederhana tiga langkah dari pengajuan hingga penyelesaian
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600" />

          {steps.map((step, i) => (
            <AnimateOnScroll key={step.number} delay={(i + 1) as 1 | 2 | 3}>
              <div className="relative bg-white rounded-xl p-6 shadow-sm border border-slate-100 text-center">
                <div className={`size-14 ${step.bg} text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md relative z-10`}>
                  <step.icon className="size-7" />
                </div>
                <span className={`text-xs font-black ${step.color} tracking-widest block mb-2`}>
                  LANGKAH {step.number}
                </span>
                <h3
                  className="text-[16px] font-bold text-slate-800 mb-3"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {step.title}
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
                  {step.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
