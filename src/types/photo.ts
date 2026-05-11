export interface Comment {
  id: string;
  author: string;
  body: string;
  score: number;
}

export interface Comment {
  id: string;
  author: string | null;
  body: string | null;
  score: number;
  replies?: Comment[];
}

export interface Photo {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sourceUrl?: string;
  author?: string;
  postedAt: string;
  upvotes: number;
  year?: string;
  location?: string;
  comments: Comment[];
}