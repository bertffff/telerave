# Структура проекта

```
watchparty-tg/
├── backend/                    # Backend сервер
│   ├── src/
│   │   ├── config/            # Конфигурация
│   │   ├── controllers/       # Контроллеры
│   │   ├── middleware/        # Middleware
│   │   ├── models/            # Модели БД
│   │   ├── routes/            # API роуты
│   │   ├── services/          # Бизнес-логика
│   │   ├── socket/            # WebSocket handlers
│   │   ├── utils/             # Утилиты
│   │   └── server.ts          # Точка входа
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React приложение
│   ├── src/
│   │   ├── components/        # Компоненты
│   │   │   ├── Room/         # Компоненты комнаты
│   │   │   ├── Player/       # Видео плееры
│   │   │   ├── Chat/         # Чат
│   │   │   ├── Voice/        # Голосовой чат
│   │   │   └── UI/           # UI компоненты
│   │   ├── hooks/            # Custom hooks
│   │   ├── store/            # Zustand store
│   │   ├── api/              # API клиент
│   │   ├── utils/            # Утилиты
│   │   ├── types/            # TypeScript типы
│   │   └── App.tsx           # Главный компонент
│   ├── package.json
│   └── vite.config.ts
│
├── docker/                     # Docker конфигурация
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
├── database/                   # Миграции БД
│   ├── migrations/
│   └── seeds/
│
└── docs/                       # Документация
    ├── API.md                 # API документация
    ├── DEPLOYMENT.md          # Инструкция по деплою
    └── ARCHITECTURE.md        # Архитектура
```
