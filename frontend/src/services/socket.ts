import { io, Socket } from 'socket.io-client';
import { Room, Message, User, VideoPlatform, VideoState } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit('disconnected');
    });

    this.socket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
      this.emit('error', data);
    });

    this.socket.on('room:update', (data: Room) => {
      this.emit('room:update', data);
    });

    this.socket.on('room:participants', (data: User[]) => {
      this.emit('room:participants', data);
    });

    this.socket.on('chat:new_message', (data: Message) => {
      this.emit('chat:new_message', data);
    });

    this.socket.on('video:state_changed', (data: VideoState) => {
      this.emit('video:state_changed', data);
    });
  }

  // Event emitter pattern
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  // Room events
  joinRoom(roomId: string, password?: string): void {
    this.socket?.emit('room:join', { roomId, password });
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit('room:leave', { roomId });
  }

  // Video control events
  playVideo(roomId: string): void {
    this.socket?.emit('video:play', { roomId });
  }

  pauseVideo(roomId: string): void {
    this.socket?.emit('video:pause', { roomId });
  }

  seekVideo(roomId: string, time: number): void {
    this.socket?.emit('video:seek', { roomId, time });
  }

  changeVideo(roomId: string, url: string, platform: VideoPlatform): void {
    this.socket?.emit('video:change', { roomId, url, platform });
  }

  // Chat events
  sendMessage(roomId: string, content: string): void {
    this.socket?.emit('chat:message', { roomId, content });
  }

  // Voice events
  toggleVoice(roomId: string, enabled: boolean): void {
    this.socket?.emit('voice:toggle', { roomId, enabled });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
