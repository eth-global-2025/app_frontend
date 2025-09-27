import lighthouse from '@lighthouse-web3/sdk'
import { JsonRpcSigner } from 'ethers'
import { WalletClient } from 'viem'

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

export async function signAuthMessageWith(signer: JsonRpcSigner | WalletClient) {
  let address: string;
  let signature: string;

  if ('getAddress' in signer) {
    // JsonRpcSigner from ethers
    address = await signer.getAddress();
    const { data: { message } } = await lighthouse.getAuthMessage(address);
    if (!message) throw new Error('Failed to fetch auth message');
    signature = await signer.signMessage(message as string);
  } else {
    // WalletClient from viem
    address = signer.account?.address || '';
    if (!address) throw new Error('No account address found');
    const { data: { message } } = await lighthouse.getAuthMessage(address);
    if (!message) throw new Error('Failed to fetch auth message');
    signature = await signer.signMessage({ message: message as string, account: signer.account! });
  }

  return { signerAddress: address, signature };
}

export async function uploadEncryptedPdf(params: { file: File; signer: JsonRpcSigner | WalletClient }) {
  const { file, signer } = params
//   if (file.type !== 'application/pdf') throw new Error('Only PDF files are allowed')
//   if (typeof (file as any).arrayBuffer !== 'function') throw new Error('Invalid file input')
  const { signerAddress, signature } = await signAuthMessageWith(signer)
  // SDK supports File | File[] for browser; omit progress callback for compatibility
  const out = await lighthouse.uploadEncrypted([file], import.meta.env.VITE_LIGHTHOUSE_API_KEY, signerAddress, signature)
  console.log('Lighthouse upload response:', out)
  
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
    console.log('Extracted hash (CID):', hash)
    return {
      cid: hash,
      name: d.Name || d.name || file.name,
      size: d.Size || d.size || ''
    } as UploadResult
  })
  
  console.log('Returning upload results:', results)
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
  const { signerAddress, signature } = await signAuthMessageWith(signer)
  // Some SDKs use applyAccessCondition or setAccessConditions; using applyAccessCondition here
  // @ts-ignore - method name may vary across versions
  const res = await (lighthouse as any).applyAccessCondition(import.meta.env.VITE_LIGHTHOUSE_API_KEY, cid, conditions, signerAddress, signature)
  return res
}

export async function fetchDecryptionKey(cid: string, signer: JsonRpcSigner | WalletClient) {
  const { signerAddress, signature } = await signAuthMessageWith(signer)
  return lighthouse.fetchEncryptionKey(cid, signerAddress, signature)
}

export async function decryptPdfBlob(cid: string, signer: JsonRpcSigner | WalletClient) {
  const keyRes = await fetchDecryptionKey(cid, signer)
  // modern SDK supports decryptFile(cid, key, mime)
  // @ts-ignore
  const file = await lighthouse.decryptFile(cid, keyRes.data.key, 'application/pdf')
  return new Blob([file], { type: 'application/pdf' })
}

export async function listUploadsViaApiKey(): Promise<PaperMeta[]> {
  // Some SDK versions expose getUploads(apiKey, lastKey?)
  // @ts-ignore
  const res = await lighthouse.getUploads(import.meta.env.VITE_LIGHTHOUSE_API_KEY, null)
  console.log('Lighthouse getUploads response:', res)
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