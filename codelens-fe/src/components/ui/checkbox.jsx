import * as React from "react"

import { cn } from "../../lib/utils"

const Checkbox = React.forwardRef(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn("h-4 w-4 rounded border border-input", className)}
        checked={Boolean(checked)}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        disabled={disabled}
        {...props}
      />
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
