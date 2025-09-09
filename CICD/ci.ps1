Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting CI Pipeline..." -ForegroundColor Green

# Run linting
Write-Host "📝 Running ESLint..." -ForegroundColor Yellow
try {
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Linting failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Linting passed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Linting failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Run formatting check
Write-Host "🎨 Checking code formatting..." -ForegroundColor Yellow
try {
    npm run format:check
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Code formatting check failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Code formatting is correct!" -ForegroundColor Green
} catch {
    Write-Host "❌ Code formatting check failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Run tests with coverage
Write-Host "🧪 Running tests with coverage..." -ForegroundColor Yellow
try {
    npm run test:ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Tests failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Run build
Write-Host "🔨 Building application..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Create artifacts
Write-Host "📦 Creating artifacts..." -ForegroundColor Yellow
if (!(Test-Path ./artifacts)) {
    New-Item -ItemType Directory -Path ./artifacts
}

$timestamp = Get-Date -Format "yyyyMMddHHmmss"

# Create build artifact
Compress-Archive -Path ./dist -DestinationPath "./artifacts/app-$timestamp.zip"

# Create test coverage artifact
if (Test-Path ./coverage) {
    Compress-Archive -Path ./coverage -DestinationPath "./artifacts/coverage-$timestamp.zip"
}

Write-Host "🎉 CI Pipeline completed successfully!" -ForegroundColor Green
Write-Host "📊 Artifacts created:" -ForegroundColor Cyan
Write-Host "   - app-$timestamp.zip" -ForegroundColor White
if (Test-Path "./artifacts/coverage-$timestamp.zip") {
    Write-Host "   - coverage-$timestamp.zip" -ForegroundColor White
}