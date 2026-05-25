"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LaporanBalitaExport({ kecId, desaId, posyanduId }: { kecId?: string; desaId?: string; posyanduId?: string }) {
  function handleExportCsv() {
    const params = new URLSearchParams()
    if (kecId) params.set("kecId", kecId)
    if (desaId) params.set("desaId", desaId)
    if (posyanduId) params.set("posyanduId", posyanduId)
    const qs = params.toString()
    window.open(`/api/admin/laporan/balita/export${qs ? `?${qs}` : ""}`, "_blank")
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handleExportCsv} className="font-bold text-xs gap-1.5">
        <Download className="w-3.5 h-3.5" />
        Export CSV
      </Button>
    </div>
  )
}
