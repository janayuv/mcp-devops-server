Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Run lint
npm run lint

# Run test
npm test

# Run build
npm run build

# Create artifacts
if (!(Test-Path ./artifacts)) {
  New-Item -ItemType Directory -Path ./artifacts
}

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
Compress-Archive -Path ./dist -DestinationPath "./artifacts/app-$timestamp.zip"