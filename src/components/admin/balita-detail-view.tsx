"use client"

import { useEffect, useState } from "react"
import { format, differenceInMonths } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Scale, Syringe, CheckCircle2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const BULAN_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

interface Penimbangan {
  id: string
  bulan: number
  tahun: number
  beratBadan: number | null
  tinggiBadan: number | null
  lingkarKepala: number | null
  statusGizi: string | null
  keluhanKondisi: string | null
  tindakan: string | null
  namaKader: string | null
}

interface Imunisasi {
  id: string
  jenisImunisasi: string
  tanggalPemberian: string
  usiaAnak: string | null
  namaPetugas: string | null
  keterangan: string | null
}

interface BalitaData {
  id: string
  namaBalita: string
  jenisKelamin: string
  tanggalLahir: string
  namaOrangTua: string
  nikOrangTua: string | null
  noHpOrangTua: string | null
  alamat: string | null
  catatanKesehatan: string | null
  penimbangans: Penimbangan[]
  imunisasis: Imunisasi[]
}

export function BalitaDetailView({ balitaId }: { balitaId: string }) {
  const [balita, setBalita] = useState<BalitaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<"penimbangan" | "imunisasi">("penimbangan")
  const [tahun, setTahun] = useState(new Date().getFullYear())

  useEffect(() => {
    fetch(`/api/balita/${balitaId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setBalita(d.data)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [balitaId])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  if (error || !balita) return <p className="text-center py-20 text-destructive">Gagal memuat data balita</p>

  const now = new Date()
  const penimbanganTahunIni = balita.penimbangans.filter((p) => p.tahun === tahun)

  function penimbanganForBulan(bulan: number) {
    return penimbanganTahunIni.find((p) => p.bulan === bulan)
  }

  function isFutureBulan(bulan: number) {
    return tahun > now.getFullYear() || (tahun === now.getFullYear() && bulan > now.getMonth() + 1)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Nama Orang Tua / Wali</p>
          <p className="font-semibold mt-0.5">{balita.namaOrangTua}</p>
        </div>
        {balita.nikOrangTua && (
          <div>
            <p className="text-xs text-muted-foreground">NIK</p>
            <p className="font-semibold mt-0.5 font-mono">{balita.nikOrangTua}</p>
          </div>
        )}
        {balita.noHpOrangTua && (
          <div>
            <p className="text-xs text-muted-foreground">No. HP</p>
            <p className="font-semibold mt-0.5">{balita.noHpOrangTua}</p>
          </div>
        )}
        {balita.alamat && (
          <div>
            <p className="text-xs text-muted-foreground">Alamat</p>
            <p className="font-semibold mt-0.5">{balita.alamat}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <p className="text-xs font-bold text-foreground">Catatan Kesehatan</p>
        <p className="text-sm text-muted-foreground">{balita.catatanKesehatan || "—"}</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border">
          {([{ key: "penimbangan", label: "Penimbangan Bulanan", icon: Scale }, { key: "imunisasi", label: "Riwayat Imunisasi", icon: Syringe }] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === key ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "penimbangan" && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setTahun((y) => y - 1)} className="px-2 py-1 rounded border border-border text-xs hover:bg-muted/40">‹</button>
              <span className="text-sm font-bold w-16 text-center">{tahun}</span>
              <button onClick={() => setTahun((y) => y + 1)} disabled={tahun >= now.getFullYear()} className="px-2 py-1 rounded border border-border text-xs hover:bg-muted/40 disabled:opacity-30">›</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {BULAN_NAMES.map((name, i) => {
                const bulan = i + 1
                const data = penimbanganForBulan(bulan)
                const isFuture = isFutureBulan(bulan)
                return (
                  <div key={bulan} className={`rounded-lg border p-3 text-xs space-y-1 ${
                    isFuture ? "border-border/50 bg-muted/20 opacity-40" : data ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{name}</span>
                    </div>
                    {data ? (
                      <>
                        {data.beratBadan && <p className="text-emerald-700 font-bold">{data.beratBadan} kg</p>}
                        {data.tinggiBadan && <p className="text-muted-foreground">{data.tinggiBadan} cm</p>}
                        {data.statusGizi && <Badge variant="outline" className="text-[10px] px-1 py-0">{data.statusGizi}</Badge>}
                      </>
                    ) : isFuture ? (
                      <p className="text-muted-foreground">—</p>
                    ) : (
                      <p className="text-muted-foreground">Belum dicatat</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === "imunisasi" && (
          <div className="p-5 space-y-4">
            {balita.imunisasis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada data imunisasi.</p>
            ) : (
              <div className="space-y-2">
                {balita.imunisasis.map((im) => (
                  <div key={im.id} className="flex items-start gap-3 rounded-lg border border-border px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{im.jenisImunisasi}</p>
                        {im.usiaAnak && <Badge variant="outline" className="text-[10px]">{im.usiaAnak}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(im.tanggalPemberian), "d MMMM yyyy", { locale: localeId })}
                        {im.namaPetugas && ` · ${im.namaPetugas}`}
                      </p>
                      {im.keterangan && <p className="text-xs text-muted-foreground mt-0.5">{im.keterangan}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
