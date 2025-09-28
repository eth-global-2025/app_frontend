import { WalletClient } from 'viem'
import { ethers, JsonRpcSigner } from 'ethers'
import lighthouse from '@lighthouse-web3/sdk'
import kavach from "@lighthouse-web3/kavach"

export type PaperMeta = {
    cid: string
    title: string
    description?: string
    priceEth: string
    owner: string
}

export type UploadResult = {
  cid: string
  name: string
  size: string
}

export async function signAuthMessageWithPrivateKey() {
  const signer = new ethers.Wallet(import.meta.env.VITE_PRIVATE_KEY)

  const authMessage = await kavach.getAuthMessage(signer.address)
  const signedMessage = await signer.signMessage(authMessage.message)
  return({signedMessage, signerAddress: signer.address})
}

export async function uploadEncryptedPdf(params: { file: File; signer: JsonRpcSigner | WalletClient }) {
  const { file, signer } = params
  const { signedMessage, signerAddress } = await signAuthMessageWithPrivateKey()
  const out = await lighthouse.uploadEncrypted([file], import.meta.env.VITE_LIGHTHOUSE_API_KEY, signerAddress, signedMessage)
  
  const data: any = (out as any)?.data ?? out
  let list: any[]
  if (Array.isArray(data)) {
    list = data
  } else if (data && typeof data === 'object') {
    list = [data]
  } else {
    throw new Error('Unexpected Lighthouse response')
  }
  
  const results = list.map((d) => {
    const hash = d.Hash || d.hash || d.cid
    return {
      cid: hash,
      name: d.Name || d.name || file.name,
      size: d.Size || d.size || ''
    } as UploadResult
  })
  
  return results
}

export type AccessCondition = Array<{
  id: number
  chain: string
  method: string
  standardContractType: 'ERC20' | 'ERC721' | 'ERC1155' | 'Custom' | ''
  contractAddress?: string
  returnValueTest: { comparator: '>=' | '==' | '<'; value: string }
  parameters?: any[]
  inputArrayType?: string[]
  outputType?: string
}>

export async function applyAccessConditions(params: { cid: string; conditions: AccessCondition; signer: JsonRpcSigner | WalletClient }) {
  const { cid, conditions, signer } = params
  const { signedMessage, signerAddress } = await signAuthMessageWithPrivateKey()
  const res = await (lighthouse as any).applyAccessCondition(import.meta.env.VITE_LIGHTHOUSE_API_KEY, cid, conditions, signerAddress, signedMessage)
  return res
}

export async function fetchDecryptionKey(cid: string, signer: JsonRpcSigner | WalletClient) {
  const { signedMessage, signerAddress } = await signAuthMessageWithPrivateKey()
  return lighthouse.fetchEncryptionKey(cid, signerAddress, signedMessage)
}

export async function decryptPdfBlob(cid: string, signer: JsonRpcSigner | WalletClient) {
  const keyRes = await fetchDecryptionKey(cid, signer)
  const file = await lighthouse.decryptFile(cid, keyRes.data.key, 'application/pdf')
  return new Blob([file], { type: 'application/pdf' })
}

export async function listUploadsViaApiKey(): Promise<PaperMeta[]> {
  const res = await lighthouse.getUploads(import.meta.env.VITE_LIGHTHOUSE_API_KEY, null)
  const fileList: any[] = res?.data?.fileList || []
  return fileList
    .map((f) => ({
      cid: f.Hash || f.hash || f.cid,
      title: f.Name || f.name || 'Untitled PDF',
      description: f.description || '',
      priceEth: '0.01',
      owner: f.publicKey || f.owner || ''
    } as PaperMeta))
}

export async function shareFile(cid: string, address: string) {
  const {signedMessage, signerAddress} = await signAuthMessageWithPrivateKey()
  const res = await lighthouse.shareFile(signerAddress, [address], cid, signedMessage)
  return res
}

export async function imposeAccessConditions(cid: string, tokenAddress: string) {
  const { signedMessage, signerAddress } = await signAuthMessageWithPrivateKey()

  // Conditions to add
  const conditions = [
    {
      id: 1,
      chain: "Sepolia",
      method: "balanceOf",
      standardContractType: "ERC20",
      contractAddress: tokenAddress,
      returnValueTest: {
        comparator: ">",
        value: "0"
      },
      parameters: [":userAddress"],
      inputArrayType: [],
      outputType: "uint256"
    },
  ]

  const aggregator = "([1])"

  const res = await lighthouse.applyAccessCondition(signerAddress, cid, signedMessage, conditions, aggregator)
  return res
}