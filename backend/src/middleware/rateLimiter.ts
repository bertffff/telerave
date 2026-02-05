import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis';

// Общий rate limiter для API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Используем Redis для кластерных деплоев
  store: new RedisStore({
    // @ts-expect-error - проблема с типами в библиотеке
    client: redisClient,
    prefix: 'rl:api:',
  }),
});

// Строгий лимит для создания комнат
export const createRoomLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // максимум 10 комнат в час
  message: 'Too many rooms created, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - проблема с типами в библиотеке
    client: redisClient,
    prefix: 'rl:create:',
  }),
});

// Лимит для отправки сообщений
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 30, // максимум 30 сообщений в минуту
  message: 'Too many messages, please slow down.',
  skipSuccessfulRequests: false,
  store: new RedisStore({
    // @ts-expect-error - проблема с типами в библиотеке
    client: redisClient,
    prefix: 'rl:msg:',
  }),
});

// Лимит для аутентификации
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
