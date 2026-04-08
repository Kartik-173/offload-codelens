import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Scan,
  FileText,
  Shield,
  Lock,
  FolderGit,
  Zap,
  Rocket,
  ChevronRight,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { ENV } from '../config/env';

const Home = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("user_email") || "admin@codelens.com";
  const userName = userEmail.split("@")[0];
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1) + " User";

  const [activeTab, setActiveTab] = useState("overview");

  const featureCards = [
    {
      id: "scan-repos",
      icon: <Scan className="h-6 w-6 text-white" />,
      title: "Scan Your Repos",
      description: "Run deep analysis and quality checks across your projects with AI-powered insights.",
      badge: "AI Powered",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      gradient: "from-blue-600 to-indigo-700",
      action: () => navigate("/scan-repo"),
      actionLabel: "Start Scan",
    },
    {
      id: "reports",
      icon: <FileText className="h-6 w-6 text-white" />,
      title: "Reports & Insights",
      description: "Explore issues, hotspots, trends, and key metrics at a glance.",
      badge: "10+ Formats",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      gradient: "from-purple-600 to-pink-700",
      action: () => navigate("/report-list"),
      actionLabel: "View Reports",
    },
    {
      id: "openshield",
      icon: <Shield className="h-6 w-6 text-white" />,
      title: "OpenShield Security",
      description: "Harden servers and detect vulnerabilities with Wazuh integration.",
      badge: "Server Security",
      badgeColor: "bg-green-500/20 text-green-300 border-green-500/30",
      gradient: "from-emerald-600 to-teal-700",
      action: () => {
        const accessToken = localStorage.getItem("access_token");
        const idToken = localStorage.getItem("id_token");
        window.open(
          `${ENV.COMPLAINCE_REDIRECT}?accesstoken=${accessToken}&idtoken=${idToken}`,
          "_blank"
        );
      },
      actionLabel: "Launch",
    },
    {
      id: "seclens",
      icon: <Lock className="h-6 w-6 text-white" />,
      title: "SecLens Web Scans",
      description: "Scan domains and URLs for security risks with OWASP ZAP integration.",
      badge: "OWASP Top 10",
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
      gradient: "from-red-600 to-orange-700",
      action: () => {
        const accessToken = localStorage.getItem("access_token");
        const idToken = localStorage.getItem("id_token");
        window.open(
          `${ENV.SECLENS_REDIRECT}?accesstoken=${accessToken}&idtoken=${idToken}`,
          "_blank"
        );
      },
      actionLabel: "Launch",
    },
    {
      id: "git-accounts",
      icon: <FolderGit className="h-6 w-6 text-white" />,
      title: "Connect Git Accounts",
      description: "Link GitHub or Bitbucket to enable PRs, branches, and automated scans.",
      badge: "Multi-Provider",
      badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      gradient: "from-slate-600 to-gray-700",
      action: () => navigate("/github-connections"),
      actionLabel: "Connect",
    },
  ];

  const recentActivities = [
    { type: "scan", message: "Repository scan completed for myapp-frontend", time: "2 hours ago", status: "success" },
    { type: "alert", message: "3 critical vulnerabilities detected in API gateway", time: "5 hours ago", status: "warning" },
    { type: "sync", message: "GitHub connection synchronized successfully", time: "1 day ago", status: "success" },
    { type: "report", message: "Monthly security report generated", time: "2 days ago", status: "info" },
  ];

  const getActivityIcon = (type, status) => {
    const iconClass = "h-4 w-4";
    switch (status) {
      case "success":
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case "warning":
        return <AlertCircle className={`${iconClass} text-amber-500`} />;
      default:
        return <Activity className={`${iconClass} text-blue-500`} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                Welcome back, {displayName}! <Rocket className="inline-block h-8 w-8 ml-2" />
              </h1>
              <p className="text-lg text-blue-100 max-w-2xl">
                Your AI-powered code security and analysis center
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Shield className="h-12 w-12 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
            >
              <Shield className="h-4 w-4 mr-2" />
              Security Overview
            </TabsTrigger>
            <TabsTrigger
              value="executive"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Executive Dashboard
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {featureCards.map((card) => (
            <Card
              key={card.id}
              className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={card.action}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
              
              <CardContent className="relative p-6 text-white">
                {/* Badge */}
                <div className="flex justify-end mb-4">
                  <Badge
                    variant="outline"
                    className={`${card.badgeColor} border text-xs font-medium backdrop-blur-sm`}
                  >
                    {card.badge}
                  </Badge>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    {card.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  {card.description}
                </p>

                {/* Action */}
                <div className="flex items-center text-sm font-medium text-white/90 group-hover:text-white">
                  {card.actionLabel}
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Section */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">Recent Security Activity</h2>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">
                      {activity.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
