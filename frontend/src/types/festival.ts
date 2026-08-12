export interface FestivalEvent {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  place: string;
  time: string;
  petFriendly: boolean;
  condition?: string;
  webUrl?: string;
  instagramUrl?: string;
}
