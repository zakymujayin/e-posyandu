/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { Building2 } from "lucide-react"

interface Props {
  logoUrl?: string | null
}

export function FooterSection({ logoUrl }: Props) {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
          {/* Left: branding */}
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo E-Posyandu"
                    className="w-full h-full object-contain p-1"
                    loading="lazy"
                    decoding="async"
                    width={36}
                    height={36}
                  />
                ) : (
                  <Building2 className="size-5 text-slate-400" />
                )}
              </div>
              <div className="leading-none">
                <span className="block text-[15px] font-bold text-white">E-Posyandu</span>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Kabupaten Lebak</span>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-500">
              Dinas Pemberdayaan Masyarakat dan Desa (DPMD) Kabupaten Lebak, Banten.
            </p>
            <p className="text-sm text-amber-200/80 italic mt-2">
              Posyandu maju, layanan prima, masyarakat sejahtera, Lebak ruhay
            </p>
          </div>

          {/* Right: links */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Tautan Cepat
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/login"
                  className="text-[13px] text-slate-400 hover:text-white transition-colors"
                >
                  Masuk ke Sistem
                </Link>
              </li>
              <li>
                <a
                  href="#cek-tiket"
                  className="text-[13px] text-slate-400 hover:text-white transition-colors"
                >
                  Cek Status Tiket
                </a>
              </li>
              <li>
                <Link
                  href="/tracking"
                  className="text-[13px] text-slate-400 hover:text-white transition-colors"
                >
                  Halaman Pelacakan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[12px] text-slate-600">
            &copy; {year} DPMD Kabupaten Lebak. Hak cipta dilindungi.
          </p>
          <p className="text-[11px] text-slate-700">
            E-Posyandu — Sistem Tatakelola Posyandu &amp; Pengaduan Masyarakat Online
          </p>
        </div>
      </div>
    </footer>
  )
}
