import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CustomConnectButton } from "./ConnectButton";
import { useTheme } from "@/context/ThemeContext";
import { useSearch } from "@/context/SearchContext";
import { GraduationCap, Home, Upload, User, Menu, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const { theme } = useTheme();
  const { searchQuery, setSearchQuery } = useSearch();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    {
      name: "Me",
      path: "/me",
      icon: User,
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the search context and filtered in components
    // This prevents page reload and allows real-time filtering
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/50 sticky top-0 z-40 shadow-lg shadow-blue-500/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ThesisHub
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          {location.pathname !== "/" && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search thesis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-0 rounded-lg bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-600/70 dark:placeholder-gray-400/70 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/70 focus:bg-gray-100/90 dark:focus:bg-gray-800/50 transition-all duration-300"
                />
                </div>
              </form>
            </div>
          )}

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

          {/* Connect Wallet Button and Mobile Search */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search Icon */}
            {location.pathname !== "/" && (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <CustomConnectButton />
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && location.pathname !== "/" && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search thesis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-0 rounded-lg bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-600/70 dark:placeholder-gray-400/70 focus:ring-2 focus:ring-blue-500/50 focus:border-gray-400/70 focus:bg-blue-100/90 dark:focus:bg-gray-800/50 transition-all duration-300"
                />
              </div>
            </form>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
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
          </div>
        )}
      </div>
    </nav>
  );
};
