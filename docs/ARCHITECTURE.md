# Архитектура WatchParty Telegram

## 🏗️ Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      Telegram Client                         │
│                  (Mini App / Web View)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS + WebSocket
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      Cloudflare                              │
│              (CDN, SSL, DDoS Protection)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                     │
│              - Route HTTP/WebSocket requests                 │
│              - Static file serving                           │
│              - Load balancing                                │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
           │ HTTP                         │ WebSocket
           │                              │
┌──────────▼─────────────┐    ┌──────────▼───────────────────┐
│  React Frontend        │    │    Node.js Backend           │
│  ─────────────────     │    │    ──────────────────        │
│  - Vite bundler        │    │    - Express.js              │
│  - React 18            │    │    - Socket.io server        │
│  - Zustand (state)     │    │    - JWT auth                │
│  - React Query         │    │    - Rate limiting           │
│  - Socket.io client    │    │    - API routes              │
│  - React Player        │    └──────┬─────────┬─────────────┘
└────────────────────────┘           │         │
                                     │         │
                    ┌────────────────┘         └────────────────┐
                    │                                           │
         ┌──────────▼──────────┐                   ┌───────────▼─────────┐
         │   PostgreSQL        │                   │      Redis          │
         │   ─────────────     │                   │      ──────         │
         │   - Users           │                   │      - Sessions     │
         │   - Rooms           │                   │      - Cache        │
         │   - Messages        │                   │      - Pub/Sub      │
         │   - Statistics      │                   │      - Rate limits  │
         └─────────────────────┘                   └─────────────────────┘
```

## 🔄 Поток данных

### Аутентификация
```
1. User открывает Mini App в Telegram
2. Telegram передает initData (подписанные данные пользователя)
3. Frontend отправляет initData на /api/auth/telegram
4. Backend проверяет подпись используя BOT_TOKEN
5. Backend создает/обновляет пользователя в БД
6. Backend генерирует JWT токен
7. Frontend сохраняет токен и использует для запросов
```

### Создание и присоединение к комнате
```
1. User создает комнату через UI
2. POST /api/rooms -> Backend создает запись в БД
3. User получает room ID
4. User открывает WebSocket соединение (с JWT в auth)
5. User отправляет событие 'room:join' с room ID
6. Backend проверяет права, добавляет в participants
7. Backend отправляет текущее состояние комнаты
8. Backend broadcast обновление всем участникам
```

### Синхронизация видео
```
┌──────────┐              ┌──────────┐              ┌──────────┐
│  Host    │              │  Server  │              │Participant│
└────┬─────┘              └────┬─────┘              └────┬─────┘
     │ play()                  │                         │
     ├────────────────────────>│                         │
     │                         │ video:state_changed     │
     │                         ├────────────────────────>│
     │                         │                         │
     │                         │                         │ play()
     │                         │                         │
     │ seek(120)               │                         │
     ├────────────────────────>│                         │
     │                         │ video:state_changed     │
     │                         ├────────────────────────>│
     │                         │                         │
     │                         │                         │ seek(120)
```

## 💾 Модель данных

### Users
```sql
- id: UUID (PK)
- telegram_id: BIGINT (UNIQUE)
- username: VARCHAR
- first_name: VARCHAR
- last_name: VARCHAR
- photo_url: TEXT
- created_at: TIMESTAMP
- last_active: TIMESTAMP
```

### Rooms
```sql
- id: UUID (PK)
- name: VARCHAR
- host_id: UUID (FK -> users)
- video_url: TEXT
- video_platform: VARCHAR
- current_time: FLOAT
- is_playing: BOOLEAN
- max_participants: INTEGER
- is_public: BOOLEAN
- password: VARCHAR (hashed)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Room_Participants
```sql
- room_id: UUID (PK, FK -> rooms)
- user_id: UUID (PK, FK -> users)
- joined_at: TIMESTAMP
- is_voice_enabled: BOOLEAN
- role: VARCHAR (host/moderator/participant)
```

### Messages
```sql
- id: UUID (PK)
- room_id: UUID (FK -> rooms)
- user_id: UUID (FK -> users)
- content: TEXT
- type: VARCHAR (text/system/emoji)
- created_at: TIMESTAMP
```

### User_Stats
```sql
- user_id: UUID (PK, FK -> users)
- total_watch_time: INTEGER
- rooms_created: INTEGER
- rooms_joined: INTEGER
- messages_sent: INTEGER
- achievements: TEXT[]
- updated_at: TIMESTAMP
```

## 🔌 WebSocket события

### Client -> Server
- `room:join` - Присоединиться к комнате
- `room:leave` - Покинуть комнату
- `video:play` - Воспроизвести видео (только host)
- `video:pause` - Поставить на паузу (только host)
- `video:seek` - Перемотать видео (только host)
- `video:change` - Сменить видео (только host)
- `chat:message` - Отправить сообщение
- `voice:toggle` - Включить/выключить голосовой чат

### Server -> Client
- `room:update` - Обновление состояния комнаты
- `room:participants` - Список участников
- `chat:new_message` - Новое сообщение в чате
- `video:state_changed` - Изменение состояния видео
- `error` - Ошибка

## 🎯 Оптимизации

### Backend
1. **Connection Pooling**: PostgreSQL pool с max 20 соединений
2. **Redis Caching**: Кэширование часто запрашиваемых данных
3. **Rate Limiting**: 
   - API: 100 req/15min
   - Room Creation: 10 rooms/hour
   - Messages: 30 msg/min
4. **Automatic Cleanup**:
   - Неактивные комнаты: каждый час
   - Старые сообщения: каждый день
5. **WebSocket Optimization**:
   - Throttling video updates (1 раз в 2 сек)
   - Connection timeout: 60s
   - Ping interval: 25s

### Frontend
1. **Code Splitting**: Разделение на chunks для быстрой загрузки
2. **Lazy Loading**: Компоненты загружаются по требованию
3. **React Query**: Кэширование API запросов
4. **Zustand**: Легковесный state management
5. **Video Player**: ReactPlayer с оптимизацией для разных платформ

### Database
1. **Indexes**: На все FK и часто запрашиваемые поля
2. **Automatic vacuum**: Для оптимизации производительности
3. **Prepared Statements**: Защита от SQL injection
4. **Triggers**: Автоматическое обновление timestamps

### Infrastructure
1. **Nginx**: Reverse proxy, gzip compression, static caching
2. **Docker**: Контейнеризация для легкого деплоя
3. **Cloudflare**: CDN, DDoS protection, SSL
4. **Redis**: Pub/Sub для масштабирования WebSocket

## 🔒 Безопасность

### Аутентификация
- JWT токены с 30-дневным сроком действия
- Проверка Telegram Web App данных через HMAC-SHA256
- Secure HTTP-only cookies (опционально)

### API Security
- Helmet.js для security headers
- CORS с whitelist
- Rate limiting на всех эндпоинтах
- Input validation с Joi
- SQL injection protection (parameterized queries)

### WebSocket Security
- Токен проверяется при подключении
- Проверка прав на действия (host/participant)
- Timeout на соединения
- Message size limits

### Data Protection
- Passwords хешируются с bcrypt
- Sensitive data не логируется
- HTTPS everywhere (через Cloudflare)
- XSS protection

## 📈 Масштабирование

### Вертикальное (в рамках одного сервера)
1. Увеличить RAM для Redis кэша
2. Увеличить PostgreSQL shared_buffers
3. Увеличить max_connections

### Горизонтальное (несколько серверов)
1. **Load Balancer**: Nginx или Cloudflare
2. **Multiple Backend Instances**: 
   - Redis Pub/Sub для WebSocket events
   - Sticky sessions для WebSocket
3. **Managed Database**: PostgreSQL cluster
4. **Managed Redis**: Redis Cluster
5. **CDN**: Cloudflare для статики

### Bottlenecks и решения
- **WebSocket connections**: Redis Adapter для Socket.io
- **Database queries**: Read replicas
- **Video traffic**: CDN для кэширования
- **Memory**: Managed Redis
- **CPU**: Horizontal scaling

## 🎨 Frontend компоненты

```
App
├── AuthProvider (Telegram Web App init)
├── Router
│   ├── Home (список комнат)
│   ├── CreateRoom (форма создания)
│   └── Room (главная страница комнаты)
│       ├── VideoPlayer
│       │   ├── YouTubePlayer
│       │   ├── TwitchPlayer
│       │   └── CustomPlayer
│       ├── Chat
│       │   ├── MessageList
│       │   └── MessageInput
│       ├── VoiceChat (WebRTC)
│       ├── ParticipantsList
│       └── Controls
└── SocketProvider (WebSocket соединение)
```

## 🌐 Поддержка видеоплатформ

### YouTube
- React Player с YouTube API
- Поддержка плейлистов
- Embedded player controls

### Twitch
- Twitch Embedded Player
- Live streams поддержка
- Chat интеграция (опционально)

### Custom/Iframe
- Любые URL с embed поддержкой
- Direct video files (mp4, webm)
- HLS streams

### Кинопоиск и другие
- Iframe embedding
- URL validation
- Cross-origin handling

## 📊 Мониторинг

### Metrics
- Active connections (WebSocket)
- Room count
- User count
- Message rate
- API response times
- Database connection pool usage
- Redis memory usage

### Logging
- Winston для структурированных логов
- Уровни: error, warn, info, debug
- Rotation для управления размером
- Централизованное логирование (опционально)

### Health Checks
- `/api/health` endpoint
- Database connection check
- Redis connection check
- WebSocket status

## 🔄 CI/CD (рекомендации)

1. **Git Workflow**: 
   - main (production)
   - develop (staging)
   - feature/* branches

2. **Automated Testing**:
   - Unit tests (Jest)
   - Integration tests
   - E2E tests (Playwright)

3. **Deployment**:
   - GitHub Actions / GitLab CI
   - Automated Docker builds
   - Blue-green deployment
   - Rollback capability

4. **Monitoring**:
   - Uptime monitoring
   - Error tracking (Sentry)
   - Performance monitoring
   - User analytics
