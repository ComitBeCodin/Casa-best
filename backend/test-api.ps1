# Test CASA Backend APIs

Write-Host "🧪 Testing CASA Backend APIs..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
    Write-Host "✅ Health Check: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Send Verification Code
Write-Host "`n2. Testing Send Verification Code..." -ForegroundColor Yellow
try {
    $body = @{
        phone = "9876543210"
    } | ConvertTo-Json
    
    $sendCode = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-code" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Verification Code Sent: $($sendCode.message)" -ForegroundColor Green
    Write-Host "📱 Phone: $($sendCode.data.phone)" -ForegroundColor Cyan
    if ($sendCode.data.code) {
        Write-Host "🔢 Code: $($sendCode.data.code)" -ForegroundColor Cyan
        $global:verificationCode = $sendCode.data.code
    }
} catch {
    Write-Host "❌ Send Code Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Verify Phone (if we got a code)
if ($global:verificationCode) {
    Write-Host "`n3. Testing Phone Verification..." -ForegroundColor Yellow
    try {
        $verifyBody = @{
            phone = "9876543210"
            code = $global:verificationCode
        } | ConvertTo-Json
        
        $verify = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify" -Method POST -ContentType "application/json" -Body $verifyBody
        Write-Host "✅ Phone Verified: $($verify.message)" -ForegroundColor Green
        Write-Host "👤 User ID: $($verify.data.user.id)" -ForegroundColor Cyan
        Write-Host "📞 Phone Verified: $($verify.data.user.phoneVerified)" -ForegroundColor Cyan
        $global:userId = $verify.data.user.id
        $global:token = $verify.data.token
    } catch {
        Write-Host "❌ Verification Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Complete Onboarding (if we have a user)
if ($global:userId) {
    Write-Host "`n4. Testing Onboarding..." -ForegroundColor Yellow
    try {
        $onboardingBody = @{
            userId = $global:userId
            age = 25
            interests = @("fashion", "style", "shopping")
            fits = @("casual", "formal", "trendy")
            location = "Mumbai"
        } | ConvertTo-Json
        
        $onboarding = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/onboarding" -Method POST -ContentType "application/json" -Body $onboardingBody
        Write-Host "✅ Onboarding Complete: $($onboarding.message)" -ForegroundColor Green
        Write-Host "🎯 Interests: $($onboarding.data.user.interests -join ', ')" -ForegroundColor Cyan
        Write-Host "👔 Fits: $($onboarding.data.user.fits -join ', ')" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Onboarding Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Get Sample Products
Write-Host "`n5. Testing Sample Products..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "http://localhost:5000/api/products/sample" -Method GET
    Write-Host "✅ Products Retrieved: $($products.data.count) products" -ForegroundColor Green
    foreach ($product in $products.data.products) {
        Write-Host "  📦 $($product.name) - ₹$($product.price.current) ($($product.category))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Products Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Yellow
Write-Host "- Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Test Upload: http://localhost:5000/test-upload" -ForegroundColor Cyan
