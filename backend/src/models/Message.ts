import pool from '../config/database';
import { Message, MessageType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class MessageModel {
  static async create(data: {
    room_id: string;
    user_id: string;
    content: string;
    type?: MessageType;
  }): Promise<Message> {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO messages (id, room_id, user_id, content, type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, data.room_id, data.user_id, data.content, data.type || MessageType.TEXT]
    );
    return result.rows[0];
  }

  static async getRecentMessages(roomId: string, limit: number = 50): Promise<Message[]> {
    const result = await pool.query(
      `SELECT m.*, 
              json_build_object(
                'id', u.id,
                'telegram_id', u.telegram_id,
                'username', u.username,
                'first_name', u.first_name,
                'last_name', u.last_name,
                'photo_url', u.photo_url
              ) as user
       FROM messages m
       INNER JOIN users u ON m.user_id = u.id
       WHERE m.room_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2`,
      [roomId, limit]
    );
    return result.rows.reverse();
  }

  static async deleteOldMessages(daysOld: number = 7): Promise<number> {
    const result = await pool.query(
      `DELETE FROM messages
       WHERE created_at < NOW() - INTERVAL '${daysOld} days'
       RETURNING id`
    );
    return result.rowCount || 0;
  }
}
