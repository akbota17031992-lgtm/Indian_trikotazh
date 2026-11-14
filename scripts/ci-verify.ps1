# ==============================================================================
# India Trikotaj Monorepo — Local CI Verification Script (PowerShell)
# Runs the exact same pipeline steps locally as GitHub Actions CI
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Starting Local CI Verification Pipeline           " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

Write-Host "`nStep 1/5: Formatting check (Prettier)..." -ForegroundColor Yellow
pnpm format:check

Write-Host "`nStep 2/5: Building shared packages..." -ForegroundColor Yellow
pnpm build:packages

Write-Host "`nStep 3/5: Monorepo TypeCheck (TypeScript)..." -ForegroundColor Yellow
pnpm type-check

Write-Host "`nStep 4/5: Running full automated test suite (233+ tests)..." -ForegroundColor Yellow
pnpm test:all

Write-Host "`nStep 5/5: Verifying Web & API production builds..." -ForegroundColor Yellow
pnpm --filter @india-trikotaj/api build
pnpm --filter @india-trikotaj/web build

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "  ✓ All CI checks passed successfully! Ready to push! " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
