import pool from '../config/database';
import { User } from '../types';

export class UserModel {
  static async findByTelegramId(telegramId: number): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(userData: {
    telegram_id: number;
    username?: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
  }): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, photo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userData.telegram_id,
        userData.username || null,
        userData.first_name,
        userData.last_name || null,
        userData.photo_url || null
      ]
    );
    return result.rows[0];
  }

  static async updateLastActive(userId: string): Promise<void> {
    await pool.query(
      'UPDATE users SET last_active = NOW() WHERE id = $1',
      [userId]
    );
  }

  static async getStats(userId: string) {
    const result = await pool.query(
      'SELECT * FROM user_stats WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || {
      user_id: userId,
      total_watch_time: 0,
      rooms_created: 0,
      rooms_joined: 0,
      messages_sent: 0,
      achievements: []
    };
  }

  static async incrementStat(userId: string, stat: string, value: number = 1): Promise<void> {
    await pool.query(
      `INSERT INTO user_stats (user_id, ${stat})
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET ${stat} = user_stats.${stat} + $2`,
      [userId, value]
    );
  }
}
