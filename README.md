# Telegram Giveaway Platform

Платформа для проведения конкурсов и Giveaway внутри Telegram Mini App.

## Архитектура

- **Frontend**: React + TypeScript + Tailwind CSS (Mini App + Admin Panel)
- **Backend**: Python FastAPI + Telegram Bot API
- **Database**: Supabase (PostgreSQL)

## Функции

### Mini App (пользовательский интерфейс)
- Карточки конкурсов с неоновым дизайном
- Таймер обратного отсчёта
- Кнопка «Участвовать» с капчей
- Проверка подписки на каналы
- Запрет повторного участия
- Отображение победителей
- Показ рекламы после участия

### Админ панель
- Создание / редактирование / удаление конкурсов
- Добавление обязательных каналов
- Рекламные конкурсы с текстом рекламы
- Выбор победителей (автоматический)
- Просмотр участников
- Массовая рассылка всем пользователям
- Статистика

### Telegram Бот
- Команда /start — главное меню с WebApp кнопками
- Команда /admin — вход в админ панель
- Команда /contests — список активных конкурсов
- Команда /makeadmin <id> — назначить админа

## Установка и запуск

### 1. Клонирование

```bash
git clone <repo-url>
cd giveaway-platform
```

### 2. Настройка переменных окружения

Скопируйте `backend/.env.example` в `backend/.env` и заполните:

```env
BOT_TOKEN=ваш_токен_бота
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=ваш_anon_key
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key
ADMIN_IDS=123456789
WEBAPP_URL=https://ваш-домен.onrender.com
```

### 3. Установка зависимостей

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ..
npm install
```

### 4. Сборка Frontend

```bash
npm run build
cp -r dist backend/dist
```

### 5. Запуск

```bash
cd backend
python main.py    # API сервер
python bot.py     # Telegram бот (в другом терминале)
```

Или оба процесса через скрипт:

```bash
cd backend
chmod +x start.sh
./start.sh
```

## Деплой на Render

1. Создайте новый Web Service на [render.com](https://render.com)
2. Подключите репозиторий
3. `render.yaml` уже настроен
4. Добавьте переменные окружения в панели Render
5. Деплой запустится автоматически

## Создание Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/newbot`
3. Получите токен и вставьте в `.env`
4. Настройте Mini App: отправьте `/newapp` в BotFather
5. Укажите URL вашего деплоя как `https://ваш-домен.onrender.com/miniapp`

## Структура файлов

```
├── backend/
│   ├── main.py           # FastAPI сервер
│   ├── bot.py            # Telegram бот
│   ├── database.py       # Supabase queries
│   ├── config.py         # Конфигурация
│   ├── requirements.txt  # Python зависимости
│   └── .env.example      # Пример окружения
├── src/
│   ├── pages/
│   │   ├── MiniApp.tsx    # Пользовательский интерфейс
│   │   └── Admin.tsx      # Админ панель
│   ├── components/
│   │   ├── ContestCard.tsx
│   │   └── CountdownTimer.tsx
│   ├── lib/
│   │   ├── api.ts         # API клиент
│   │   ├── telegram.ts    # Telegram WebApp API
│   │   └── supabase.ts    # Supabase клиент
│   ├── hooks/
│   │   └── useCountdown.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── render.yaml
└── README.md
```
