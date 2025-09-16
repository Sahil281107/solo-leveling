export interface User {
  user_id: number;
  email: string;
  username: string;
  user_type: 'adventurer' | 'coach';
  profile_photo_url?: string;
}

export interface JwtPayload {
  user_id: number;
  email: string;
  user_type: string;
}