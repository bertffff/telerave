export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  created_at: Date;
  last_active: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface RoomParticipant {
  room_id: string;
  user_id: string;
  joined_at: Date;
  is_voice_enabled: boolean;
  role: ParticipantRole;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  type: MessageType;
  created_at: Date;
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

export enum ParticipantRole {
  HOST = 'host',
  MODERATOR = 'moderator',
  PARTICIPANT = 'participant'
}

export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
  EMOJI = 'emoji'
}

export interface SocketEvents {
  // Client to Server
  'room:join': (data: { roomId: string; password?: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'video:play': (data: { roomId: string }) => void;
  'video:pause': (data: { roomId: string }) => void;
  'video:seek': (data: { roomId: string; time: number }) => void;
  'video:change': (data: { roomId: string; url: string; platform: VideoPlatform }) => void;
  'chat:message': (data: { roomId: string; content: string }) => void;
  'voice:toggle': (data: { roomId: string; enabled: boolean }) => void;

  // Server to Client
  'room:update': (data: Room) => void;
  'room:participants': (data: User[]) => void;
  'chat:new_message': (data: Message & { user: User }) => void;
  'video:state_changed': (data: { isPlaying: boolean; currentTime: number }) => void;
  'error': (data: { message: string }) => void;
}

export interface JWTPayload {
  userId: string;
  telegramId: number;
  iat?: number;
  exp?: number;
}

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface CreateRoomData {
  name: string;
  isPublic: boolean;
  maxParticipants: number;
  password?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
}
