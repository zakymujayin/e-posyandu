"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { CheckCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { PageContainer } from "@/components/layout/page-container"
import { PageTitle, MutedText } from "@/components/ui/typography"

function SuksesContent() {
  const searchParams = useSearchParams()
  const tiket = searchParams.get("tiket") ?? ""

  function copyTiket() {
    navigator.clipboard.writeText(tiket)
    toast.success("Nomor tiket disalin")
  }

  return (
    <PageContainer className="max-w-md mx-auto text-center space-y-6 py-12">
      <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
      <div>
        <PageTitle>Pengajuan Berhasil Dikirim!</PageTitle>
        <MutedText className="mt-2">Nomor tiket pengajuan Anda:</MutedText>
      </div>

      <div className="bg-card border-2 border-border rounded-lg p-6 shadow-xs">
        <p className="text-3xl font-mono font-bold text-primary tracking-wider">{tiket}</p>
        <Button variant="outline" size="sm" onClick={copyTiket} className="mt-3">
          <Copy className="w-4 h-4 mr-2" /> Salin Nomor Tiket
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Berikan nomor tiket ini kepada masyarakat untuk melacak status pengajuan di halaman{" "}
        <Link href="/tracking" target="_blank" className="text-primary hover:underline">
          tracking publik
        </Link>.
      </p>

      <Button asChild className="w-full min-h-[44px]">
        <Link href="/posyandu">Kembali ke Beranda</Link>
      </Button>
    </PageContainer>
  )
}

export default function SuksesPage() {
  return (
    <Suspense fallback={null}>
      <SuksesContent />
    </Suspense>
  )
}
