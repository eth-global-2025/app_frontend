import React from "react";
import { Link, useLocation } from "react-router-dom";
import { CustomConnectButton } from "./ConnectButton";
import { useTheme } from "@/context/ThemeContext";
import { GraduationCap, Home, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const { theme } = useTheme();
  const location = useLocation();

  const navItems = [
    {
      name: "Home",
      path: "/home",
      icon: Home,
    },
    {
      name: "Upload",
      path: "/upload",
      icon: Upload,
    },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ThesisHub
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Connect Wallet Button */}
          <div className="flex items-center space-x-4">
            <CustomConnectButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center",
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
