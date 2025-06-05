#!/usr/bin/env powershell

# SkillHub Backend Server Start Script
# This script starts the Node.js backend server with proper error handling

Write-Host "🚀 Starting SkillHub Backend Server..." -ForegroundColor Blue
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Make sure you're in the backend directory." -ForegroundColor Red
    Write-Host "Run: cd backend" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found. Creating from example..." -ForegroundColor Yellow
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "✅ Created .env file from env.example" -ForegroundColor Green
        Write-Host "🔧 Please edit .env file with your actual configuration values" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error: env.example not found. Please create .env file manually." -ForegroundColor Red
        exit 1
    }
}

# Check if credentials.json exists for Google Sheets
if (-not (Test-Path "credentials.json")) {
    Write-Host "⚠️  Warning: credentials.json not found for Google Sheets integration" -ForegroundColor Yellow
    Write-Host "   - Google Sheets integration will not work" -ForegroundColor Yellow
    Write-Host "   - Local storage fallback will be used" -ForegroundColor Yellow
    Write-Host "   - See GOOGLE_SHEETS_SETUP.md for setup instructions" -ForegroundColor Cyan
}

# Display startup information
Write-Host "📋 Server Configuration:" -ForegroundColor Cyan
Write-Host "   - Environment: Development" -ForegroundColor Gray
Write-Host "   - Port: 5000 (default)" -ForegroundColor Gray
Write-Host "   - API URL: http://localhost:5000/api" -ForegroundColor Gray

if (Test-Path "credentials.json") {
    Write-Host "   - Google Sheets: ✅ Configured" -ForegroundColor Green
} else {
    Write-Host "   - Google Sheets: ⚠️  Not configured (will use local storage)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔗 Admin Panel: http://localhost:3000/admin" -ForegroundColor Magenta
Write-Host ""

# Start the server
Write-Host "Starting server..." -ForegroundColor Green
npm start 