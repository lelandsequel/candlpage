#!/bin/bash

# Startup script for Lead Generator Application
# This script starts all three services with proper error handling

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "🚀 Starting Lead Generator Application"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file with required API keys"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}⚠️  Installing Node dependencies...${NC}"
    npm install
fi

# Check if Python modules are installed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Installing Python dependencies...${NC}"
    pip install -r requirements.txt 2>/dev/null || pip3 install fastapi uvicorn python-dotenv requests
fi

# Kill any existing processes on our ports
echo -e "${YELLOW}Cleaning up old processes...${NC}"
pkill -f "uvicorn python_api" || true
pkill -f "node server.js" || true
sleep 1

# Start Python API
echo -e "${YELLOW}Starting Python API on port 5057...${NC}"
python3 -m uvicorn python_api:app --host 0.0.0.0 --port 5057 > logs/python_api.log 2>&1 &
PYTHON_PID=$!
echo -e "${GREEN}✅ Python API started (PID: $PYTHON_PID)${NC}"

# Wait for Python API to be ready
sleep 3
if ! curl -s http://localhost:5057/health > /dev/null; then
    echo -e "${RED}❌ Python API failed to start${NC}"
    kill $PYTHON_PID 2>/dev/null || true
    exit 1
fi

# Start Express Backend
echo -e "${YELLOW}Starting Express Backend on port 3001...${NC}"
node server.js > logs/express.log 2>&1 &
EXPRESS_PID=$!
echo -e "${GREEN}✅ Express Backend started (PID: $EXPRESS_PID)${NC}"

# Wait for Express to be ready
sleep 2
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${RED}❌ Express Backend failed to start${NC}"
    kill $PYTHON_PID $EXPRESS_PID 2>/dev/null || true
    exit 1
fi

# Start React Frontend
echo -e "${YELLOW}Starting React Frontend on port 5173...${NC}"
npm run dev > logs/react.log 2>&1 &
REACT_PID=$!
echo -e "${GREEN}✅ React Frontend started (PID: $REACT_PID)${NC}"

# Wait for React to be ready
sleep 5

echo ""
echo "=========================================="
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo "=========================================="
echo ""
echo "📍 Frontend:  http://localhost:5173"
echo "📍 Backend:   http://localhost:3001"
echo "📍 API:       http://localhost:5057"
echo ""
echo "📋 Logs:"
echo "   - Python API: logs/python_api.log"
echo "   - Express:    logs/express.log"
echo "   - React:      logs/react.log"
echo ""
echo "🛑 To stop all services, run: pkill -f 'uvicorn\|node server\|npm run dev'"
echo ""

# Keep script running and monitor processes
while true; do
    if ! kill -0 $PYTHON_PID 2>/dev/null; then
        echo -e "${RED}❌ Python API crashed!${NC}"
        break
    fi
    if ! kill -0 $EXPRESS_PID 2>/dev/null; then
        echo -e "${RED}❌ Express Backend crashed!${NC}"
        break
    fi
    if ! kill -0 $REACT_PID 2>/dev/null; then
        echo -e "${RED}❌ React Frontend crashed!${NC}"
        break
    fi
    sleep 5
done

echo -e "${RED}One or more services crashed. Cleaning up...${NC}"
kill $PYTHON_PID $EXPRESS_PID $REACT_PID 2>/dev/null || true
exit 1
