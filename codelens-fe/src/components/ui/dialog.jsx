import * as React from "react"

import { cn } from "../../lib/utils"

const DialogContext = React.createContext({
  open: false,
  onOpenChange: () => {},
})

const Dialog = ({ open = false, onOpenChange, children }) => (
  <DialogContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
    {children}
  </DialogContext.Provider>
)

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(DialogContext)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => onOpenChange(false)}>
      <div
        ref={ref}
        className={cn("w-full rounded-lg border bg-background p-6 shadow-lg", className)}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("mb-4 flex flex-col space-y-1.5 text-left", className)} {...props} />
)

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
)

const DialogTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props}>
    {children}
  </h2>
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
