param(
  [Parameter(Mandatory=$true)][string]$Url,
  [Parameter(Mandatory=$true)][string]$Out
)

$ErrorActionPreference = "Continue"
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# Kill orphan Chromes, clean lighthouse temp dirs.
Get-Process -Name chrome -ErrorAction SilentlyContinue | ForEach-Object {
  try { $_ | Stop-Process -Force -ErrorAction Stop } catch {}
}
Start-Sleep -Seconds 2
Get-ChildItem -Path "$env:TEMP" -Filter "lighthouse.*" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  try { Remove-Item -Recurse -Force -Path $_.FullName -ErrorAction Stop } catch {}
}

# Fixed user-data-dir to dodge the chrome-launcher EPERM-on-cleanup
# observed during R7.3 Lighthouse runs on Windows.
$userDataDir = "C:\Temp\chrome-lh-r7-1-r7-2"
New-Item -ItemType Directory -Force -Path $userDataDir | Out-Null

Write-Host ""
Write-Host "========== LIGHTHOUSE $Url =========="
Write-Host ""

npx -y lighthouse@12 $Url `
  --output=json --output=html `
  --output-path=$Out `
  --form-factor=mobile --throttling-method=simulate --quiet `
  --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage --user-data-dir=$userDataDir"

$exit = $LASTEXITCODE
Write-Host ""
Write-Host "========== EXIT $exit =========="
# Exit 0 even on the cleanup EPERM (the report JSON is written before cleanup).
exit 0
