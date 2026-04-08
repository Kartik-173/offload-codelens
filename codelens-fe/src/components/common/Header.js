import React, { useState } from "react";
import { Bell, User, ChevronDown, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { ENV } from '../../config/env';

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const userEmail = localStorage.getItem("user_email") || "admin@codelens.com";
  const userName = userEmail.split("@")[0];
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1) + " User";

  const handleSignOut = () => {
    localStorage.clear();
    window.location.href = ENV.LOGIN_PAGE;
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Platform Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-bold">CL</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">CodeLens</h1>
            <p className="text-sm text-gray-500">Enterprise Security Platform</p>
          </div>
        </div>

        {/* Notification Center + User Settings */}
        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-500 hover:text-gray-700"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 px-2 hover:bg-gray-100"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {displayName.charAt(0)}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{displayName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => setShowDropdown(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </button>
                <hr className="my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
