#!/bin/bash

echo "🚀 Teltonika TCP Server Test Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm is installed: $(npm --version)"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies are already installed"
fi

echo ""
echo "🔧 Configuration:"
echo "   TCP Port: ${TCP_PORT:-5001}"
echo "   TCP Host: ${TCP_HOST:-0.0.0.0}"
echo "   Web API: ${WEB_APP_API_URL:-http://localhost:3000/api/gps/teltonika}"
echo ""

# Check if Next.js app is running
echo "🔍 Checking if Next.js app is running..."
if curl -s http://localhost:3000/api/gps/teltonika > /dev/null 2>&1; then
    echo "✅ Next.js app is running on http://localhost:3000"
else
    echo "⚠️  Next.js app is not running on http://localhost:3000"
    echo "   Please start your Next.js app first with: npm run dev"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🎯 Choose an option:"
echo "1. Start TCP server only"
echo "2. Run enhanced test suite"
echo "3. Start TCP server and run test"
echo "4. Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🚀 Starting TCP server..."
        node server.js
        ;;
    2)
        echo "🧪 Running enhanced test suite..."
        node test-avl-parsing-enhanced.js
        ;;
    3)
        echo "🚀 Starting TCP server in background..."
        node server.js &
        TCP_PID=$!
        echo "📋 TCP server PID: $TCP_PID"
        
        echo "⏳ Waiting 3 seconds for server to start..."
        sleep 3
        
        echo "🧪 Running enhanced test suite..."
        node test-avl-parsing-enhanced.js
        
        echo "🛑 Stopping TCP server..."
        kill $TCP_PID
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
