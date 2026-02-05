import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { RoomController } from '../controllers/RoomController';
import { authenticateToken } from '../middleware/auth';
import { createRoomLimiter, authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Auth routes
router.post('/auth/telegram', authLimiter, AuthController.telegramAuth);
router.get('/auth/me', authenticateToken, AuthController.getCurrentUser);
router.get('/auth/stats', authenticateToken, AuthController.getUserStats);

// Room routes
router.post('/rooms', authenticateToken, createRoomLimiter, RoomController.createRoom);
router.get('/rooms', RoomController.getPublicRooms);
router.get('/rooms/:roomId', RoomController.getRoom);
router.post('/rooms/:roomId/join', authenticateToken, RoomController.joinRoom);
router.post('/rooms/:roomId/leave', authenticateToken, RoomController.leaveRoom);
router.get('/rooms/:roomId/messages', RoomController.getRoomMessages);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
