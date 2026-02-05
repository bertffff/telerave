import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWTPayload, VideoPlatform } from '../types';
import { RoomModel } from '../models/Room';
import { MessageModel } from '../models/Message';
import { UserModel } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface SocketWithAuth extends Socket {
  userId?: string;
  currentRoomId?: string;
}

export class SocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware() {
    // Аутентификация через WebSocket
    this.io.use((socket: SocketWithAuth, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        socket.userId = decoded.userId;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupHandlers() {
    this.io.on('connection', (socket: SocketWithAuth) => {
      console.log(`User connected: ${socket.userId}`);

      // Присоединение к комнате
      socket.on('room:join', async (data: { roomId: string; password?: string }) => {
        try {
          const { roomId } = data;
          const userId = socket.userId!;

          const room = await RoomModel.findById(roomId);
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          // Проверяем, есть ли уже пользователь в комнате
          const participants = await RoomModel.getParticipants(roomId);
          const isAlreadyInRoom = participants.some(p => p.id === userId);

          if (!isAlreadyInRoom) {
            const currentCount = participants.length;
            if (currentCount >= room.max_participants) {
              socket.emit('error', { message: 'Room is full' });
              return;
            }

            await RoomModel.addParticipant(roomId, userId);
          }

          // Присоединяемся к Socket.IO комнате
          socket.join(roomId);
          socket.currentRoomId = roomId;

          // Отправляем текущее состояние комнаты
          socket.emit('room:update', room);

          // Отправляем список участников
          const updatedParticipants = await RoomModel.getParticipants(roomId);
          this.io.to(roomId).emit('room:participants', updatedParticipants);

          // Системное сообщение о присоединении
          const user = await UserModel.findById(userId);
          if (user) {
            const systemMessage = await MessageModel.create({
              room_id: roomId,
              user_id: userId,
              content: `${user.first_name} joined the room`,
              type: 'system' as any,
            });

            this.io.to(roomId).emit('chat:new_message', {
              ...systemMessage,
              user,
            });
          }
        } catch (error) {
          console.error('Join room error:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Выход из комнаты
      socket.on('room:leave', async (data: { roomId: string }) => {
        try {
          const { roomId } = data;
          const userId = socket.userId!;

          await RoomModel.removeParticipant(roomId, userId);
          socket.leave(roomId);

          const user = await UserModel.findById(userId);
          if (user) {
            const systemMessage = await MessageModel.create({
              room_id: roomId,
              user_id: userId,
              content: `${user.first_name} left the room`,
              type: 'system' as any,
            });

            this.io.to(roomId).emit('chat:new_message', {
              ...systemMessage,
              user,
            });
          }

          const updatedParticipants = await RoomModel.getParticipants(roomId);
          this.io.to(roomId).emit('room:participants', updatedParticipants);
        } catch (error) {
          console.error('Leave room error:', error);
        }
      });

      // Воспроизведение видео
      socket.on('video:play', async (data: { roomId: string }) => {
        try {
          const { roomId } = data;
          const userId = socket.userId!;

          const isHost = await RoomModel.isHost(roomId, userId);
          if (!isHost) {
            socket.emit('error', { message: 'Only host can control playback' });
            return;
          }

          const room = await RoomModel.updateVideoState(roomId, { is_playing: true });
          this.io.to(roomId).emit('video:state_changed', {
            isPlaying: true,
            currentTime: room.current_time,
          });
        } catch (error) {
          console.error('Play video error:', error);
        }
      });

      // Пауза видео
      socket.on('video:pause', async (data: { roomId: string }) => {
        try {
          const { roomId } = data;
          const userId = socket.userId!;

          const isHost = await RoomModel.isHost(roomId, userId);
          if (!isHost) {
            socket.emit('error', { message: 'Only host can control playback' });
            return;
          }

          const room = await RoomModel.updateVideoState(roomId, { is_playing: false });
          this.io.to(roomId).emit('video:state_changed', {
            isPlaying: false,
            currentTime: room.current_time,
          });
        } catch (error) {
          console.error('Pause video error:', error);
        }
      });

      // Перемотка видео
      socket.on('video:seek', async (data: { roomId: string; time: number }) => {
        try {
          const { roomId, time } = data;
          const userId = socket.userId!;

          const isHost = await RoomModel.isHost(roomId, userId);
          if (!isHost) {
            socket.emit('error', { message: 'Only host can control playback' });
            return;
          }

          const room = await RoomModel.updateVideoState(roomId, { current_time: time });
          this.io.to(roomId).emit('video:state_changed', {
            isPlaying: room.is_playing,
            currentTime: time,
          });
        } catch (error) {
          console.error('Seek video error:', error);
        }
      });

      // Смена видео
      socket.on('video:change', async (data: {
        roomId: string;
        url: string;
        platform: VideoPlatform;
      }) => {
        try {
          const { roomId, url, platform } = data;
          const userId = socket.userId!;

          const isHost = await RoomModel.isHost(roomId, userId);
          if (!isHost) {
            socket.emit('error', { message: 'Only host can change video' });
            return;
          }

          const room = await RoomModel.updateVideoState(roomId, {
            video_url: url,
            video_platform: platform,
            current_time: 0,
            is_playing: false,
          });

          this.io.to(roomId).emit('room:update', room);
        } catch (error) {
          console.error('Change video error:', error);
        }
      });

      // Отправка сообщения
      socket.on('chat:message', async (data: { roomId: string; content: string }) => {
        try {
          const { roomId, content } = data;
          const userId = socket.userId!;

          if (!content || content.trim().length === 0) {
            return;
          }

          if (content.length > 1000) {
            socket.emit('error', { message: 'Message too long' });
            return;
          }

          const message = await MessageModel.create({
            room_id: roomId,
            user_id: userId,
            content: content.trim(),
          });

          const user = await UserModel.findById(userId);
          await UserModel.incrementStat(userId, 'messages_sent');

          this.io.to(roomId).emit('chat:new_message', {
            ...message,
            user,
          });
        } catch (error) {
          console.error('Send message error:', error);
        }
      });

      // Отключение
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.userId}`);

        if (socket.currentRoomId && socket.userId) {
          const participants = await RoomModel.getParticipants(socket.currentRoomId);
          this.io.to(socket.currentRoomId).emit('room:participants', participants);
        }
      });
    });
  }
}
