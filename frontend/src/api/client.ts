import axios from 'axios';
import { User, Room, Message, UserStats, CreateRoomData } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  telegramAuth: (initData: string) =>
    api.post<{ token: string; user: User }>('/auth/telegram', { initData }),

  getCurrentUser: () => api.get<User>('/auth/me'),

  getUserStats: () => api.get<UserStats>('/auth/stats'),
};

export const roomApi = {
  createRoom: (data: CreateRoomData) => api.post<Room>('/rooms', data),

  getPublicRooms: (limit?: number) =>
    api.get<Room[]>('/rooms', { params: { limit } }),

  getRoom: (roomId: string) =>
    api.get<Room & { participants: User[] }>(`/rooms/${roomId}`),

  joinRoom: (roomId: string, password?: string) =>
    api.post(`/rooms/${roomId}/join`, { password }),

  leaveRoom: (roomId: string) => api.post(`/rooms/${roomId}/leave`),

  getRoomMessages: (roomId: string, limit?: number) =>
    api.get<Message[]>(`/rooms/${roomId}/messages`, { params: { limit } }),
};

export default api;
