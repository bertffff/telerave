# Инструкция по деплою WatchParty Telegram

## 📋 Требования

- VPS с минимум 2GB RAM, 2 CPU cores, 20GB SSD
- Ubuntu 22.04 или 24.04
- Docker и Docker Compose
- Домен (опционально, но рекомендуется)
- Telegram Bot Token

## 🎯 Рекомендуемые провайдеры (под бюджет $10-20/мес)

### Hetzner Cloud (Рекомендовано)
- **CX21**: 2 vCPU, 4GB RAM, 40GB SSD - €5.83/мес (~$6.3/мес)
- Отличная производительность и надежность
- Дата-центры в Европе

### DigitalOcean
- **Basic Droplet**: 2 vCPU, 2GB RAM, 50GB SSD - $12/мес
- Простой интерфейс, много туториалов

### Vultr
- **Cloud Compute**: 2 vCPU, 4GB RAM, 80GB SSD - $12/мес
- Хорошая производительность

## 📝 Шаг 1: Создание Telegram бота

1. Откройте [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните токен бота (формат: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
5. Отправьте команду `/setdomain` и укажите ваш домен
6. Настройте Web App:
   ```
   /newapp
   Выберите вашего бота
   Укажите название: WatchParty
   Укажите URL: https://ваш-домен.com
   ```

## 🖥️ Шаг 2: Настройка сервера

### Подключение к серверу
```bash
ssh root@ваш-ip-адрес
```

### Установка Docker
```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
apt install docker-compose -y

# Проверка установки
docker --version
docker-compose --version
```

### Настройка файрвола
```bash
# UFW (если используете)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 📦 Шаг 3: Деплой приложения

### Клонирование репозитория
```bash
cd /opt
git clone https://github.com/ваш-репозиторий/watchparty-tg.git
cd watchparty-tg
```

### Настройка переменных окружения
```bash
cd docker
cp .env.example .env
nano .env
```

Заполните `.env`:
```env
# JWT Secret (сгенерируйте: openssl rand -base64 32)
JWT_SECRET=ваш-секретный-ключ-здесь

# Telegram Bot Token
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# URLs
FRONTEND_URL=https://ваш-домен.com
VITE_API_URL=https://ваш-домен.com/api
VITE_SOCKET_URL=https://ваш-домен.com
```

### Запуск приложения
```bash
docker-compose up -d
```

### Проверка статуса
```bash
docker-compose ps
docker-compose logs -f
```

## 🌐 Шаг 4: Настройка домена и SSL

### Установка Nginx (на хосте)
```bash
apt install nginx certbot python3-certbot-nginx -y
```

### Конфигурация Nginx
```bash
nano /etc/nginx/sites-available/watchparty
```

Содержимое:
```nginx
server {
    listen 80;
    server_name ваш-домен.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

Активация конфигурации:
```bash
ln -s /etc/nginx/sites-available/watchparty /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Получение SSL сертификата
```bash
certbot --nginx -d ваш-домен.com
```

## 🔄 Шаг 5: Автоматическое обновление

### Создание скрипта обновления
```bash
nano /opt/update-watchparty.sh
```

Содержимое:
```bash
#!/bin/bash
cd /opt/watchparty-tg
git pull origin main
cd docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker system prune -f
```

Сделать исполняемым:
```bash
chmod +x /opt/update-watchparty.sh
```

### Настройка автозапуска
```bash
nano /etc/systemd/system/watchparty.service
```

Содержимое:
```ini
[Unit]
Description=WatchParty Telegram Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/watchparty-tg/docker
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Активация:
```bash
systemctl enable watchparty
systemctl start watchparty
```

## 📊 Мониторинг и обслуживание

### Просмотр логов
```bash
# Все сервисы
docker-compose -f /opt/watchparty-tg/docker/docker-compose.yml logs -f

# Только backend
docker-compose -f /opt/watchparty-tg/docker/docker-compose.yml logs -f backend

# Только frontend
docker-compose -f /opt/watchparty-tg/docker/docker-compose.yml logs -f frontend
```

### Мониторинг ресурсов
```bash
# Использование ресурсов контейнерами
docker stats

# Использование диска
df -h

# Использование памяти
free -h
```

### Очистка дискового пространства
```bash
# Очистка неиспользуемых Docker образов
docker system prune -a -f

# Очистка логов
truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

### Резервное копирование базы данных
```bash
# Создать бэкап
docker exec watchparty-db pg_dump -U postgres watchparty > backup_$(date +%Y%m%d).sql

# Восстановить бэкап
cat backup_20240101.sql | docker exec -i watchparty-db psql -U postgres watchparty
```

## 🔧 Оптимизация производительности

### Настройка PostgreSQL для низких ресурсов
Добавьте в `docker-compose.yml` для postgres:
```yaml
command:
  - "postgres"
  - "-c"
  - "max_connections=50"
  - "-c"
  - "shared_buffers=256MB"
  - "-c"
  - "effective_cache_size=512MB"
  - "-c"
  - "maintenance_work_mem=64MB"
  - "-c"
  - "checkpoint_completion_target=0.9"
  - "-c"
  - "wal_buffers=8MB"
  - "-c"
  - "default_statistics_target=100"
```

### Настройка Redis
Уже настроено в `docker-compose.yml`:
- Ограничение памяти: 256MB
- Политика вытеснения: allkeys-lru

### Cloudflare для CDN (бесплатно)
1. Зарегистрируйтесь на [Cloudflare](https://www.cloudflare.com/)
2. Добавьте ваш домен
3. Измените nameservers у регистратора
4. Включите:
   - **SSL/TLS**: Full
   - **Caching**: Standard
   - **Auto Minify**: JS, CSS, HTML
   - **Brotli**: On

## 🚨 Troubleshooting

### Приложение не запускается
```bash
# Проверить логи
docker-compose logs

# Проверить статус контейнеров
docker-compose ps

# Перезапустить
docker-compose restart
```

### База данных не подключается
```bash
# Проверить что PostgreSQL запущен
docker-compose ps postgres

# Проверить логи PostgreSQL
docker-compose logs postgres

# Войти в контейнер
docker exec -it watchparty-db psql -U postgres watchparty
```

### WebSocket не работает
- Убедитесь, что порт 3000 открыт
- Проверьте настройки Nginx
- Проверьте что Cloudflare в режиме "Full SSL"

### Высокая нагрузка на CPU
- Уменьшите `max_participants` в комнатах
- Настройте rate limiting более строго
- Включите Cloudflare DDoS protection

## 📈 Масштабирование (для роста)

Когда нужно масштабироваться:
1. **Horizontal scaling**: Запустить несколько инстансов backend
2. **Managed Database**: Перейти на managed PostgreSQL
3. **Managed Redis**: Использовать Redis Cloud
4. **Load Balancer**: Nginx или Cloudflare Load Balancing

## 💰 Оценка стоимости

### Минимальная конфигурация ($10/мес)
- Hetzner CX21: $6/мес
- Домен: $10-15/год (~$1/мес)
- CloudFlare: Бесплатно
- **Итого**: ~$7-8/мес

Поддерживает:
- До 20 одновременных комнат
- До 1000 активных пользователей в день
- До 100 пользователей в одной комнате

### Средняя конфигурация ($25-30/мес)
- Hetzner CPX31: 4 vCPU, 8GB RAM - €13.60/мес
- Managed PostgreSQL: $10/мес
- **Итого**: ~$25-30/мес

Поддерживает:
- До 100 одновременных комнат
- До 10,000 активных пользователей в день

## ✅ Чеклист после деплоя

- [ ] Приложение доступно по домену
- [ ] SSL сертификат установлен
- [ ] WebSocket работает
- [ ] Telegram Bot интеграция работает
- [ ] Можно создать комнату
- [ ] Видео синхронизируется
- [ ] Чат работает
- [ ] Настроен мониторинг
- [ ] Настроено резервное копирование
- [ ] Cloudflare настроен (опционально)
