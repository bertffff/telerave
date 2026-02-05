export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  created_at: string;
  last_active: string;
}

export interface Room {
  id: string;
  name: string;
  host_id: string;
  video_url: string | null;
  video_platform: VideoPlatform;
  current_time: number;
  is_playing: boolean;
  max_participants: number;
  is_public: boolean;
  password: string | null;
  created_at: string;
  updated_at: string;
  participant_count?: number;
  participants?: User[];
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  type: MessageType;
  created_at: string;
  user?: User;
}

export interface UserStats {
  user_id: string;
  total_watch_time: number;
  rooms_created: number;
  rooms_joined: number;
  messages_sent: number;
  achievements: string[];
}

export enum VideoPlatform {
  YOUTUBE = 'youtube',
  TWITCH = 'twitch',
  CUSTOM = 'custom',
  KINOPOISK = 'kinopoisk',
  IFRAME = 'iframe'
}

export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
  EMOJI = 'emoji'
}

export interface CreateRoomData {
  name: string;
  isPublic: boolean;
  maxParticipants: number;
  password?: string;
}

export interface VideoState {
  isPlaying: boolean;
  currentTime: number;
}
