export interface ThesisInfo {
  cid: string;
  title: string;
  author: `0x${string}`;
  description: string;
  costInNative: string;
  address: `0x${string}`;
}

export interface Post {
  postId: string,
  postTitle: string,
  postCid: string,
  imageCid: string,
  owner: string,
  endTime: string,
  archived: boolean,
}

export interface Asset {
  assetTitle: string,
  assetCid: string,
  assetAddress: string,
  author: string,
  thumbnailCid?: string,
  description?: string,
  costInNative?: string,
}

export interface Comment {
  postId: string;
  commentCid: string;
  owner: string;
}

export interface CommentWithPostTitle {
  postId: string;
  commentCid: string;
  owner: string;
  postTitle: string;
}

export interface WalletState {
  address: string;
  isConnected: boolean;
}