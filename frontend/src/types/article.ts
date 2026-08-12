export interface Article {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  summary: string;
  body: string;
  likes: number;
  liked: boolean;
  views: number;
}
