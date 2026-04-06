import * as React from "react"

import { cn } from "../../lib/utils"

const Switch = React.forwardRef(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked ? "bg-blue-600" : "bg-slate-300",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  )
)

Switch.displayName = "Switch"

export { Switch }
