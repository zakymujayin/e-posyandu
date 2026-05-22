import * as React from "react"
import { cn } from "@/lib/utils"

export const PageTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "text-[18px] md:text-[28px] font-extrabold tracking-tight text-slate-800 leading-tight",
      className
    )}
    {...props}
  />
))
PageTitle.displayName = "PageTitle"

export const SectionTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-[18px] font-semibold tracking-tight text-slate-900",
      className
    )}
    {...props}
  />
))
SectionTitle.displayName = "SectionTitle"

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-[16px] font-bold tracking-tight text-slate-800",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

export const BodyText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-[14px] text-slate-700 font-normal leading-relaxed",
      className
    )}
    {...props}
  />
))
BodyText.displayName = "BodyText"

export const MutedText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-[13px] text-slate-500 font-normal",
      className
    )}
    {...props}
  />
))
MutedText.displayName = "MutedText"

export const SubText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-[11px] text-slate-400 font-medium",
      className
    )}
    {...props}
  />
))
SubText.displayName = "SubText"

export const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-[14px] font-semibold text-slate-800 select-none",
      className
    )}
    {...props}
  />
))
FormLabel.displayName = "FormLabel"
