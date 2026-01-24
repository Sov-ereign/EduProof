# EduProof Contract Deployment Script for Windows PowerShell
# Usage: .\scripts\deploy-contract.ps1 -Network testnet

param(
    [string]$Network = "testnet",
    [string]$SecretKey = $env:SECRET_KEY
)

if ([string]::IsNullOrEmpty($SecretKey)) {
    Write-Host "❌ Error: SECRET_KEY environment variable is required" -ForegroundColor Red
    Write-Host "Usage: `$env:SECRET_KEY='your-secret-key'; .\scripts\deploy-contract.ps1 -Network testnet" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Deploying EduProof contract to $Network..." -ForegroundColor Cyan

Set-Location contracts

# Build the contract
Write-Host "📦 Building contract..." -ForegroundColor Cyan
cargo build --target wasm32-unknown-unknown --release

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

$WasmPath = "target\wasm32-unknown-unknown\release\eduproof_contracts.wasm"

if (-not (Test-Path $WasmPath)) {
    Write-Host "❌ WASM file not found at $WasmPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Deploy the contract
Write-Host "📤 Deploying contract..." -ForegroundColor Cyan
$DeployResult = soroban contract deploy --wasm $WasmPath --source $SecretKey --network $Network

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

# Extract contract ID (simple extraction)
$ContractId = ($DeployResult | Select-String -Pattern "Contract ID:\s*(\S+)" | ForEach-Object { $_.Matches.Groups[1].Value })
if ([string]::IsNullOrEmpty($ContractId)) {
    $ContractId = $DeployResult
}

Write-Host ""
Write-Host "✅ Contract deployed successfully!" -ForegroundColor Green
Write-Host "📝 Contract ID: $ContractId" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Don't forget to update src/lib/stellar.ts with this contract ID:" -ForegroundColor Yellow
Write-Host "   export const CONTRACT_ID = `"$ContractId`";" -ForegroundColor Cyan
Write-Host ""

Set-Location ..

