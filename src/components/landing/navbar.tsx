/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  logoUrl?: string | null
}

export function LandingNavbar({ logoUrl }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo + nama */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo E-Posyandu"
                className="w-full h-full object-contain p-1"
                fetchPriority="high"
                width={36}
                height={36}
                decoding="async"
              />
            ) : (
              <Building2 className="size-5 text-blue-700" />
            )}
          </div>
          <div className="leading-none">
            <span className="block text-[15px] font-bold text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors">
              E-Posyandu
            </span>
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
              Kabupaten Lebak
            </span>
          </div>
        </Link>

        {/* CTA */}
        <Button asChild size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-semibold rounded-lg">
          <Link href="/login">Masuk</Link>
        </Button>
      </nav>
    </header>
  )
}
