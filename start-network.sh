#!/bin/bash

# Script to start backend and frontend for network access
# Usage: ./start-network.sh

echo "🚀 Starting AriChatBot for network access..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Check if both ports are available
echo "🔍 Checking ports..."
if ! check_port 8000; then
    echo -e "${RED}❌ Backend port 8000 is in use. Please stop the existing service.${NC}"
    exit 1
fi

if ! check_port 3000; then
    echo -e "${RED}❌ Frontend port 3000 is in use. Please stop the existing service.${NC}"
    exit 1
fi

# Start backend
echo -e "${YELLOW}🔧 Starting Django backend on 0.0.0.0:8000...${NC}"
cd backend
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo -e "${YELLOW}🎨 Starting Next.js frontend on 0.0.0.0:3000...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

echo ""
echo -e "${GREEN}🎉 Services started successfully!${NC}"
echo ""
echo -e "${YELLOW}📱 Access URLs:${NC}"
echo -e "   Frontend: ${GREEN}http://192.168.40.75:3000${NC}"
echo -e "   Backend API: ${GREEN}http://192.168.40.75:8000/api${NC}"
echo -e "   Admin Panel: ${GREEN}http://192.168.40.75:8000/admin${NC}"
echo ""
echo -e "${YELLOW}📱 Mobile Access:${NC}"
echo -e "   Make sure your phone is connected to the same WiFi network"
echo -e "   Open browser and go to: ${GREEN}http://192.168.40.75:3000${NC}"
echo ""
echo -e "${YELLOW}🛑 To stop services:${NC}"
echo -e "   Press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
echo -e "${YELLOW}⏳ Services are running... Press Ctrl+C to stop${NC}"
wait
