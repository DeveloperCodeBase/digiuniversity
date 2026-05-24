# Re-run Lighthouse on / alone, using a fixed user-data-dir to dodge
# the chrome-launcher EPERM-on-temp-cleanup issue.

$ErrorActionPreference = "Continue"

$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# Kill orphan Chromes from any prior LH run.
Get-Process -Name chrome -ErrorAction SilentlyContinue | ForEach-Object {
  try { $_ | Stop-Process -Force -ErrorAction Stop } catch {}
}
Start-Sleep -Seconds 2

# Clean any orphan lighthouse temp dirs.
Get-ChildItem -Path "$env:TEMP" -Filter "lighthouse.*" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  try { Remove-Item -Recurse -Force -Path $_.FullName -ErrorAction Stop } catch {}
}

$userDataDir = "C:\Temp\chrome-lh-r7-3"
New-Item -ItemType Directory -Force -Path $userDataDir | Out-Null

Write-Host ""
Write-Host "========== LIGHTHOUSE https://digiuniversity.ir/ (R7.3 re-run) =========="
Write-Host ""

npx -y lighthouse@12 "https://digiuniversity.ir/" `
  --output=json --output=html `
  --output-path="docs/gate-a-evidence/lh-landing-mobile" `
  --form-factor=mobile --throttling-method=simulate --quiet `
  --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage --user-data-dir=$userDataDir"

$exit = $LASTEXITCODE
Write-Host ""
Write-Host "========== EXIT $exit =========="
exit $exit
