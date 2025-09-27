import { useState, useEffect } from "react";
import { ThesisInfo } from "@/types";
import { useReadContract } from "wagmi";
import { ThesisHubMaster } from "@/contracts/ThesisHubMaster";

// The function returns a tuple: [addresses[], assetInfos[]]
type GetAllAssetInfosResult = [`0x${string}`[], ThesisInfo[]];

export const useAssets = () => {
  const [allThesis, setAllThesis] = useState<ThesisInfo[]>([]);
  const [isAllThesisLoading, setIsAllThesisLoading] = useState(true);

  const { data: allThesisInfo, isLoading: isAllThesisInfoLoading, refetch: refetchTotalThesis } = useReadContract({
    address: ThesisHubMaster.address as `0x${string}`,
    abi: ThesisHubMaster.abi,
    functionName: "getAllThesisInfos",
  });

  useEffect(() => {
    if (!isAllThesisInfoLoading) {
      if (allThesisInfo) {
        
        try {
          // The function returns a tuple: [addresses[], assetInfos[]]
          const result = allThesisInfo as unknown as GetAllAssetInfosResult;
          const [assetAddresses, thesisInfos] = result;
          
          // Check if both arrays exist and are valid
          if (thesisInfos && Array.isArray(thesisInfos) && assetAddresses && Array.isArray(assetAddresses)) {
            // Map asset infos with their corresponding addresses
            const convertedTheses: ThesisInfo[] = thesisInfos.map((asset: any, index) => {
              // Convert costInNativeInWei (BigInt) to ETH string
              const costInWei = asset.costInNativeInWei;
              const costInEth = costInWei ? (Number(costInWei) / Math.pow(10, 18)).toString() : "0";
              
              return {
                title: asset.title,
                cid: asset.cid,
                address: assetAddresses[index] || '0x0000000000000000000000000000000000000000',
                author: asset.author,
                description: asset.description,
                costInNative: costInEth,
              };
            });
            
            setAllThesis(convertedTheses);
          } else {
            console.error('❌ Invalid data structure:', { assetAddresses, thesisInfos });
            setAllThesis([]);
          }
        } catch (error) {
          console.error('❌ Error processing thesis data:', error);
          setAllThesis([]);
        }
      }
      setIsAllThesisLoading(false);
    } else {
        setIsAllThesisLoading(true);
    }
  }, [isAllThesisInfoLoading, allThesisInfo]);

  const refetchThesis = () => {
    refetchTotalThesis();
  };

  return { allThesis, isAllThesisLoading, refetchThesis };
};