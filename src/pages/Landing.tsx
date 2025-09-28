import React from "react";
import { Link } from "react-router-dom";
import { CustomConnectButton } from "@/components/ConnectButton";
import { useTheme } from "@/context/ThemeContext";
import { GraduationCap, DollarSign, BookOpen, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Landing = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <Navbar />

      {/* Hero Section */}
      <main className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Monetize your Research
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform your academic research into valuable digital assets. 
            Create, trade, and monetize your intellectual property on the blockchain.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              to="/home"
              className="px-8 py-3 bg-blue-600/90 backdrop-blur-sm text-white rounded-xl hover:bg-blue-700/90 transition-all duration-300 font-semibold text-center shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 border border-blue-500/20"
            >
              Get Started
            </Link>
            <button className="px-8 py-3 border border-white/30 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white/20 dark:hover:bg-gray-700/50 backdrop-blur-sm transition-all duration-300 font-semibold shadow-lg shadow-gray-500/10 hover:shadow-xl hover:shadow-gray-500/20">
              Learn More
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-xl shadow-blue-500/10 border border-white/20 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
              <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Create Assets
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Convert your research papers, datasets, and findings into tradeable digital assets.
              </p>
            </div>

            <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-xl shadow-green-500/10 border border-white/20 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300">
              <DollarSign className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Earn Revenue
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monetize your research through licensing, royalties, and direct sales.
              </p>
            </div>

            <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-xl shadow-purple-500/10 border border-white/20 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
              <Users className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Connect Network
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Join a community of researchers, institutions, and investors.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 ThesisHub. Empowering researchers worldwide.</p>
        </div>
      </footer>
    </div>
  );
};
