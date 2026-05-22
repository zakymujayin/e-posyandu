"use client"

import { useRouter } from "next/navigation"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"

interface Opd {
  id: string
  name: string
}

interface Props {
  opds: Opd[]
  current: { dari?: string; sampai?: string; opdId?: string }
}

export function LaporanFilter({ opds, current }: Props) {
  const router = useRouter()
  const dariRef = useRef<HTMLInputElement>(null)
  const sampaiRef = useRef<HTMLInputElement>(null)
  const opdRef = useRef<HTMLSelectElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (dariRef.current?.value) params.set("dari", dariRef.current.value)
    if (sampaiRef.current?.value) params.set("sampai", sampaiRef.current.value)
    if (opdRef.current?.value) params.set("opdId", opdRef.current.value)
    const qs = params.toString()
    router.push("/admin/laporan" + (qs ? "?" + qs : ""))
  }

  const inputClass = "min-h-[42px] rounded-lg border border-border bg-background px-3 text-xs md:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-muted/40 transition-all cursor-pointer w-full"

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-x-4 gap-y-3"
    >
      <div className="flex items-center gap-2 sm:gap-0 w-full sm:w-auto">
        <SlidersHorizontal className="size-4 text-muted-foreground shrink-0 hidden sm:block" />
      </div>

      <label className="flex items-center gap-2 w-full sm:w-auto shrink-0 cursor-pointer">
        <span className="text-[13px] font-semibold text-muted-foreground whitespace-nowrap">Dari</span>
        <input
          ref={dariRef}
          type="date"
          defaultValue={current.dari ?? ""}
          className={`${inputClass} flex-1 sm:w-36 md:w-40`}
        />
      </label>

      <label className="flex items-center gap-2 w-full sm:w-auto shrink-0 cursor-pointer">
        <span className="text-[13px] font-semibold text-muted-foreground whitespace-nowrap">Sampai</span>
        <input
          ref={sampaiRef}
          type="date"
          defaultValue={current.sampai ?? ""}
          className={`${inputClass} flex-1 sm:w-36 md:w-40`}
        />
      </label>

      <label className="flex items-center gap-2 w-full sm:w-auto shrink-0 cursor-pointer">
        <span className="text-[13px] font-semibold text-muted-foreground whitespace-nowrap">OPD</span>
        <select
          ref={opdRef}
          defaultValue={current.opdId ?? ""}
          className={`${inputClass} flex-1 sm:w-40 md:w-48`}
        >
          <option value="">Semua OPD</option>
          {opds.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button type="submit" size="sm" className="font-bold text-xs md:text-sm flex-1 sm:flex-none">
          Terapkan
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="font-bold text-xs md:text-sm text-muted-foreground flex-1 sm:flex-none"
          onClick={() => router.push("/admin/laporan")}
        >
          Reset
        </Button>
      </div>
    </form>
  )
}
