import { cn } from "@/lib/utils"
import { MESSAGES } from "@/lib/messages"
import type { PengajuanStatus } from "@/lib/messages"

interface StatusBadgeProps {
  status: PengajuanStatus
  className?: string
}

const BADGE_COLORS: Record<PengajuanStatus, string> = {
  MENUNGGU_VERIFIKASI: "bg-yellow-100 text-yellow-800",
  DALAM_PROSES_OPD: "bg-blue-100 text-blue-800",
  MENUNGGU_APPROVAL_DPMD: "bg-orange-100 text-orange-800",
  SELESAI: "bg-green-100 text-green-800",
  DITOLAK_DESA: "bg-red-100 text-red-800",
  DITOLAK_OPD: "bg-red-100 text-red-800",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        BADGE_COLORS[status],
        className
      )}
    >
      {MESSAGES.status[status]}
    </span>
  )
}