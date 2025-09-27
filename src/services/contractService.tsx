import { ThesisHubToken } from "@/contracts/ThesisHubToken";
import { ThesisHubMaster } from "@/contracts/ThesisHubMaster";
import { useWriteContract, useAccount, useWaitForTransactionReceipt, useReadContract, usePublicClient } from "wagmi";
import { useEffect, useState } from "react";
import { sepolia } from "wagmi/chains";
import { shareFile, imposeAccessConditions } from "@/services/lighthouse";

export const useAddThesis = () => {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, isError, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({hash});
  const publicClient = usePublicClient();
  const [pendingCid, setPendingCid] = useState<string | null>(null);

  // Handle access conditions when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && hash && pendingCid) {
      handleAccessConditions(hash, pendingCid);
      setPendingCid(null); // Reset after handling
    }
  }, [isConfirmed, hash, pendingCid]);

  // Function to handle access conditions after transaction confirmation
  const handleAccessConditions = async (transactionHash: `0x${string}`, cid: string) => {
    if (!publicClient) {
      console.error("Public client not available");
      return;
    }

    try {
      // Get transaction receipt to extract token address from event logs
      const receipt = await publicClient.getTransactionReceipt({ hash: transactionHash });
      
      if (!receipt) {
        console.error("Transaction receipt not found");
        return;
      }

      // Get event logs for ThesisAdded event
      const eventLogs = await publicClient.getLogs({
        address: ThesisHubMaster.address as `0x${string}`,
        event: {
          type: 'event',
          name: 'ThesisAdded',
          inputs: [
            { name: '_title', type: 'string', indexed: false },
            { name: '_cid', type: 'string', indexed: false },
            { name: '_tokenAddress', type: 'address', indexed: false },
            { name: '_author', type: 'address', indexed: false },
            { name: '_costInNativeInWei', type: 'uint256', indexed: false },
            { name: '_description', type: 'string', indexed: false },
          ],
        },
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      if (eventLogs.length === 0) {
        console.error("ThesisAdded event not found in transaction logs");
        return;
      }

      // Get the token address from the first ThesisAdded event
      const thesisAddedEvent = eventLogs[0];
      const tokenAddress = (thesisAddedEvent.args as any)._tokenAddress;
      
      if (!tokenAddress) {
        console.error("Token address not found in event");
        return;
      }
      
      // Impose access conditions
      await imposeAccessConditions(cid, tokenAddress);

    } catch (error) {
      console.error("Error setting access conditions:", error);
      // Don't throw - this is a bonus feature, thesis creation was successful
    }
  };

  const addThesis = async (thesisData: { salt: string, title: string, cid: string, author: string, description: string, costInNative: string }) => {
    if (!address) {
      throw new Error("No account connected");
    }

    // Convert salt to bytes32 format (32 bytes, padded with zeros)
    const saltBytes32 = `0x${thesisData.salt.padStart(64, '0')}` as `0x${string}`;
    
    // Convert ETH to wei (1 ETH = 10^18 wei)
    const costInWei = Math.floor(parseFloat(thesisData.costInNative) * Math.pow(10, 18));

    try {
      const result = await writeContract({
        address: ThesisHubMaster.address as `0x${string}`,
        abi: ThesisHubMaster.abi,
        functionName: 'addThesis',
        args: [saltBytes32, {
          cid: thesisData.cid,
          title: thesisData.title,
          author: thesisData.author as `0x${string}`,
          description: thesisData.description,
          costInNativeInWei: BigInt(costInWei)
        }],
        account: address,
        chain: sepolia,
      });

      // Store the CID to handle access conditions after confirmation
      setPendingCid(thesisData.cid);
      
      // The transaction has been submitted, we need to wait for confirmation to get the token address
      // Access conditions will be handled automatically when the transaction is confirmed
      return result;

    } catch (error: any) {
      console.error("Error in addThesis:", error);
      if (error.message?.includes("user rejected")) {
        throw new Error("Transaction was rejected by user");
      }
      throw error;
    }
  };

  return {
    addThesis,
    isPending,
    isSuccess,
    isError,
    isConfirming,
    isConfirmed,
    hash
  };
};

export const useBuyThesis = () => {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, isError, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({hash});

  const buyThesis = async (tokenAddress: `0x${string}`, costInWei: bigint, cid?: string) => {
    if (!address) {
      throw new Error("No account connected");
    }

    try {
      await writeContract({
        address: ThesisHubMaster.address as `0x${string}`,
        abi: ThesisHubMaster.abi,
        functionName: 'buyToken',
        args: [tokenAddress, BigInt(1)], // Buy 1 token
        account: address,
        chain: sepolia,
        value: costInWei, // Send the cost in wei
      });

      // If CID is provided, share the file with the buyer
      if (cid) {
        try {
          await shareFile(cid, address);
        } catch (shareError) {
          console.error("Error sharing file:", shareError);
          // Don't throw here - the purchase was successful, sharing is a bonus
          // The user can still access the file through other means
        }
      }

      return true;

    } catch (error: any) {
      console.error("Error in buyThesis:", error);
      if (error.message?.includes("user rejected")) {
        throw new Error("Transaction was rejected by user");
      }
      throw error;
    }
  };

  return {
    buyThesis,
    isPending,
    isSuccess,
    isError,
    isConfirming,
    isConfirmed,
    hash
  };
};