$ErrorActionPreference = 'Stop'

$root = Resolve-Path "$PSScriptRoot\.."
Set-Location $root

Write-Host "[1/5] Build client and server..." -ForegroundColor Cyan
pnpm build

Write-Host "[2/5] Clean release directory..." -ForegroundColor Cyan
Remove-Item -Recurse -Force release\server -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force release | Out-Null

Write-Host "[3/5] Create standalone server package..." -ForegroundColor Cyan
pnpm --filter server --prod deploy --legacy release/server

Write-Host "[4/5] Copy frontend dist to release package..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force release/server/public | Out-Null
Copy-Item -Recurse -Force packages/client/dist/* release/server/public/

$envTemplate = @"
NODE_ENV=production
PORT=3001
REDIS_URL=redis://:123456@127.0.0.1:6379
APP_URL=http://your-domain.com
API_URL=http://your-domain.com
DEFAULT_EXPIRE_HOURS=168
MAX_CODES_PER_SHARE=1000
SHORT_CODE_LENGTH=6
RATE_LIMIT_CREATE_WINDOW_MS=60000
RATE_LIMIT_CREATE_MAX=10
RATE_LIMIT_CLAIM_WINDOW_MS=60000
RATE_LIMIT_CLAIM_MAX=5
"@
Set-Content -Path release/server/.env.example -Value $envTemplate

Write-Host "[5/5] Archive package..." -ForegroundColor Cyan
Remove-Item -Force release/sharecode-server.tar.gz -ErrorAction SilentlyContinue
tar -czf release/sharecode-server.tar.gz -C release/server .

Write-Host "Done. Package: release/sharecode-server.tar.gz" -ForegroundColor Green
