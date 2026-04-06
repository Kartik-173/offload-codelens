import React from "react"
import { cn } from "../../lib/utils"

const Sidebar = ({ children, className }) => {
  return (
    <div className={cn("w-80 bg-slate-800 min-h-screen shadow-2xl flex flex-col", className)}>
      {children}
    </div>
  )
}

const SidebarHeader = ({ children, className }) => (
  <div className={cn("bg-slate-900 p-6 border-b border-slate-700", className)}>
    {children}
  </div>
)

const SidebarBrand = ({ logo, title, subtitle, className }) => (
  <div className={cn("flex items-center gap-3", className)}>
    {logo && (
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
        {typeof logo === 'string' ? (
          <span className="text-white text-lg font-bold">{logo}</span>
        ) : (
          logo
        )}
      </div>
    )}
    <div>
      {title && <h1 className="text-white text-sm font-semibold">{title}</h1>}
      {subtitle && <p className="text-slate-400 text-xs">{subtitle}</p>}
    </div>
  </div>
)

const SidebarNav = ({ groups, activeItem, onItemClick, className }) => (
  <nav className={cn("flex-1 p-4 space-y-6 overflow-y-auto", className)}>
    {groups.map((group) => (
      <div key={group.title}>
        <h3 className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-2 px-3">
          {group.icon && <span className="mr-1">{group.icon}</span>}
          {group.title}
        </h3>
        <div className="space-y-0.5 ml-2">
          {group.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 text-left",
                activeItem === item.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              )}
            >
              <span className="flex items-center gap-2">
                {item.icon && <span className="text-sm">{item.icon}</span>}
                <span className="text-sm font-medium">{item.label}</span>
              </span>
              {activeItem === item.id && (
                <span className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    ))}
  </nav>
)

const SidebarStatCard = ({ icon, iconColor = "blue", label, value, onClick, className }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    red: "bg-red-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    yellow: "bg-yellow-500",
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition-colors cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colorClasses[iconColor])}>
          {icon}
        </div>
        <div>
          <p className="text-slate-300 text-xs">{label}</p>
          <p className="text-white text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}

const SidebarFooter = ({ children, className }) => (
  <div className={cn("bg-slate-900 p-4 border-t border-slate-700 mt-auto", className)}>
    {children}
  </div>
)

const SidebarAIInsights = ({ title, children, className }) => (
  <div className={cn("bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg p-4 mx-4 mb-4", className)}>
    {title && <h4 className="text-white text-sm font-semibold mb-2">{title}</h4>}
    <div className="text-indigo-100 text-xs">
      {children}
    </div>
  </div>
)

export {
  Sidebar,
  SidebarHeader,
  SidebarBrand,
  SidebarNav,
  SidebarStatCard,
  SidebarFooter,
  SidebarAIInsights,
}
