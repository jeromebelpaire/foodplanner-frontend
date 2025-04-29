export interface SearchedUser {
  id: number;
  username: string;
  is_following: boolean;
  // Add other relevant fields if the backend serializer includes them (e.g., profile picture URL)
  // profile_picture?: string | null;
}
