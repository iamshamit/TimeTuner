import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                default: "bg-primary-500/20 text-primary-400 border border-primary-500/30",
                secondary: "bg-surface-50 text-text-muted border border-border-glass",
                destructive: "bg-red-500/20 text-red-400 border border-red-500/30",
                success: "bg-green-500/20 text-green-400 border border-green-500/30",
                warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
                outline: "border border-border-glass text-text-primary",
                purple: "bg-accent-purple/20 text-purple-400 border border-purple-500/30",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({ className, variant, ...props }) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
