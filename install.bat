@echo off
echo =========================================
echo SkillHub - Quick Installation Script
echo =========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo NPM version:
npm --version
echo.

echo =========================================
echo Installing Backend Dependencies...
echo =========================================
cd backend
if exist package.json (
    echo Installing backend packages...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Backend installation failed
        pause
        exit /b 1
    )
    echo Backend installation completed successfully!
) else (
    echo ERROR: backend/package.json not found
    pause
    exit /b 1
)

echo.
echo =========================================
echo Installing Frontend Dependencies...
echo =========================================
cd ../frontend
if exist package.json (
    echo Installing frontend packages...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Frontend installation failed
        pause
        exit /b 1
    )
    echo Frontend installation completed successfully!
) else (
    echo ERROR: frontend/package.json not found
    pause
    exit /b 1
)

cd ..

echo.
echo =========================================
echo Setting up Environment Files...
echo =========================================

REM Copy environment files if they don't exist
if not exist backend\.env (
    if exist backend\env.example (
        copy backend\env.example backend\.env
        echo Created backend/.env from template
    ) else (
        echo WARNING: backend/env.example not found
    )
) else (
    echo backend/.env already exists
)

if not exist frontend\.env (
    if exist frontend\env.example (
        copy frontend\env.example frontend\.env
        echo Created frontend/.env from template
    ) else (
        echo WARNING: frontend/env.example not found
    )
) else (
    echo frontend/.env already exists
)

echo.
echo =========================================
echo Installation Summary
echo =========================================
echo ✓ Backend dependencies installed
echo ✓ Frontend dependencies installed
echo ✓ Environment files created
echo.
echo NEXT STEPS:
echo 1. Configure your environment variables in:
echo    - backend/.env
echo    - frontend/.env
echo.
echo 2. Start MongoDB service
echo.
echo 3. Start the application:
echo    Backend:  cd backend && npm run dev
echo    Frontend: cd frontend && npm start
echo.
echo 4. Visit http://localhost:3000
echo.
echo =========================================
echo Installation Complete!
echo =========================================
pause 