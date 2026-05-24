#!/bin/bash
# Start both the FastAPI server and the Telegram bot

cd "$(dirname "$0")"

# Start API server in background
python main.py &
API_PID=$!

# Start bot in background
python bot.py &
BOT_PID=$!

# Wait for either to exit
wait -n $API_PID $BOT_PID
