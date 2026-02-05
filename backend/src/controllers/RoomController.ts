import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { RoomModel } from '../models/Room';
import { UserModel } from '../models/User';
import { MessageModel } from '../models/Message';
import bcrypt from 'bcryptjs';

export class RoomController {
  // Создание комнаты
  static async createRoom(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { name, isPublic, maxParticipants, password } = req.body;

      if (!name || name.length < 3 || name.length > 50) {
        return res.status(400).json({ error: 'Room name must be 3-50 characters' });
      }

      if (maxParticipants < 2 || maxParticipants > 100) {
        return res.status(400).json({ error: 'Max participants must be between 2 and 100' });
      }

      let hashedPassword: string | undefined;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const room = await RoomModel.create({
        name,
        host_id: req.user.userId,
        is_public: isPublic ?? true,
        max_participants: maxParticipants || 50,
        password: hashedPassword,
      });

      // Добавляем создателя в участники
      await RoomModel.addParticipant(room.id, req.user.userId);

      // Увеличиваем счетчик созданных комнат
      await UserModel.incrementStat(req.user.userId, 'rooms_created');

      return res.status(201).json(room);
    } catch (error) {
      console.error('Create room error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Получение списка публичных комнат
  static async getPublicRooms(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const rooms = await RoomModel.findPublicRooms(limit);
      return res.json(rooms);
    } catch (error) {
      console.error('Get rooms error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Получение информации о комнате
  static async getRoom(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params;
      const room = await RoomModel.findById(roomId);

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const participants = await RoomModel.getParticipants(roomId);
      const participantCount = participants.length;

      return res.json({
        ...room,
        participants,
        participant_count: participantCount,
      });
    } catch (error) {
      console.error('Get room error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Присоединение к комнате
  static async joinRoom(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { roomId } = req.params;
      const { password } = req.body;

      const room = await RoomModel.findById(roomId);

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Проверка пароля
      if (room.password && password) {
        const isPasswordValid = await bcrypt.compare(password, room.password);
        if (!isPasswordValid) {
          return res.status(403).json({ error: 'Invalid password' });
        }
      } else if (room.password && !password) {
        return res.status(403).json({ error: 'Password required' });
      }

      // Проверка лимита участников
      const currentCount = await RoomModel.getParticipantCount(roomId);
      if (currentCount >= room.max_participants) {
        return res.status(403).json({ error: 'Room is full' });
      }

      await RoomModel.addParticipant(roomId, req.user.userId);
      await UserModel.incrementStat(req.user.userId, 'rooms_joined');

      return res.json({ success: true, message: 'Joined room successfully' });
    } catch (error) {
      console.error('Join room error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Выход из комнаты
  static async leaveRoom(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { roomId } = req.params;
      await RoomModel.removeParticipant(roomId, req.user.userId);

      return res.json({ success: true, message: 'Left room successfully' });
    } catch (error) {
      console.error('Leave room error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Получение сообщений комнаты
  static async getRoomMessages(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const messages = await MessageModel.getRecentMessages(roomId, limit);
      return res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
