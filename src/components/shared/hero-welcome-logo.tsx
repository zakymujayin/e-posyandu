"use client"

import { useLogoUrl } from "@/lib/app-context"

export function HeroWelcomeLogo() {
  const logoUrl = useLogoUrl()

  return (
    <div className="size-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
      ) : (
        <span className="text-white/60 font-bold text-xl">E</span>
      )}
    </div>
  )
}
