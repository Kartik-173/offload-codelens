import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
  FolderGit,
  FolderOpen,
  FileArchive,
  BarChart3,
  Zap,
  Shield,
  Globe,
  ChevronDown,
  ChevronUp,
  LogOut,
  Home,
  Target,
} from "lucide-react";
import { ENV } from '../../config/env';

// Icon mapping for menu items
const iconMap = {
  HomeIcon: Home,
  GitHubIcon: () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
  SourceIcon: FolderGit,
  FolderIcon: FolderOpen,
  ArchiveIcon: FileArchive,
  AssessmentIcon: BarChart3,
  SpeedIcon: Zap,
  PolicyIcon: Shield,
  LanguageIcon: Globe,
  Shield: Shield,
  TargetIcon: Target,
  ExitToAppIcon: LogOut,
};

const SidebarMenuItems = [
  {
    label: "Dashboard",
    icon: "HomeIcon",
    route: "/home",
  },
  {
    label: "Scanning",
    icon: "TargetIcon",
    route: "/scan-repo",
  },
  {
    label: "GitHub",
    icon: "GitHubIcon",
    route: "/github-connections",
  },
  {
    label: "Bitbucket",
    icon: "SourceIcon",
    route: "/bitbucket-connections",
  },
  {
    label: "Reports",
    icon: "AssessmentIcon",
    route: "/report-list",
  },
  {
    label: "Load Testing",
    icon: "SpeedIcon",
    route: "/vegeta-scan",
  },
  {
    label: "OpenShield",
    icon: "Shield",
    external: true,
    url: "COMPLAINCE_REDIRECT",
  },
  {
    label: "SecLens",
    icon: "LanguageIcon",
    external: true,
    url: "SECLENS_REDIRECT",
  },
];

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const handleAction = async (item) => {
    if (item.external) {
      const accessToken = localStorage.getItem("access_token");
      const idToken = localStorage.getItem("id_token");
      window.open(
        `${ENV[item.url]}?accesstoken=${accessToken}&idtoken=${idToken}`,
        "_blank"
      );
    } else if (item.route) {
      navigate(item.route);
    }
  };

  const toggleGroup = (label) => {
    setIsExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSignOut = () => {
    localStorage.clear();
    window.location.href = ENV.LOGIN_PAGE;
  };

  const isActiveRoute = (route) => {
    return location.pathname === route;
  };

  const renderIcon = (iconName, className = "h-5 w-5") => {
    const IconComponent = iconMap[iconName];
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
  };

  return (
    <div className="w-72 bg-slate-900 min-h-screen shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/home")}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">CL</span>
          </div>
          <div className="ml-3">
            <h1 className="text-white text-sm font-semibold">CodeLens</h1>
            <p className="text-slate-400 text-xs">Security Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {SidebarMenuItems.map((item) => (
          <div key={item.label}>
            {!item.expandable ? (
              <button
                className={cn(
                  "w-full flex items-center rounded-lg transition-all duration-200 px-3 py-2.5 gap-3",
                  isActiveRoute(item.route)
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
                onClick={() => handleAction(item)}
              >
                {renderIcon(item.icon)}
                <span className="text-sm font-medium">{item.label}</span>
                {isActiveRoute(item.route) && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            ) : (
              <>
                <button
                  className={cn(
                    "w-full flex items-center rounded-lg transition-all duration-200 px-3 py-2.5 gap-3 text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                  onClick={() => toggleGroup(item.label)}
                >
                  {renderIcon(item.icon)}
                  <span className="text-sm font-medium flex-1 text-left">
                    {item.label}
                  </span>
                  {isExpanded[item.label] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {isExpanded[item.label] && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {item.children.map((child) => (
                      <button
                        key={child.label}
                        className={cn(
                          "w-full flex items-center px-3 py-2 rounded-md text-left transition-all duration-200 gap-3",
                          isActiveRoute(child.route)
                            ? "bg-blue-500 text-white"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                        )}
                        onClick={() => handleAction(child)}
                      >
                        {renderIcon(child.icon, "h-4 w-4")}
                        <span className="text-sm">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-slate-800">
        <button
          className="w-full flex items-center rounded-lg transition-all duration-200 px-3 py-2.5 gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
