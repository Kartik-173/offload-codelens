import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  FolderGit,
  FolderOpen,
  FileArchive,
  BarChart3,
  Zap,
  Shield,
  Cloud,
  Globe,
  ChevronDown,
  ChevronUp,
  LogOut,
  KeyRound,
  Lock,
} from "lucide-react";
import { ENV } from '../../config/env';

// Icon mapping for menu items
const iconMap = {
  GitHubIcon: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
  SourceIcon: FolderGit,
  FolderIcon: FolderOpen,
  ArchiveIcon: FileArchive,
  AssessmentIcon: BarChart3,
  SpeedIcon: Zap,
  PolicyIcon: Shield,
  CloudOutlinedIcon: Cloud,
  LanguageIcon: Globe,
  ManageAccountsIcon: KeyRound,
  SecurityIcon: Lock,
  Shield: Shield,
  ExitToAppIcon: LogOut,
};

const SidebarMenuItems = (navigate) => [
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
    label: "Scan Repo",
    icon: "FolderIcon",
    route: "/scan-repo",
  },
  {
    label: "Scan ZIP Code",
    icon: "ArchiveIcon",
    route: "/upload-zip",
  },
  {
    label: "Reports",
    icon: "AssessmentIcon",
    route: "/report-list",
  },
  {
    label: "Vegeta Scan",
    icon: "SpeedIcon",
    route: "/vegeta-scan",
  },
  {
    label: "WAF Scan",
    icon: "PolicyIcon",
    route: "/waf-scan",
  },
  {
    label: "Cloud Security",
    icon: "CloudOutlinedIcon",
    expandable: true,
    children: [
      {
        label: "Credentials",
        icon: "ManageAccountsIcon",
        route: "/credentials",
      },
      {
        label: "Security Scan",
        icon: "SecurityIcon",
        route: "/security-scan",
      },
    ],
  },
  {
    label: "OpenShield",
    icon: "Shield",
    external: () => {
      const accessToken = localStorage.getItem("access_token");
      const idToken = localStorage.getItem("id_token");
      window.open(
        `${ENV.COMPLAINCE_REDIRECT}?accesstoken=${accessToken}&idtoken=${idToken}`,
        "_blank"
      );
    },
  },
  {
    label: "SecLens",
    icon: "LanguageIcon",
    external: () => {
      const accessToken = localStorage.getItem("access_token");
      const idToken = localStorage.getItem("id_token");
      window.open(
        `${ENV.SECLENS_REDIRECT}?accesstoken=${accessToken}&idtoken=${idToken}`,
        "_blank"
      );
    },
  },
];

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState({});
  const navigate = useNavigate();

  const handleAction = async (item) => {
    if (item.route) navigate(item.route);
    if (item.external) item.external();
  };

  const toggleGroup = (label) => {
    setIsExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSignOut = () => {
    localStorage.clear();
    window.location.href = ENV.LOGIN_PAGE;
  };

  const menu = SidebarMenuItems(navigate);

  const renderIcon = (iconName, className = "h-4 w-4") => {
    const IconComponent = iconMap[iconName];
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
  };

  return (
    <div className="w-80 bg-slate-800 min-h-screen shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 p-6 border-b border-slate-700">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/home")}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">CL</span>
          </div>
          <div>
            <h1 className="text-white text-sm font-semibold">CodeLens</h1>
            <p className="text-slate-400 text-xs">by CloudsAnalytics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menu.map((item) => (
          <div key={item.label}>
            {!item.expandable ? (
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 px-3 py-2 h-10 text-sm font-medium",
                  "text-slate-300 hover:bg-slate-700 hover:text-white",
                  "transition-all duration-200"
                )}
                onClick={() => handleAction(item)}
              >
                {renderIcon(item.icon)}
                {item.label}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between px-3 py-2 h-10 text-sm font-medium",
                    "text-slate-300 hover:bg-slate-700 hover:text-white",
                    "transition-all duration-200"
                  )}
                  onClick={() => toggleGroup(item.label)}
                >
                  <span className="flex items-center gap-2">
                    {renderIcon(item.icon)}
                    {item.label}
                  </span>
                  {isExpanded[item.label] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {isExpanded[item.label] && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {item.children.map((child) => (
                      <Button
                        key={child.label}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-2 px-3 py-2 h-9 text-sm",
                          "text-slate-400 hover:bg-slate-700 hover:text-white",
                          "transition-all duration-200"
                        )}
                        onClick={() => handleAction(child)}
                      >
                        {renderIcon(child.icon, "h-4 w-4")}
                        {child.label}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="mt-auto p-4 border-t border-slate-700">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 px-3 py-2 h-10 text-sm font-medium",
            "text-red-400 hover:bg-red-500/10 hover:text-red-300",
            "transition-all duration-200"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
