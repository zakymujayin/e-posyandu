import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-[inset_0_1px_rgba(255,255,255,0.25),0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] hover:brightness-105",
        outline:
          "border border-border/80 bg-background shadow-sm hover:shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-gradient-to-b from-secondary/80 to-secondary border border-border/50 shadow-[inset_0_1px_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.05)] text-secondary-foreground hover:brightness-105 hover:shadow-[inset_0_1px_rgba(255,255,255,0.7),0_2px_4px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-gradient-to-b from-destructive/90 to-destructive text-destructive-foreground shadow-[inset_0_1px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.1)] hover:brightness-105 hover:shadow-[inset_0_1px_rgba(255,255,255,0.3),0_4px_8px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 text-sm has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-6 gap-1 rounded-lg px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-lg px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-sm md:text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-10",
        "icon-xs":
          "size-6 rounded-lg in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-lg in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

import * as React from "react"

interface ButtonProps extends ButtonPrimitive.Props {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps & VariantProps<typeof buttonVariants>>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    if (asChild && React.isValidElement(props.children)) {
      const child = props.children as React.ReactElement<{ className?: string }>
      const { children: _, ...restProps } = props
      return React.cloneElement(child, {
        className: cn(buttonVariants({ variant, size }), className, child.props.className),
        ...restProps,
      } as any)
    }

    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
