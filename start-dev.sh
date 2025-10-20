#!/bin/bash

# start-dev.sh
# Starts both the frontend (Vite) and backend (Python API) locally
# Frontend: http://localhost:3001
# Backend: http://localhost:5057

set -e

echo "🚀 Starting CandlPage Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Start Python backend in background
echo -e "${BLUE}Starting Python backend (port 5057)...${NC}"
python3 python_api.py &
PYTHON_PID=$!
echo -e "${GREEN}✓ Python backend started (PID: $PYTHON_PID)${NC}"
echo ""

# Give Python backend a moment to start
sleep 2

# Start Node.js frontend in background
echo -e "${BLUE}Starting Node.js frontend (port 3001)...${NC}"
npm run dev &
NODE_PID=$!
echo -e "${GREEN}✓ Node.js frontend started (PID: $NODE_PID)${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Development environment is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:5057"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Handle cleanup on exit
cleanup() {
    echo ""
    echo -e "${BLUE}Shutting down...${NC}"
    kill $PYTHON_PID 2>/dev/null || true
    kill $NODE_PID 2>/dev/null || true
    echo -e "${GREEN}✓ All servers stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait

