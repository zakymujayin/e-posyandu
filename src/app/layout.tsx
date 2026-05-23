import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { inter, dmSerifDisplay, plusJakartaSans } from "@/lib/fonts"

export const metadata: Metadata = {
  title: "E-Posyandu — DPMD Kabupaten Lebak",
  description: "Sistem Tatakelola Posyandu & Pengaduan Masyarakat Online",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${dmSerifDisplay.variable} ${plusJakartaSans.variable}`}
    >
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:text-sm focus:font-bold"
        >
          Langsung ke konten
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  )
}