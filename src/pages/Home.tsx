import React, { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { File, Download, Calendar, User, Hash, X, ExternalLink, ShoppingCart } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { listUploadsViaApiKey, PaperMeta } from "@/services/lighthouse";
import { useAssets } from "@/hooks/useThesis";
import { useBuyThesis } from "@/services/contractService";
import { decryptPdfBlob } from "@/services/lighthouse";
import { ThesisInfo } from "@/types";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

export const Home = () => {
  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { allThesis, isAllThesisLoading, refetchThesis } = useAssets();
  const { buyThesis, isPending: isBuying, isConfirmed: isPurchaseConfirmed, isError: isPurchaseError, hash: purchaseHash } = useBuyThesis();
  const [selectedThesis, setSelectedThesis] = useState<ThesisInfo | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [purchasingThesis, setPurchasingThesis] = useState<string | null>(null);
  const [downloadingThesis, setDownloadingThesis] = useState<string | null>(null);

  // Refresh data when component mounts or when connection status changes
  useEffect(() => {
    if (isConnected) {
      refetchThesis();
    }
  }, [isConnected, refetchThesis]);

  const formatEthAmount = (weiAmount: string) => {
    try {
      const ethAmount = parseFloat(weiAmount) / Math.pow(10, 18);
      return ethAmount.toFixed(4);
    } catch {
      return "0.0000";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleCardClick = (thesis: ThesisInfo) => {
    setSelectedThesis(thesis);
    setShowDownloadModal(true);
  };

  const downloadFile = async (thesis: ThesisInfo) => {
    if (!walletClient || !isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setDownloadingThesis(thesis.cid);
      toast.loading("Decrypting and downloading file...", { id: "download" });
      
      // Decrypt the file from IPFS
      const blob = await decryptPdfBlob(thesis.cid, walletClient as any);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${thesis.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("File downloaded successfully!", { id: "download" });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file", { 
        id: "download",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setDownloadingThesis(null);
    }
  };

  const handleDownload = () => {
    if (selectedThesis) {
      downloadFile(selectedThesis);
      setShowDownloadModal(false);
      setSelectedThesis(null);
    }
  };

  const closeModal = () => {
    setShowDownloadModal(false);
    setSelectedThesis(null);
  };

  const openOnEtherscan = (address: string) => {
    window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank');
  };

  const handlePurchase = async (thesis: ThesisInfo) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (thesis.author.toLowerCase() === address.toLowerCase()) {
      toast.error("You cannot purchase your own paper");
      return;
    }

    if (!thesis.costInNative || isNaN(parseFloat(thesis.costInNative))) {
      toast.error("Invalid cost data for this paper");
      return;
    }

    try {
      setPurchasingThesis(thesis.cid);
      // Convert ETH string to wei BigInt
      const costInWei = BigInt(Math.floor(parseFloat(thesis.costInNative) * Math.pow(10, 18)));
      
      toast.loading("Processing purchase...", { id: "purchase" });
      
      await buyThesis(thesis.address as `0x${string}`, costInWei, thesis.cid);
      
      // The transaction has been submitted, toast will be updated when confirmed
    } catch (error) {
      console.error("Error purchasing thesis:", error);
      toast.error("Failed to purchase thesis", { 
        id: "purchase",
        description: error instanceof Error ? error.message : "Unknown error"
      });
      setPurchasingThesis(null);
    }
  };

  // Handle purchase transaction state changes
  useEffect(() => {
    if (isPurchaseConfirmed && purchasingThesis) {
      toast.success("Thesis purchased successfully!", { 
        id: "purchase",
        description: `Transaction hash: ${purchaseHash?.slice(0, 10)}...` 
      });
      setPurchasingThesis(null);
      // Refresh the thesis data to show updated purchase status
      refetchThesis();
    } else if (isPurchaseError && purchasingThesis) {
      toast.error("Failed to purchase thesis", { 
        id: "purchase",
        description: "Please try again" 
      });
      setPurchasingThesis(null);
    }
  }, [isPurchaseConfirmed, isPurchaseError, purchaseHash, purchasingThesis, refetchThesis]);

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
                Blockchain Research Assets
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                View and manage research papers stored on the blockchain
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
        {isAllThesisLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-300">Loading blockchain assets...</span>
            </div>
          </div>
        )}

        {/* Thesis Grid */}
        {!isAllThesisLoading && (
          <>
            {allThesis.length === 0 ? (
              <div className="text-center py-12">
                <File className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No thesis assets found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  No research papers have been uploaded to the blockchain yet
                </p>
                <Link
                  to="/upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload First Thesis
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allThesis.map((thesis, index) => (
                  <div
                    key={thesis.cid}
                    onClick={() => handleCardClick(thesis)}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                          <File className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {thesis.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Blockchain Thesis
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <Hash className="w-4 h-4" />
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {thesis.cid.slice(0, 12)}...{thesis.cid.slice(-8)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(thesis.cid);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          Copy
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <User className="w-4 h-4" />
                        <span>{thesis.author.slice(0, 6)}...{thesis.author.slice(-4)}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <ExternalLink className="w-4 h-4" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openOnEtherscan(thesis.address);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          View Contract
                        </button>
                      </div>
                    </div>

                    {thesis.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {thesis.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatEthAmount(thesis.costInNative)} ETH
                      </div>
                      <div className="flex items-center space-x-2">
                        {thesis.author.toLowerCase() !== address?.toLowerCase() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePurchase(thesis);
                            }}
                            disabled={isBuying || purchasingThesis === thesis.cid}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            {purchasingThesis === thesis.cid ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                <span>Buying...</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3 h-3" />
                                <span>Buy</span>
                              </>
                            )}
                          </button>
                        )}
                        <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Click to view details
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Stats */}
        {!isAllThesisLoading && allThesis.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <File className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Thesis</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{allThesis.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Hash className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Blockchain Assets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{allThesis.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Unique Authors</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Set(allThesis.map(t => t.author)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Thesis Details Modal */}
        {showDownloadModal && selectedThesis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Thesis Details
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
                      {selectedThesis.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Blockchain Thesis
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  {selectedThesis.description && (
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">Description:</p>
                      <p className="text-sm">{selectedThesis.description}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4" />
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {selectedThesis.cid}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedThesis.cid)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Author: {selectedThesis.author.slice(0, 6)}...{selectedThesis.author.slice(-4)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4" />
                    <button
                      onClick={() => openOnEtherscan(selectedThesis.address)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      View Contract on Etherscan
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      Price: {formatEthAmount(selectedThesis.costInNative)} ETH
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloadingThesis === selectedThesis.cid}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {downloadingThesis === selectedThesis.cid ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </>
                  )}
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
