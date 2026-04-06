import * as React from "react"
import { cn } from "../../lib/utils"

const TabsContext = React.createContext({
  value: undefined,
  onValueChange: undefined,
})

const Tabs = ({ value, onValueChange, children, className }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = ({ children, className }) => {
  return (
    <div className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500",
      className
    )}>
      {children}
    </div>
  )
}

const TabsTrigger = ({ value, children, className }) => {
  const { value: activeValue, onValueChange } = React.useContext(TabsContext)
  const isActive = activeValue === value

  return (
    <button
      onClick={() => onValueChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
        isActive
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
        className
      )}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value, children, className }) => {
  const { value: activeValue } = React.useContext(TabsContext)
  if (activeValue !== value) return null

  return (
    <div className={cn("mt-2", className)}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
