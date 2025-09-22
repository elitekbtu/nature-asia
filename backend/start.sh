#!/bin/bash

# Nature Asia Backend Startup Script

echo "🌍 Starting Nature Asia Backend Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please update .env file with your configuration before running again."
    echo "   Required: GEMINI_API_KEY, OPENWEATHER_API_KEY"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if logs directory exists
if [ ! -d "logs" ]; then
    echo "📁 Creating logs directory..."
    mkdir -p logs
fi

# Start the server
echo "🚀 Starting server..."
if [ "$1" = "dev" ]; then
    echo "🔧 Development mode with nodemon"
    npm run dev
else
    echo "🏭 Production mode"
    npm start
fi

