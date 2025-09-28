import React from "react";
import { File, ExternalLink, ShoppingCart, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThesisInfo } from "@/types";

interface ThesisCardProps {
  thesis: ThesisInfo;
  currentUserAddress?: string;
  purchasedThesisCids?: string[];
  onCardClick: (thesis: ThesisInfo) => void;
  onPurchase: (thesis: ThesisInfo) => void;
  onDownload: (thesis: ThesisInfo) => void;
  onViewContract: (address: string) => void;
  isPurchasing?: boolean;
  purchasingThesisId?: string | null;
  showBuyButton?: boolean;
  cardType?: "my-paper" | "purchased" | "browse";
}

export const ThesisCard: React.FC<ThesisCardProps> = ({
  thesis,
  currentUserAddress,
  purchasedThesisCids = [],
  onCardClick,
  onPurchase,
  onDownload,
  onViewContract,
  isPurchasing = false,
  purchasingThesisId = null,
  showBuyButton = true,
  cardType = "browse"
}) => {
  const formatPyusdAmount = (pyusdAmount: string) => {
    try {
      const amount = parseFloat(pyusdAmount);
      return amount.toFixed(6);
    } catch {
      return "0.000000";
    }
  };

  const isOwnPaper = currentUserAddress && thesis.author.toLowerCase() === currentUserAddress.toLowerCase();
  const isPurchased = purchasedThesisCids.includes(thesis.cid);
  const shouldShowBuyButton = showBuyButton && !isOwnPaper && !isPurchased;

  return (
    <div
      onClick={() => onCardClick(thesis)}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-gray-700/50 p-6 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300/50 dark:hover:border-blue-600/50 hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300 cursor-pointer group relative"
    >
      {/* View Contract button - top right, visible only on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewContract(thesis.address);
        }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 rounded-lg bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm shadow-lg border border-white/30 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-600 hover:shadow-xl"
      >
        <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>
      <div className="mb-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-500/20 dark:bg-blue-400/20 backdrop-blur-sm rounded-lg group-hover:bg-blue-500/30 dark:group-hover:bg-blue-400/30 transition-all duration-300 flex-shrink-0 border border-blue-200/30 dark:border-blue-400/30">
            <File className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
              {thesis.title}
            </h3>
          </div>
        </div>
      </div>


      {thesis.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {thesis.description.length > 200 
            ? `${thesis.description.substring(0, 200)}...` 
            : thesis.description
          }
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-green-600 dark:text-green-400">
          {formatPyusdAmount(thesis.costInNative)} PYUSD
        </div>
        <div className="flex items-center space-x-2">
          {shouldShowBuyButton ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPurchase(thesis);
              }}
              disabled={isPurchasing || purchasingThesisId === thesis.cid}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {purchasingThesisId === thesis.cid ? (
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
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(thesis);
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
