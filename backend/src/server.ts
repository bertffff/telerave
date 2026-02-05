import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';
import { SocketHandler } from './socket/SocketHandler';
import { connectRedis } from './config/redis';
import { apiLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 1e6, // 1MB
  pingTimeout: 60000,
  pingInterval: 25000,
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api', routes);

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Инициализация Socket.IO
new SocketHandler(io);

// Запуск сервера
async function start() {
  try {
    // Подключение к Redis
    await connectRedis();
    console.log('✅ Redis connected');

    // Запуск сервера
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`🔗 WebSocket enabled`);
    });

    // Периодическая очистка неактивных комнат (каждый час)
    setInterval(async () => {
      const { RoomModel } = await import('./models/Room');
      const deleted = await RoomModel.deleteInactiveRooms(24);
      if (deleted > 0) {
        console.log(`🧹 Cleaned up ${deleted} inactive rooms`);
      }
    }, 60 * 60 * 1000);

    // Периодическая очистка старых сообщений (каждый день)
    setInterval(async () => {
      const { MessageModel } = await import('./models/Message');
      const deleted = await MessageModel.deleteOldMessages(7);
      if (deleted > 0) {
        console.log(`🧹 Cleaned up ${deleted} old messages`);
      }
    }, 24 * 60 * 60 * 1000);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});

start();
