# CornLeaf AI - Admin Dashboard Setup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CornLeaf AI - Admin Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Navigate to backend
Write-Host "[1/5] Navigating to backend..." -ForegroundColor Yellow
Set-Location backend

# Step 2: Generate Prisma Client
Write-Host "[2/5] Generating Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate

# Step 3: Run Migrations
Write-Host "[3/5] Running database migrations..." -ForegroundColor Yellow
npm run prisma:migrate

# Step 4: Seed the database
Write-Host "[4/5] Seeding database with admin user..." -ForegroundColor Yellow
npm run prisma:seed

# Step 5: Show credentials
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Admin Credentials:" -ForegroundColor Cyan
Write-Host "  Email:    admin@cornleaf.app" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Test User Credentials:" -ForegroundColor Cyan
Write-Host "  Email:    user@example.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend:  npm run dev" -ForegroundColor White
Write-Host "2. Start the frontend: npm start (from root folder)" -ForegroundColor White
Write-Host "3. Open: http://localhost:3000" -ForegroundColor White
Write-Host "4. Login with admin credentials" -ForegroundColor White
Write-Host ""
Write-Host "Note: Change the default password after first login!" -ForegroundColor Red
Write-Host ""

# Return to root
Set-Location ..
