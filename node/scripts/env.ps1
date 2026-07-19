# Load WRIVON API keys from .env.local (gitignored, never committed).
# Create .env.local from .env.local.example or manually:
#   NVIDIA_API_KEY=your_key_here
#   CLOUDFLARE_API_KEY=your_key_here
#   CLOUDFLARE_ACCOUNT_ID=your_account_id

$envFile = Join-Path (Resolve-Path "$PSScriptRoot\..\..") ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Host "  [MISSING] .env.local not found at $envFile"
  return
}

# Parse KEY=VALUE lines (supports quoted values)
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_]\w*)\s*=\s*(.+)$') {
    $key = $matches[1]
    $val = $matches[2] -replace '^"(.*)"$', '$1' -replace "^'(.*)'$", '$1'
    Set-Item -Path "env:$key" -Value $val
  }
}

$ok = $true
if (-not $env:NVIDIA_API_KEY) { Write-Host "  [MISSING] NVIDIA_API_KEY"; $ok = $false }
if (-not $env:CLOUDFLARE_API_KEY) { Write-Host "  [MISSING] CLOUDFLARE_API_KEY"; $ok = $false }
if (-not $env:CLOUDFLARE_ACCOUNT_ID) { Write-Host "  [MISSING] CLOUDFLARE_ACCOUNT_ID"; $ok = $false }
if (-not $env:GROQ_API_KEY) { Write-Host "  [MISSING] GROQ_API_KEY"; $ok = $false }
if ($ok) { Write-Host "  [OK] WRIVON API keys loaded" }
