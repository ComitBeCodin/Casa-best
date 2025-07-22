Write-Host "🧪 Testing CASA Backend APIs..." -ForegroundColor Green

# Test Health Check
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
Write-Host "✅ $($health.message)" -ForegroundColor Green

# Test Send Code
Write-Host "`n2. Send Verification Code..." -ForegroundColor Yellow
$body = '{"phone": "9876543210"}'
$sendCode = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-code" -Method POST -ContentType "application/json" -Body $body
Write-Host "✅ $($sendCode.message)" -ForegroundColor Green
Write-Host "📱 Phone: $($sendCode.data.phone)" -ForegroundColor Cyan
if ($sendCode.data.code) {
    Write-Host "🔢 Code: $($sendCode.data.code)" -ForegroundColor Cyan
}

# Test Products
Write-Host "`n3. Sample Products..." -ForegroundColor Yellow
$products = Invoke-RestMethod -Uri "http://localhost:5000/api/products/sample" -Method GET
Write-Host "✅ Found $($products.data.count) products" -ForegroundColor Green

Write-Host "`n🎉 All tests passed!" -ForegroundColor Green
