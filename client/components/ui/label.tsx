import * as React from "react"
import { cn } from "@/src/lib/utils"

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-75 select-none",
        className
      )}
      {...props}
    />
  )
}
