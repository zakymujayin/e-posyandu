import Image from "next/image"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { UserCircle, Heart } from "lucide-react"
import { HeroWelcomeLogo } from "./hero-welcome-logo"

interface HeroWelcomeProps {
  userName: string
  roleLabel: string
  description?: string
}

export function HeroWelcome({ userName, roleLabel, description }: HeroWelcomeProps) {
  const now = new Date()
  const dateStr = format(now, "EEEE, d MMMM yyyy", { locale: localeId })

  return (
    <div className="relative rounded-lg bg-gradient-to-br from-primary via-primary to-primary/75 text-primary-foreground p-5 md:p-6 lg:p-7 shadow-[0_8px_30px_rgba(37,99,235,0.12)] border border-primary/20 mb-5 mt-10">
      {/* Decorative elements — clipped to border-radius */}
      <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:18px_18px]" />

        <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-white/[0.04] blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-56 h-56 rounded-full bg-indigo-500/[0.08] blur-3xl" />

        <Heart className="absolute right-12 -bottom-4 size-36 text-white/5 rotate-12 stroke-[1.5]" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-5">
        <HeroWelcomeLogo />

        {/* Greeting + Role + Description */}
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] md:text-lg font-bold tracking-tight leading-tight">
            Selamat datang, {userName}
          </h1>
          <div className="inline-flex items-center gap-1.5 mt-1.5">
            <UserCircle className="size-4 text-blue-200/70" />
            <span className="text-[12px] md:text-[13px] font-semibold text-blue-100/80 tracking-wide">
              {roleLabel}
            </span>
          </div>
          {description && (
            <p className="text-[13px] md:text-[14px] text-blue-50/70 font-medium leading-relaxed mt-2 max-w-2xl line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="shrink-0 sm:text-right self-start sm:self-center sm:mr-[120px] md:mr-[150px] lg:mr-[190px]">
          <p className="text-[10px] md:text-[11px] font-bold text-blue-200/70 uppercase tracking-wider leading-none">
            Hari ini
          </p>
          <p className="text-[13px] md:text-[14px] font-bold text-white leading-tight mt-0.5 whitespace-nowrap">
            {dateStr}
          </p>
        </div>
      </div>

      {/* Kader posyandu illustration — pops out from top-right */}
      <div
        className="absolute z-0 bottom-0 right-5 drop-shadow-2xl pointer-events-none select-none hidden sm:block w-[120px] md:w-[150px] lg:w-[190px] hover:animate-float-3d"
        aria-hidden="true"
      >
        <Image
          src="/images/kader-posyandu.webp"
          alt=""
          width={380}
          height={342}
          className="w-full h-auto"
          priority
        />
      </div>
    </div>
  )
}
