"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, startTransition } from "react"
import { Loader2 } from "lucide-react"

interface Kecamatan { id: string; name: string }
interface Desa { id: string; name: string }
interface Posyandu { id: string; name: string }

export function LaporanBalitaFilters({
  role,
  kecamatans: initialKecamatans,
  desas: initialDesas,
  posyandus: initialPosyandus,
  defaultKecId,
  defaultDesaId,
}: {
  role: string
  kecamatans: Kecamatan[]
  desas: Desa[]
  posyandus: Posyandu[]
  defaultKecId?: string
  defaultDesaId?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const kecId = searchParams.get("kecId") ?? defaultKecId ?? ""
  const desaId = searchParams.get("desaId") ?? defaultDesaId ?? ""
  const posyanduId = searchParams.get("posyanduId") ?? ""

  const [desas, setDesas] = useState<Desa[]>(initialDesas)
  const [posyandus, setPosyandus] = useState<Posyandu[]>(initialPosyandus)
  const [loadingDesa, setLoadingDesa] = useState(false)
  const [loadingPosyandu, setLoadingPosyandu] = useState(false)

  useEffect(() => {
    if (!kecId && role === "ADMIN_DPMD") return
    startTransition(() => setLoadingDesa(true))
    const url = role === "ADMIN_DPMD"
      ? `/api/rekap/balita/desa-list?kecId=${kecId}`
      : `/api/rekap/balita/desa-list?kecId=${defaultKecId}`
    fetch(url).then(r => r.json()).then(d => { if (d.data) setDesas(d.data) }).catch(() => {}).finally(() => setLoadingDesa(false))
  }, [kecId, role, defaultKecId])

  useEffect(() => {
    if (!desaId) return
    startTransition(() => setLoadingPosyandu(true))
    fetch(`/api/rekap/balita/posyandu-list?desaId=${desaId}`)
      .then(r => r.json()).then(d => { if (d.data) setPosyandus(d.data) }).catch(() => {}).finally(() => setLoadingPosyandu(false))
  }, [desaId])

  const shownDesas = (!kecId && role === "ADMIN_DPMD") ? [] : desas
  const shownPosyandus = !desaId ? [] : posyandus

  function buildUrl(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v)
      else sp.delete(k)
    })
    return `?${sp.toString()}`
  }

  function handleChange(key: string, value: string) {
    const clear: Record<string, string> = {}
    if (key === "kecId") { clear.kecId = value; clear.desaId = ""; clear.posyanduId = "" }
    else if (key === "desaId") { clear.desaId = value; clear.posyanduId = "" }
    else if (key === "posyanduId") { clear.posyanduId = value }
    router.push(buildUrl(clear))
  }

  const selectClass = "w-full h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"

  return (
    <div className="flex flex-wrap items-end gap-3">
      {(role === "ADMIN_DPMD") && (
        <div className="w-full sm:w-auto min-w-[180px]">
          <label className="block text-xs text-muted-foreground mb-1 font-medium">Kecamatan</label>
          <select
            value={kecId}
            onChange={(e) => handleChange("kecId", e.target.value)}
            className={selectClass}
          >
            <option value="">Semua Kecamatan</option>
            {initialKecamatans.map((k) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>
        </div>
      )}

      {(role === "ADMIN_DPMD" || role === "PETUGAS_KECAMATAN") && (
        <div className="w-full sm:w-auto min-w-[180px]">
          <label className="block text-xs text-muted-foreground mb-1 font-medium">Desa / Kelurahan</label>
          <div className="relative">
            <select
              value={desaId}
              onChange={(e) => handleChange("desaId", e.target.value)}
              className={selectClass}
              disabled={loadingDesa && shownDesas.length === 0}
            >
              <option value="">Semua Desa</option>
              {shownDesas.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {loadingDesa && <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />}
          </div>
        </div>
      )}

      <div className="w-full sm:w-auto min-w-[180px]">
        <label className="block text-xs text-muted-foreground mb-1 font-medium">Posyandu</label>
        <div className="relative">
          <select
            value={posyanduId}
            onChange={(e) => handleChange("posyanduId", e.target.value)}
            className={selectClass}
              disabled={loadingPosyandu && shownPosyandus.length === 0}
          >
            <option value="">Semua Posyandu</option>
              {shownPosyandus.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {loadingPosyandu && <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />}
        </div>
      </div>
    </div>
  )
}
