import { create } from 'zustand';
import { User, Room, Message } from '@/types';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;

  // Current Room
  currentRoom: Room | null;
  participants: User[];
  messages: Message[];
  setCurrentRoom: (room: Room | null) => void;
  setParticipants: (participants: User[]) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;

  // Video State
  isPlaying: boolean;
  currentTime: number;
  setVideoState: (isPlaying: boolean, currentTime: number) => void;

  // UI State
  isChatOpen: boolean;
  isVoiceEnabled: boolean;
  toggleChat: () => void;
  toggleVoice: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      currentRoom: null,
      participants: [],
      messages: [],
    });
  },

  // Current Room
  currentRoom: null,
  participants: [],
  messages: [],
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setParticipants: (participants) => set({ participants }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMessages: (messages) => set({ messages }),

  // Video State
  isPlaying: false,
  currentTime: 0,
  setVideoState: (isPlaying, currentTime) => set({ isPlaying, currentTime }),

  // UI State
  isChatOpen: true,
  isVoiceEnabled: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  toggleVoice: () => set((state) => ({ isVoiceEnabled: !state.isVoiceEnabled })),
}));
