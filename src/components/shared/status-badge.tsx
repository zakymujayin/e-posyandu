import { cn } from "@/lib/utils"
import { MESSAGES } from "@/lib/messages"
import type { PengajuanStatus } from "@/lib/messages"

interface StatusBadgeProps {
  status: PengajuanStatus
  className?: string
}

const STATUS_STYLING: Record<
  PengajuanStatus,
  { container: string; dot: string }
> = {
  MENUNGGU_VERIFIKASI: {
    container: "bg-gradient-to-b from-amber-500/10 to-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.7)]",
    dot: "bg-gradient-to-b from-amber-400 to-amber-600 shadow-[inset_0_1px_rgba(255,255,255,0.8),0_0_8px_rgba(245,158,11,0.5)] animate-pulse",
  },
  DALAM_PROSES_OPD: {
    container: "bg-gradient-to-b from-sky-500/10 to-sky-500/5 text-sky-700 dark:text-sky-400 border-sky-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.7)]",
    dot: "bg-gradient-to-b from-sky-400 to-sky-600 shadow-[inset_0_1px_rgba(255,255,255,0.8),0_0_8px_rgba(14,165,233,0.5)]",
  },
  DALAM_PROSES_KECAMATAN: {
    container: "bg-gradient-to-b from-violet-500/10 to-violet-500/5 text-violet-700 dark:text-violet-400 border-violet-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.7)]",
    dot: "bg-gradient-to-b from-violet-400 to-violet-600 shadow-[inset_0_1px_rgba(255,255,255,0.8),0_0_8px_rgba(139,92,246,0.5)]",
  },
  MENUNGGU_APPROVAL_DPMD: {
    container: "bg-gradient-to-b from-orange-500/10 to-orange-500/5 text-orange-700 dark:text-orange-400 border-orange-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.7)]",
    dot: "bg-gradient-to-b from-orange-400 to-orange-600 shadow-[inset_0_1px_rgba(255,255,255,0.8),0_0_8px_rgba(249,115,22,0.5)]",
  },
  SELESAI: {
    container: "bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.7)]",
    dot: "bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[inset_0_1px_rgba(255,255,255,0.8),0_0_8px_rgba(16,185,129,0.5)]",
  },
  DITOLAK_DESA: {
    container: "bg-gradient-to-b from-rose-500/10 to-rose-500/5 text-rose-700 dark:text-rose-400 border-rose-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.7)]",
    dot: "bg-gradient-to-b from-rose-400 to-rose-600 shadow-[inset_0_1px_rgba(255,255,255,0.8),0_0_8px_rgba(244,63,94,0.5)]",
  },
  DITOLAK_OPD: {
    container: "bg-gradient-to-b from-rose-500/10 to-rose-500/5 text-rose-700 dark:text-rose-400 border-rose-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.7)]",
    dot: "bg-gradient-to-b from-rose-400 to-rose-600 shadow-[inset_0_1px_rgba(255,255,255,0.8),0_0_8px_rgba(244,63,94,0.5)]",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLING[status] ?? {
    container: "bg-gradient-to-b from-muted to-muted/50 text-muted-foreground border-border shadow-[inset_0_1px_rgba(255,255,255,0.7)]",
    dot: "bg-gradient-to-b from-muted-foreground/80 to-muted-foreground shadow-[inset_0_1px_rgba(255,255,255,0.5)]",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border sm:tracking-wide shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
        style.container,
        className
      )}
    >
      <span className={cn("size-1 rounded-full shrink-0", style.dot)} />
      {MESSAGES.status[status]}
    </span>
  )
}