import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-gradient-to-b from-card to-card/95 py-5.5 text-sm text-card-foreground border border-border/60 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_20px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_12px_40px_rgba(37,99,235,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] hover:border-primary/30 hover:bg-card has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3.5 data-[size=sm]:py-4 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-3xl *:[img:last-child]:rounded-b-3xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-3xl px-6 group-data-[size=sm]/card:px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-[16px] leading-snug font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[12px] text-muted-foreground/90 font-medium leading-relaxed", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 group-data-[size=sm]/card:px-4 text-foreground", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-3xl border-t bg-muted/20 p-5 group-data-[size=sm]/card:p-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
