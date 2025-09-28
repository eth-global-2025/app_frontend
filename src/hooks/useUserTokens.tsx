import { useState, useEffect } from "react";
import { ThesisInfo } from "@/types";
import { useAccount, useReadContract } from "wagmi";
import { ThesisHubMaster } from "@/contracts/ThesisHubMaster";
import { useAssets } from "./useThesis";

export const useUserThesis = () => {
  const { address } = useAccount();
  const [allUserThesis, setAllUserThesis] = useState<ThesisInfo[]>([]);
  const [isAllUserThesisLoading, setIsAllUserThesisLoading] = useState(true);
  const { allThesis, isAllThesisLoading, refetchThesis } = useAssets();
  
  const { data: allUserThesisInfo, isLoading: isAllUserThesisInfoLoading, refetch: refetchTotalUserThesis } = useReadContract({
    address: ThesisHubMaster.address as `0x${string}`,
    abi: ThesisHubMaster.abi,
    functionName: "getUserTokenData",
    args: [address],
    query: {
      enabled: !!address, // Only run the query if address exists
    },
  });

  useEffect(() => {
    if (!address) {
      // No address means no user data, set empty array and stop loading
      setAllUserThesis([]);
      setIsAllUserThesisLoading(false);
      return;
    }

    if (!isAllUserThesisInfoLoading && !isAllThesisLoading) {
      if (allUserThesisInfo && allUserThesisInfo.length > 0 && allThesis.length > 0) {
        const userAssets = allThesis.filter((thesis) => allUserThesisInfo.some((userAsset) => userAsset.tokenAddress === thesis.address));
        
        const convertedUserAssets: ThesisInfo[] = userAssets.map((thesis: any) => ({
          cid: thesis.cid,
          title: thesis.title,
          address: thesis.address,
          author: thesis.author,
          description: thesis.description,
          costInNative: thesis.costInNative,
        }));
        setAllUserThesis(convertedUserAssets);
      } else {
        // User has no purchases or no thesis available
        setAllUserThesis([]);
      }
      setIsAllUserThesisLoading(false);
    } else if (isAllUserThesisInfoLoading || isAllThesisLoading) {
      setIsAllUserThesisLoading(true);
    }
  }, [address, isAllUserThesisInfoLoading, isAllThesisLoading, allThesis, allUserThesisInfo]);

  const refetchUserThesis = () => {
    refetchTotalUserThesis();
  };

  return { allUserThesis, isAllUserThesisLoading, refetchUserThesis };
};