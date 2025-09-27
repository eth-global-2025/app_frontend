import React, { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { File, Download, Calendar, User, Hash, X, ExternalLink, BookOpen, ShoppingCart } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { useAssets } from "@/hooks/useThesis";
import { useUserThesis } from "@/hooks/useUserTokens";
import { useBuyThesis } from "@/services/contractService";
import { decryptPdfBlob } from "@/services/lighthouse";
import { ThesisInfo } from "@/types";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ThesisCard } from "@/components/ThesisCard";

export const Me = () => {
  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { allThesis, isAllThesisLoading, refetchThesis } = useAssets();
  const { allUserThesis, isAllUserThesisLoading, refetchUserThesis } = useUserThesis();
  const { buyThesis, isPending: isBuying, isConfirmed: isPurchaseConfirmed, isError: isPurchaseError, hash: purchaseHash } = useBuyThesis();
  const [activeTab, setActiveTab] = useState<"my-papers" | "purchased">("my-papers");
  const [selectedThesis, setSelectedThesis] = useState<ThesisInfo | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [purchasingThesis, setPurchasingThesis] = useState<string | null>(null);
  const [downloadingThesis, setDownloadingThesis] = useState<string | null>(null);

  // Refresh data when component mounts or when connection status changes
  useEffect(() => {
    if (isConnected) {
      refetchThesis();
      refetchUserThesis();
    }
  }, [isConnected, refetchThesis, refetchUserThesis]);

  // Filter thesis based on current user
  const myPapers = allThesis.filter(thesis => 
    thesis.author.toLowerCase() === address?.toLowerCase()
  );

  // Use the useUserThesis hook to get purchased papers
  const purchasedPapers = allUserThesis;

  const formatEthAmount = (ethAmount: string) => {
    try {
      const amount = parseFloat(ethAmount);
      return amount.toFixed(4);
    } catch {
      return "0.0000";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const openOnEtherscan = (address: string) => {
    window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank');
  };

  const handleCardClick = (thesis: ThesisInfo) => {
    setSelectedThesis(thesis);
    setShowDetailsModal(true);
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
      setShowDetailsModal(false);
      setSelectedThesis(null);
    }
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedThesis(null);
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
      refetchUserThesis();
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
          <User className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please connect your wallet to view your research papers
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

  const currentPapers = activeTab === "my-papers" ? myPapers : purchasedPapers;
  const isLoading = activeTab === "my-papers" ? isAllThesisLoading : isAllUserThesisLoading;

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
                  My Research Hub
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage your research papers and track your purchases
                </p>
              </div>
              <Link
                to="/upload"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload New Paper
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("my-papers")}
                  className={cn(
                    "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === "my-papers"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4" />
                    <span>My Research Papers</span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                      {myPapers.length}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("purchased")}
                  className={cn(
                    "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === "purchased"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Purchased Papers</span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                      {purchasedPapers.length}
                    </span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 dark:text-gray-300">Loading papers...</span>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <>
              {currentPapers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    {activeTab === "my-papers" ? (
                      <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto" />
                    ) : (
                      <ShoppingCart className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {activeTab === "my-papers" 
                      ? "No research papers uploaded yet" 
                      : "No purchased papers yet"
                    }
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {activeTab === "my-papers" 
                      ? "Upload your first research paper to get started" 
                      : "Purchase research papers from other authors to see them here"
                    }
                  </p>
                  {activeTab === "my-papers" && (
                    <Link
                      to="/upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Upload First Paper
                    </Link>
                  )}
                  {activeTab === "purchased" && (
                    <Link
                      to="/home"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Papers
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentPapers.map((thesis, index) => (
                    <ThesisCard
                      key={thesis.cid}
                      thesis={thesis}
                      currentUserAddress={address}
                      purchasedThesisCids={purchasedPapers.map(t => t.cid)}
                      onCardClick={handleCardClick}
                      onPurchase={handlePurchase}
                      onDownload={downloadFile}
                      onViewContract={openOnEtherscan}
                      isPurchasing={isBuying}
                      purchasingThesisId={purchasingThesis}
                      showBuyButton={activeTab === "purchased" ? false : true}
                      cardType={activeTab === "my-papers" ? "my-paper" : "purchased"}
                    />
                  ))}
                </div>
              )}
            </>
          )}


          {/* Details Modal */}
          {showDetailsModal && selectedThesis && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Paper Details
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
                        {activeTab === "my-papers" ? "Your Research Paper" : "Purchased Paper"}
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
