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
  });

  useEffect(() => {
    if (!isAllUserThesisInfoLoading && !isAllThesisLoading && allThesis.length > 0 && allUserThesisInfo) {
      const userAssets = allThesis.filter((thesis) => allUserThesisInfo.some((userAsset) => userAsset.tokenAddress === thesis.address));
      
      if (userAssets) {
        const convertedUserAssets: ThesisInfo[] = userAssets.map((thesis: any) => ({
          cid: thesis.cid,
          title: thesis.title,
          address: thesis.address,
          author: thesis.author,
          description: thesis.description,
          costInNative: thesis.costInNative,
        }));
        setAllUserThesis(convertedUserAssets);
      }
      setIsAllUserThesisLoading(false);
    } else if (isAllUserThesisInfoLoading || isAllThesisLoading) {
      setIsAllUserThesisLoading(true);
    }
  }, [isAllUserThesisInfoLoading, isAllThesisLoading, allThesis, allUserThesisInfo]);

  const refetchUserThesis = () => {
    refetchTotalUserThesis();
  };

  return { allUserThesis, isAllUserThesisLoading, refetchUserThesis };
};