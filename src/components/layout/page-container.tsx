import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12", className)}>
      {children}
    </div>
  )
}
