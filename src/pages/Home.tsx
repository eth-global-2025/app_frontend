import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { File, Download, Calendar, User, Hash, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { listUploadsViaApiKey, PaperMeta } from "@/services/lighthouse";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

export const Home = () => {
  const { theme } = useTheme();
  const { isConnected } = useAccount();
  const [papers, setPapers] = useState<PaperMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<PaperMeta | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      setError(null);
      const uploadedPapers = await listUploadsViaApiKey();
      console.log("uploadedPapers", uploadedPapers);
      setPapers(uploadedPapers);
    } catch (err) {
      console.error("Error fetching papers:", err);
      setError("Failed to load uploaded files");
      toast.error("Failed to load uploaded files");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
    } catch {
      return "Unknown date";
    }
  };

  const formatFileSize = (size: string) => {
    const bytes = parseInt(size);
    if (isNaN(bytes)) return size;
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("CID copied to clipboard");
  };

  const handleCardClick = (paper: PaperMeta) => {
    setSelectedPaper(paper);
    setShowDownloadModal(true);
  };

  const handleDownload = () => {
    if (selectedPaper) {
      // TODO: Implement actual download functionality
      toast.success(`Downloading ${selectedPaper.title}...`);
      setShowDownloadModal(false);
      setSelectedPaper(null);
    }
  };

  const closeModal = () => {
    setShowDownloadModal(false);
    setSelectedPaper(null);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <File className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please connect your wallet to view your uploaded files
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Landing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                My Research Files
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                View and manage your uploaded research papers and datasets
              </p>
            </div>
            <Link
              to="/upload"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload New File
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-300">Loading files...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <File className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={fetchPapers}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Files Grid */}
        {!loading && !error && (
          <>
            {papers.length === 0 ? (
              <div className="text-center py-12">
                <File className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No files uploaded yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Upload your first research file to get started
                </p>
                <Link
                  to="/upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload File
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers.map((paper, index) => (
                  <div
                    key={paper.cid}
                    onClick={() => handleCardClick(paper)}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                          <File className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {paper.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Research Paper
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <Hash className="w-4 h-4" />
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {paper.cid.slice(0, 12)}...{paper.cid.slice(-8)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(paper.cid);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          Copy
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <User className="w-4 h-4" />
                        <span>{paper.owner.slice(0, 6)}...{paper.owner.slice(-4)}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>Uploaded recently</span>
                      </div>
                    </div>

                    {paper.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {paper.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        {paper.priceEth} ETH
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Click to download
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Stats */}
        {!loading && !error && papers.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <File className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Files</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{papers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Hash className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">IPFS Assets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{papers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Your Assets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{papers.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download Confirmation Modal */}
        {showDownloadModal && selectedPaper && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Download File
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <File className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {selectedPaper.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Research Paper
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4" />
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {selectedPaper.cid}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Owner: {selectedPaper.owner.slice(0, 6)}...{selectedPaper.owner.slice(-4)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      Price: {selectedPaper.priceEth} ETH
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
