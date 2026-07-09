"use client"

import Image from "next/image"
import { Heart } from "lucide-react"
import { useAppLogos } from "@/lib/app-context"

export function HeroWelcomeLogo() {
  const { kabupatenLogoUrl, posyanduLogoUrl } = useAppLogos()

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="size-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-sm overflow-hidden relative">
        {kabupatenLogoUrl ? (
          <Image src={kabupatenLogoUrl} alt="Logo Kabupaten" fill className="object-contain p-1" sizes="48px" priority unoptimized />
        ) : (
          <span className="text-white/60 font-bold text-xl">E</span>
        )}
      </div>
      <div className="size-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-sm overflow-hidden relative">
        {posyanduLogoUrl ? (
          <Image src={posyanduLogoUrl} alt="Logo Posyandu" fill className="object-contain p-1" sizes="48px" priority unoptimized />
        ) : (
          <Heart className="size-6 text-white/60" />
        )}
      </div>
    </div>
  )
}
