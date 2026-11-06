export interface CommentItem {
  id: string;
  user: string;
  text: string;
  timeAgo: string;
}

export interface PostAuthor {
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  location: string;
  isFollowing: boolean;
}

export interface Post {
  id: string;
  author: PostAuthor;
  mediaUrl: string;
  mediaAlt: string;
  caption: string;
  tags?: string[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  timeAgo: string;
  likedByPreviewUser?: string;
  comments: CommentItem[];
}
