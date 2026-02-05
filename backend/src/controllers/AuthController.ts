import { Response } from 'express';
import { AuthRequest, verifyTelegramWebAppData, generateToken } from '../middleware/auth';
import { UserModel } from '../models/User';

export class AuthController {
  // Аутентификация через Telegram Web App
  static async telegramAuth(req: AuthRequest, res: Response) {
    try {
      const { initData } = req.body;

      if (!initData) {
        return res.status(400).json({ error: 'initData is required' });
      }

      // Проверяем подлинность данных от Telegram
      const telegramUser = verifyTelegramWebAppData(initData);

      if (!telegramUser) {
        return res.status(401).json({ error: 'Invalid Telegram data' });
      }

      // Ищем или создаем пользователя
      let user = await UserModel.findByTelegramId(telegramUser.id);

      if (!user) {
        user = await UserModel.create({
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          photo_url: telegramUser.photo_url,
        });
      }

      // Обновляем последнюю активность
      await UserModel.updateLastActive(user.id);

      // Генерируем JWT токен
      const token = generateToken({
        userId: user.id,
        telegramId: user.telegram_id,
      });

      return res.json({
        token,
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          photo_url: user.photo_url,
        },
      });
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Получение информации о текущем пользователе
  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await UserModel.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url,
        created_at: user.created_at,
        last_active: user.last_active,
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Получение статистики пользователя
  static async getUserStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const stats = await UserModel.getStats(req.user.userId);
      return res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
