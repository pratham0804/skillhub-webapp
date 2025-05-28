#!/bin/bash

# SkillHub - Quick Installation Script for Unix/Linux/macOS
echo "========================================="
echo "SkillHub - Quick Installation Script"
echo "========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${BLUE}Node.js version:${NC}"
node --version
echo

echo -e "${BLUE}NPM version:${NC}"
npm --version
echo

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not installed${NC}"
    echo "Please install npm"
    exit 1
fi

echo "========================================="
echo -e "${BLUE}Installing Backend Dependencies...${NC}"
echo "========================================="

# Navigate to backend and install dependencies
if [ -f "backend/package.json" ]; then
    cd backend
    echo "Installing backend packages..."
    if npm install; then
        echo -e "${GREEN}Backend installation completed successfully!${NC}"
    else
        echo -e "${RED}ERROR: Backend installation failed${NC}"
        exit 1
    fi
    cd ..
else
    echo -e "${RED}ERROR: backend/package.json not found${NC}"
    exit 1
fi

echo
echo "========================================="
echo -e "${BLUE}Installing Frontend Dependencies...${NC}"
echo "========================================="

# Navigate to frontend and install dependencies
if [ -f "frontend/package.json" ]; then
    cd frontend
    echo "Installing frontend packages..."
    if npm install; then
        echo -e "${GREEN}Frontend installation completed successfully!${NC}"
    else
        echo -e "${RED}ERROR: Frontend installation failed${NC}"
        exit 1
    fi
    cd ..
else
    echo -e "${RED}ERROR: frontend/package.json not found${NC}"
    exit 1
fi

echo
echo "========================================="
echo -e "${BLUE}Setting up Environment Files...${NC}"
echo "========================================="

# Copy environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        echo -e "${GREEN}Created backend/.env from template${NC}"
    else
        echo -e "${YELLOW}WARNING: backend/env.example not found${NC}"
    fi
else
    echo -e "${YELLOW}backend/.env already exists${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/env.example" ]; then
        cp frontend/env.example frontend/.env
        echo -e "${GREEN}Created frontend/.env from template${NC}"
    else
        echo -e "${YELLOW}WARNING: frontend/env.example not found${NC}"
    fi
else
    echo -e "${YELLOW}frontend/.env already exists${NC}"
fi

echo
echo "========================================="
echo -e "${GREEN}Installation Summary${NC}"
echo "========================================="
echo -e "${GREEN}✓${NC} Backend dependencies installed"
echo -e "${GREEN}✓${NC} Frontend dependencies installed"
echo -e "${GREEN}✓${NC} Environment files created"
echo
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. Configure your environment variables in:"
echo "   - backend/.env"
echo "   - frontend/.env"
echo
echo "2. Start MongoDB service:"
echo "   macOS: brew services start mongodb-community"
echo "   Linux: sudo systemctl start mongod"
echo
echo "3. Start the application:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm start"
echo
echo "4. Visit http://localhost:3000"
echo
echo "========================================="
echo -e "${GREEN}Installation Complete!${NC}"
echo "========================================="

# Make the script wait for user input
read -p "Press Enter to continue..." 