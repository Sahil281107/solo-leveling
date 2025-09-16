export interface User {
  user_id: number;
  email: string;
  username: string;
  user_type: 'adventurer' | 'coach';
  profile_photo_url?: string;
}

export interface AdventurerProfile {
  full_name: string;
  field_of_interest: string;
  current_level: number;
  total_exp: number;
  current_exp: number;
  exp_to_next_level: number;
  streak_days: number;
}

export interface Quest {
  active_quest_id: number;
  quest_title: string;
  quest_type: string;
  base_xp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_completed: boolean;
  expires_at: string;
  related_stat?: string;
}

export interface Stat {
  stat_name: string;
  stat_icon: string;
  current_value: number;
  max_value: number;
}

export interface Student {
  user_id: number;
  username: string;
  full_name: string;
  field_of_interest: string;
  current_level: number;
  total_exp: number;
  streak_days: number;
}export interface User {
  user_id: number;
  email: string;
  username: string;
  user_type: 'adventurer' | 'coach';
  profile_photo_url?: string;
}

export interface AdventurerProfile {
  full_name: string;
  field_of_interest: string;
  current_level: number;
  total_exp: number;
  current_exp: number;
  exp_to_next_level: number;
  streak_days: number;
}

export interface Quest {
  active_quest_id: number;
  quest_title: string;
  quest_type: string;
  base_xp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_completed: boolean;
  expires_at: string;
  related_stat?: string;
}

export interface Stat {
  stat_name: string;
  stat_icon: string;
  current_value: number;
  max_value: number;
}

export interface Student {
  user_id: number;
  username: string;
  full_name: string;
  field_of_interest: string;
  current_level: number;
  total_exp: number;
  streak_days: number;
}export interface User {
  user_id: number;
  email: string;
  username: string;
  user_type: 'adventurer' | 'coach';
  profile_photo_url?: string;
}

export interface AdventurerProfile {
  full_name: string;
  field_of_interest: string;
  current_level: number;
  total_exp: number;
  current_exp: number;
  exp_to_next_level: number;
  streak_days: number;
}

export interface Quest {
  active_quest_id: number;
  quest_title: string;
  quest_type: string;
  base_xp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_completed: boolean;
  expires_at: string;
  related_stat?: string;
}

export interface Stat {
  stat_name: string;
  stat_icon: string;
  current_value: number;
  max_value: number;
}

export interface Student {
  user_id: number;
  username: string;
  full_name: string;
  field_of_interest: string;
  current_level: number;
  total_exp: number;
  streak_days: number;
}export interface User {
  user_id: number;
  email: string;
  username: string;
  user_type: 'adventurer' | 'coach';
  profile_photo_url?: string;
}

export interface AdventurerProfile {
  full_name: string;
  field_of_interest: string;
  current_level: number;
  total_exp: number;
  current_exp: number;
  exp_to_next_level: number;
  streak_days: number;
}

export interface Quest {
  active_quest_id: number;
  quest_title: string;
  quest_type: string;
  base_xp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_completed: boolean;
  expires_at: string;
  related_stat?: string;
}

export interface Stat {
  stat_name: string;
  stat_icon: string;
  current_value: number;
  max_value: number;
}

export interface Student {
  user_id: number;
  username: string;
  full_name: string;
  field_of_interest: string;
  current_level: number;
  total_exp: number;
  streak_days: number;
}