"use client"

import { useState } from "react"
import { Search, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface TrackingResult {
  tiketNumber: string
  namaPelapor: string
  status: string
  submittedAt: string
  opd: { name: string }
  layananJenis: { name: string }
  desa: { name: string }
  activityLogs: {
    action: string
    createdAt: string
    userRole?: string | null
  }[]
}

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  DALAM_PROSES_OPD: "Dalam Proses OPD",
  MENUNGGU_APPROVAL_DPMD: "Menunggu Persetujuan DPMD",
  SELESAI: "Selesai",
  DITOLAK_DESA: "Ditolak Desa",
  DITOLAK_OPD: "Ditolak OPD",
}

const STATUS_COLOR: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "bg-yellow-100 text-yellow-800",
  DALAM_PROSES_OPD: "bg-blue-100 text-blue-800",
  MENUNGGU_APPROVAL_DPMD: "bg-orange-100 text-orange-800",
  SELESAI: "bg-green-100 text-green-800",
  DITOLAK_DESA: "bg-red-100 text-red-800",
  DITOLAK_OPD: "bg-red-100 text-red-800",
}

export default function TrackingPage() {
  const [tiket, setTiket] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [notFound, setNotFound] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!tiket.trim()) return

    setLoading(true)
    setResult(null)
    setNotFound(false)

    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(tiket.trim().toUpperCase())}`)
      const json = await res.json()
      if (json.success) {
        setResult(json.data)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">E-Posyandu</h1>
          <p className="text-sm text-gray-500">DPMD Kabupaten Lebak</p>
          <h2 className="text-xl font-semibold text-gray-800 mt-4">Lacak Status Pengajuan</h2>
          <p className="text-sm text-gray-600">
            Masukkan nomor tiket yang diberikan oleh kader posyandu
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={tiket}
            onChange={(e) => setTiket(e.target.value)}
            placeholder="Contoh: KES/2026/00001"
            className="flex-1 uppercase"
          />
          <Button type="submit" disabled={loading} className="min-h-[44px] px-6">
            {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </form>

        {/* Not Found */}
        {notFound && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 text-sm">
              Nomor tiket tidak ditemukan. Pastikan nomor tiket yang Anda masukkan sudah benar.
            </p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden space-y-0">
            {/* Info */}
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">Nomor Tiket</p>
                  <p className="font-mono font-bold text-lg text-gray-900">{result.tiketNumber}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLOR[result.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {STATUS_LABEL[result.status] ?? result.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">OPD Tujuan</p>
                  <p className="text-gray-900 font-medium">{result.opd.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Jenis Layanan</p>
                  <p className="text-gray-900">{result.layananJenis.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Nama Pelapor</p>
                  <p className="text-gray-900">{result.namaPelapor}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tanggal Pengajuan</p>
                  <p className="text-gray-900">
                    {format(new Date(result.submittedAt), "d MMM yyyy", { locale: localeId })}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {result.activityLogs.length > 0 && (
              <div className="border-t border-gray-100 p-5 space-y-3">
                <p className="text-sm font-semibold text-gray-900">Timeline Proses</p>
                <div className="space-y-3">
                  {result.activityLogs.map((log, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {i < result.activityLogs.length - 1 && (
                          <div className="w-px flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-2">
                        <p className="text-gray-900">{log.action}</p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(log.createdAt), "d MMM yyyy HH:mm", { locale: localeId })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}