# Run inside the extracted krishinetra folder on Windows.
# This only commits source files, never your backend/.env or saved SQLite database.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$repo = 'https://github.com/25r01a05ez-sudo/krishinetra01.git'

function GitOrFail {
    & git @args
    if ($LASTEXITCODE -ne 0) { throw "Git command failed. Resolve the error above and re-run this script." }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is not installed. Install Git for Windows from https://git-scm.com/download/win and reopen PowerShell.'
}
if (-not (Test-Path 'package.json') -or -not (Test-Path 'backend/app.py')) {
    throw 'Open the inner krishinetra folder that contains both package.json and backend/app.py.'
}

if (-not (Test-Path '.git')) { GitOrFail init }
GitOrFail branch -M main
$existing = & git remote
if ($existing -contains 'origin') {
    GitOrFail remote set-url origin $repo
} else {
    GitOrFail remote add origin $repo
}
GitOrFail add --all
$staged = @(& git diff --cached --name-only)
$blocked = @($staged | Where-Object {
  $_ -match '(^|/)(\.env(?!\.example)(\..*)?|\.venv|node_modules|dist|__pycache__|instance)(/|$)' -or
  $_ -match '\.(db|sqlite3|sqlite3-shm|sqlite3-wal|pyc|log)$'
})
if ($blocked.Count -gt 0) {
    Write-Host 'STOP: Unsafe files were staged:' -ForegroundColor Red
    $blocked | ForEach-Object { Write-Host "  $_" }
    Write-Host 'No commit or push was made. Remove these from Git staging first.'
    exit 1
}
# Check for the most common real Google API key format; placeholders are okay.
$secretMatches = @(& git grep --cached -n -E 'AIza[0-9A-Za-z_-]{20,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----' -- . ':!package-lock.json' 2>$null)
if ($secretMatches.Count -gt 0) {
    Write-Host 'STOP: Possible API key or private key found. Nothing was pushed.' -ForegroundColor Red
    Write-Host 'Review your tracked files and rotate any exposed credentials.'
    exit 1
}
Write-Host "`nSource files staged for $repo" -ForegroundColor Green
GitOrFail status --short
GitOrFail diff --cached --stat
$changed = & git diff --cached --name-only
if ($changed) { GitOrFail commit -m 'Upload KrishiNetra with four-language voice features and deployment config' }
Write-Host "`nPushing to GitHub. Git Credential Manager may open a browser sign-in..." -ForegroundColor Cyan
GitOrFail push -u origin main
Write-Host "`nSUCCESS: https://github.com/25r01a05ez-sudo/krishinetra01" -ForegroundColor Green
