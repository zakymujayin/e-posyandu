import { FileText, CheckCircle, ClipboardList, BarChart2 } from "lucide-react"
import { AnimateOnScroll } from "./animate-on-scroll"

const features = [
  {
    icon: FileText,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
    title: "Pengajuan Digital",
    description: "Kader ajukan layanan dan pengaduan langsung dari smartphone tanpa perlu ke kantor.",
  },
  {
    icon: CheckCircle,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    title: "Verifikasi Transparan",
    description: "Status pengajuan dapat dipantau secara real-time oleh semua pihak yang terlibat.",
  },
  {
    icon: ClipboardList,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    title: "Tindaklanjut Terstruktur",
    description: "OPD upload bukti penyelesaian dengan mekanisme SOP dan batas waktu yang ketat.",
  },
  {
    icon: BarChart2,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    title: "Laporan & Analitik",
    description: "Admin DPMD pantau seluruh data kinerja posyandu dalam satu dashboard terintegrasi.",
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimateOnScroll>
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3 block">
              Fitur Unggulan
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold text-slate-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Semua yang Anda Butuhkan,{" "}
              <span className="text-green-600">dalam Satu Sistem</span>
            </h2>
          </div>
        </AnimateOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <AnimateOnScroll key={f.title} delay={(i + 1) as 1 | 2 | 3 | 4}>
              <div className="group h-full bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className={`size-12 ${f.bg} ${f.border} border rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={`size-6 ${f.color}`} />
                </div>
                <h3
                  className="text-[15px] font-bold text-slate-800 mb-2"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {f.title}
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
                  {f.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
