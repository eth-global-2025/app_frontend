import React from "react";
import { CustomConnectButton } from "@/components/ConnectButton";
import { useTheme } from "@/context/ThemeContext";
import { GraduationCap, DollarSign, BookOpen, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Landing = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Get Started
            </button>
            <button className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold">
              Learn More
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Create Assets
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Convert your research papers, datasets, and findings into tradeable digital assets.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <DollarSign className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Earn Revenue
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monetize your research through licensing, royalties, and direct sales.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
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
