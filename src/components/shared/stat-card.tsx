import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
  colorVariant?: "primary" | "secondary" | "accent" | "destructive"
}

const COLOR_VARIANTS = {
  primary: {
    cardBg: "bg-gradient-to-br from-white to-blue-50/80 border-blue-100 dark:from-slate-900 dark:to-blue-950/40 dark:border-blue-900/50",
    cardBorder: "hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-[0_8px_30px_rgba(37,99,235,0.15)]",
    iconBg: "bg-gradient-to-tr from-blue-500 to-blue-600 text-white shadow-[inset_0_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(37,99,235,0.2)]",
    watermark: "text-blue-600/[0.08] dark:text-blue-400/[0.05]",
    labelColor: "text-blue-700/90 dark:text-blue-300/90",
    descColor: "text-slate-500 dark:text-slate-400",
    valueColor: "text-slate-900 dark:text-white",
  },
  secondary: {
    cardBg: "bg-gradient-to-br from-white to-emerald-50/80 border-emerald-100 dark:from-slate-900 dark:to-emerald-950/40 dark:border-emerald-900/50",
    cardBorder: "hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]",
    iconBg: "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-[inset_0_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(16,185,129,0.2)]",
    watermark: "text-emerald-600/[0.08] dark:text-emerald-400/[0.05]",
    labelColor: "text-emerald-800/90 dark:text-emerald-300/90",
    descColor: "text-slate-500 dark:text-slate-400",
    valueColor: "text-slate-900 dark:text-white",
  },
  accent: {
    cardBg: "bg-gradient-to-br from-white to-amber-50/80 border-amber-100 dark:from-slate-900 dark:to-amber-950/40 dark:border-amber-900/50",
    cardBorder: "hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]",
    iconBg: "bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-[inset_0_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(245,158,11,0.2)]",
    watermark: "text-amber-600/[0.08] dark:text-amber-400/[0.05]",
    labelColor: "text-amber-800/90 dark:text-amber-300/90",
    descColor: "text-slate-500 dark:text-slate-400",
    valueColor: "text-slate-900 dark:text-white",
  },
  destructive: {
    cardBg: "bg-gradient-to-br from-white to-rose-50/80 border-rose-100 dark:from-slate-900 dark:to-rose-950/40 dark:border-rose-900/50",
    cardBorder: "hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)]",
    iconBg: "bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-[inset_0_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(244,63,94,0.2)]",
    watermark: "text-rose-600/[0.08] dark:text-rose-400/[0.05]",
    labelColor: "text-rose-800/90 dark:text-rose-300/90",
    descColor: "text-slate-500 dark:text-slate-400",
    valueColor: "text-slate-900 dark:text-white",
  },
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  colorVariant = "primary",
}: StatCardProps) {
  const variant = COLOR_VARIANTS[colorVariant]

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-500 ease-out border shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1",
        variant.cardBg,
        variant.cardBorder,
        className
      )}
    >
      {/* Decorative Watermark Icon to add character */}
      <Icon className={cn("absolute -right-6 -top-6 size-32 -rotate-12 pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6", variant.watermark)} />

      <CardContent className="relative z-10 p-5 sm:p-6 flex flex-col gap-5 select-none">
        
        {/* Header: Label & Icon */}
        <div className="flex items-start justify-between gap-4">
          <span className={cn("text-[12px] font-extrabold uppercase tracking-widest mt-1", variant.labelColor)}>
            {title}
          </span>
          <div className={cn("size-10 sm:size-11 rounded-[14px] flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", variant.iconBg)}>
            <Icon className="size-5 text-white drop-shadow-sm" />
          </div>
        </div>
        
        {/* Value & Trend */}
        <div className="space-y-1 mt-1">
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <span className={cn("text-[28px] sm:text-[36px] font-black tracking-tight leading-none", variant.valueColor)}>
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[12px] font-bold px-2 py-0.5 rounded-full border shadow-sm",
                  trend.isPositive
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400"
                    : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400"
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {trend.value}
              </span>
            )}
          </div>
          {description && (
            <p className={cn("text-[12px] font-semibold leading-relaxed pt-1", variant.descColor)}>
              {description}
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
