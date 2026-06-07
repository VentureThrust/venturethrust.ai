import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base classes shared by every variant.
  //
  // `transition-all` (not just transition-colors) so the dome shadow + lift
  // animate smoothly alongside any color/border changes. duration-300 matches
  // the "premium tactile" feel without being sluggish.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // Simple soft-shadow hover for every variant - tiny lift +
      // neutral grey drop shadow, no colored dome highlights. Reads as
      // tactile/premium without tinting the button on hover.
      //   1. -translate-y-0.5 → small upward nudge
      //   2. shadow-md → soft, neutral elevation
      // ghost + link skip lift/shadow entirely (used for icon buttons,
      // sidebar items, and inline links).
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:-translate-y-0.5 hover:shadow-md",
        outline:
          "border border-input bg-background text-foreground hover:bg-gray-50 hover:text-foreground hover:-translate-y-0.5 hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-0.5 hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
