import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Heart, Activity, Calendar, ShieldCheck, UserCircle } from "lucide-react"

interface HeroWelcomeProps {
  userName: string
  roleLabel: string
  description?: string
}

export function HeroWelcome({ userName, roleLabel, description }: HeroWelcomeProps) {
  const now = new Date()
  const dayName = format(now, "EEEE", { locale: localeId })
  const dayNum = format(now, "d")
  const monthYear = format(now, "MMMM yyyy", { locale: localeId })

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-6 md:p-8 shadow-[0_8px_30px_rgba(37,99,235,0.12)] border border-primary/20 select-none mb-6">
      {/* Decorative Vectors/Blobs inside the Hero card */}
      <div className="absolute right-[-20px] top-[-20px] w-64 h-64 rounded-full bg-white/[0.03] blur-2xl pointer-events-none" />
      <div className="absolute left-[30%] bottom-[-50px] w-48 h-48 rounded-full bg-indigo-500/[0.1] blur-2xl pointer-events-none" />
      
      {/* Brand Identity Background Icons */}
      <Heart className="absolute right-12 bottom-[-20px] size-40 text-white/5 rotate-12 stroke-[1.5] pointer-events-none" />
      <Activity className="absolute right-40 top-[-20px] size-32 text-white/5 -rotate-12 stroke-[1.5] pointer-events-none" />

      {/* Main Layout Grid */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        
        {/* Left Side Content */}
        <div className="space-y-3 max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/12 text-white border border-white/10 backdrop-blur-xs">
            <ShieldCheck className="size-3.5 text-blue-200 fill-blue-200/10" />
            <span>Portal Layanan Terpadu</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-[18px] md:text-[28px] font-extrabold tracking-tight leading-tight">
              Selamat datang kembali, {userName}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-blue-50 text-[12px] font-bold shadow-sm">
              <UserCircle className="size-3.5 opacity-80" />
              <span className="tracking-wide">Akses: {roleLabel}</span>
            </div>
          </div>

          <p className="text-[14px] text-blue-50/90 leading-relaxed font-medium">
            {description || "Pantau layanan Posyandu, verifikasi data, dan kelola pengajuan masyarakat hari ini."}
          </p>
        </div>

        {/* Right Side Date Widget */}
        <div className="shrink-0 flex items-center gap-4 bg-white/10 border border-white/12 backdrop-blur-md rounded-2xl p-4 md:p-5 text-center min-w-[150px] shadow-inner">
          <Calendar className="size-8 text-blue-200 stroke-[1.5] hidden sm:block" />
          <div className="text-left">
            <p className="text-[12px] font-bold text-blue-200 uppercase tracking-wider leading-none">
              Hari ini
            </p>
            <p className="text-[18px] font-extrabold tracking-tight mt-1 leading-none">
              {dayName}
            </p>
            <p className="text-[12px] font-medium text-blue-100 mt-1 leading-none">
              {dayNum} {monthYear}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
