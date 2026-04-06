import * as React from "react"

import { cn } from "../../lib/utils"

const Select = ({ value, onValueChange, children, className, disabled }) => (
  <select
    value={value}
    onChange={(e) => onValueChange?.(e.target.value)}
    disabled={disabled}
    className={cn("h-9 w-full rounded-md border border-input bg-background px-3 text-sm", className)}
  >
    {children}
  </select>
)

const SelectTrigger = ({ className, children, ...props }) => (
  <div className={cn("h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", className)} {...props}>
    {children}
  </div>
)

const SelectValue = ({ placeholder }) => <span>{placeholder}</span>

const SelectContent = ({ children }) => <>{children}</>

const SelectItem = ({ value, children, disabled }) => (
  <option value={value} disabled={disabled}>
    {children}
  </option>
)

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
