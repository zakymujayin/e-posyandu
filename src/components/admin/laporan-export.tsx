"use client"

import { Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LaporanExport() {
  function handleExportCsv() {
    window.open("/api/admin/laporan/export", "_blank")
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handleExportCsv} className="font-bold text-xs gap-1.5">
        <Download className="w-3.5 h-3.5" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint} className="font-bold text-xs gap-1.5">
        <Printer className="w-3.5 h-3.5" />
        Cetak / PDF
      </Button>
    </div>
  )
}
