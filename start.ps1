# CornLeaf AI - Start Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting CornLeaf AI Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if database exists, if not set it up
if (-not (Test-Path "backend\prisma\dev.db")) {
    Write-Host "[INFO] Database not found. Running initial setup..." -ForegroundColor Yellow
    Write-Host ""
    
    Set-Location backend
    
    Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
    npm run prisma:generate
    
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    npx prisma migrate deploy
    
    Write-Host "Seeding database..." -ForegroundColor Yellow
    npm run prisma:seed
    
    Set-Location ..
    
    Write-Host ""
    Write-Host "Database setup complete!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Backend Server Starting on http://localhost:8000' -ForegroundColor Green; npm run dev"

Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Starting Frontend Application..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Frontend Starting on http://localhost:3000' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Both Servers Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Admin Login:" -ForegroundColor Cyan
Write-Host "  Email:    admin@cornleaf.app" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
