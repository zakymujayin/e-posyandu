import { Inbox } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in", className)}>
      <div className="mb-4 size-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground shadow-xs">
        {icon ?? <Inbox className="w-8 h-8 text-muted-foreground/80" />}
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}