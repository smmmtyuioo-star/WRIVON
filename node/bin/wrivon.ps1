#!/usr/bin/env pwsh
# WRIVON launcher for Windows PowerShell 5.1+ and PowerShell 7+.
# Forwards all arguments to the Node entry point.

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Entry = Join-Path $ScriptDir "wrivon.js"

if (-not (Test-Path -Path $Entry)) {
    Write-Error "wrivon: entry not found at $Entry"
    exit 1
}

$node = (Get-Command node -ErrorAction SilentlyContinue)
if (-not $node) {
    Write-Error "wrivon: 'node' is not on PATH. Install Node.js 18+ from https://nodejs.org/"
    exit 1
}

& node $Entry @args
exit $LASTEXITCODE
