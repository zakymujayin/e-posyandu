import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-[38px] w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-[15px] xl:text-[16px] font-normal transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-[14px] xl:file:text-[15px] file:font-medium file:text-foreground placeholder:text-[14px] xl:placeholder:text-[15px] placeholder:text-muted-foreground/40 placeholder:font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
