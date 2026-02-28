import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary-500 text-white hover:bg-primary-600 shadow-glow",
                destructive: "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30",
                outline: "border border-border-glass bg-transparent hover:bg-surface-50 text-text-primary",
                secondary: "bg-surface-50 text-text-primary border border-border-glass hover:bg-surface-80",
                ghost: "hover:bg-surface-50 text-text-muted hover:text-text-primary",
                link: "text-primary-400 underline-offset-4 hover:underline",
                success: "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30",
                glow: "bg-gradient-to-r from-primary-500 to-accent-purple text-white shadow-glow hover:shadow-glow-lg",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-12 rounded-lg px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Button = React.forwardRef(
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
