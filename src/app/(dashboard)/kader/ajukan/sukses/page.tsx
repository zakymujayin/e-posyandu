"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { CheckCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { PageContainer } from "@/components/layout/page-container"

function SuksesContent() {
  const searchParams = useSearchParams()
  const tiket = searchParams.get("tiket") ?? ""

  function copyTiket() {
    navigator.clipboard.writeText(tiket)
    toast.success("Nomor tiket disalin")
  }

  return (
    <PageContainer className="max-w-md mx-auto text-center space-y-6 py-12">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengajuan Berhasil Dikirim!</h1>
        <p className="text-gray-500 mt-2">Nomor tiket pengajuan Anda:</p>
      </div>

      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
        <p className="text-3xl font-mono font-bold text-blue-600 tracking-wider">{tiket}</p>
        <Button variant="outline" size="sm" onClick={copyTiket} className="mt-3">
          <Copy className="w-4 h-4 mr-2" /> Salin Nomor Tiket
        </Button>
      </div>

      <p className="text-sm text-gray-600">
        Berikan nomor tiket ini kepada masyarakat untuk melacak status pengajuan di halaman{" "}
        <Link href="/tracking" target="_blank" className="text-blue-600 hover:underline">
          tracking publik
        </Link>.
      </p>

      <Button asChild className="w-full min-h-[44px]">
        <Link href="/kader">Kembali ke Beranda</Link>
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
