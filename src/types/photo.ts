export interface Comment {
  id: string;
  author: string;
  body: string;
  score: number;
}

export interface Photo {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
  author: string;
  postedAt: string;
  upvotes: number;
  year?: string;
  location?: string;
  comments: Comment[];
}