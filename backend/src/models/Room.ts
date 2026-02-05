import pool from '../config/database';
import { Room, User, VideoPlatform } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class RoomModel {
  static async create(data: {
    name: string;
    host_id: string;
    is_public: boolean;
    max_participants: number;
    password?: string;
  }): Promise<Room> {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO rooms (id, name, host_id, is_public, max_participants, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, data.name, data.host_id, data.is_public, data.max_participants, data.password || null]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Room | null> {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findPublicRooms(limit: number = 20): Promise<Room[]> {
    const result = await pool.query(
      `SELECT r.*, COUNT(rp.user_id) as participant_count
       FROM rooms r
       LEFT JOIN room_participants rp ON r.id = rp.room_id
       WHERE r.is_public = true
       GROUP BY r.id
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  static async updateVideoState(
    roomId: string,
    data: {
      video_url?: string;
      video_platform?: VideoPlatform;
      current_time?: number;
      is_playing?: boolean;
    }
  ): Promise<Room> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.video_url !== undefined) {
      updates.push(`video_url = $${paramCount++}`);
      values.push(data.video_url);
    }
    if (data.video_platform !== undefined) {
      updates.push(`video_platform = $${paramCount++}`);
      values.push(data.video_platform);
    }
    if (data.current_time !== undefined) {
      updates.push(`current_time = $${paramCount++}`);
      values.push(data.current_time);
    }
    if (data.is_playing !== undefined) {
      updates.push(`is_playing = $${paramCount++}`);
      values.push(data.is_playing);
    }

    updates.push(`updated_at = NOW()`);
    values.push(roomId);

    const result = await pool.query(
      `UPDATE rooms SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async getParticipants(roomId: string): Promise<User[]> {
    const result = await pool.query(
      `SELECT u.* FROM users u
       INNER JOIN room_participants rp ON u.id = rp.user_id
       WHERE rp.room_id = $1
       ORDER BY rp.joined_at ASC`,
      [roomId]
    );
    return result.rows;
  }

  static async addParticipant(roomId: string, userId: string): Promise<void> {
    await pool.query(
      `INSERT INTO room_participants (room_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (room_id, user_id) DO NOTHING`,
      [roomId, userId]
    );
  }

  static async removeParticipant(roomId: string, userId: string): Promise<void> {
    await pool.query(
      'DELETE FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );
  }

  static async getParticipantCount(roomId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM room_participants WHERE room_id = $1',
      [roomId]
    );
    return parseInt(result.rows[0].count);
  }

  static async deleteInactiveRooms(hoursInactive: number = 24): Promise<number> {
    const result = await pool.query(
      `DELETE FROM rooms
       WHERE updated_at < NOW() - INTERVAL '${hoursInactive} hours'
       RETURNING id`
    );
    return result.rowCount || 0;
  }

  static async isHost(roomId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM rooms WHERE id = $1 AND host_id = $2',
      [roomId, userId]
    );
    return result.rows.length > 0;
  }
}
