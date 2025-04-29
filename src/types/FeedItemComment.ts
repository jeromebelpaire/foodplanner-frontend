export interface FeedItemComment {
  id: number;
  feed_item: number; // ID of the parent FeedItem
  user_username: string;
  text: string;
  created_at: string;
  updated_at: string;
}
