# Lighthouse 12 CLI re-measurement on the 3 §1 sampled pages.
# Outputs JSON + HTML to docs/gate-a-evidence/lh-*.report.{json,html}
# (overwrites the post-R7.7 baseline since R7.3's goal is the next Δ).
#
# Run from a non-elevated Windows shell. Uses the system Chrome.

$ErrorActionPreference = "Stop"

$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"

$pages = @(
  @{ url = "https://digiuniversity.ir/";          out = "docs/gate-a-evidence/lh-landing-mobile"  },
  @{ url = "https://digiuniversity.ir/login";     out = "docs/gate-a-evidence/lh-login-mobile"    },
  @{ url = "https://digiuniversity.ir/programs";  out = "docs/gate-a-evidence/lh-programs-mobile" }
)

foreach ($p in $pages) {
  Write-Host ""
  Write-Host "========== LIGHTHOUSE $($p.url) =========="
  Write-Host ""
  npx -y lighthouse@12 $p.url `
    --output=json --output=html `
    --output-path=$($p.out) `
    --form-factor=mobile --throttling-method=simulate --quiet `
    --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage"
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Lighthouse exit=$LASTEXITCODE on $($p.url) — continuing with remaining pages."
  }
}

Write-Host ""
Write-Host "========== SCORES =========="
Write-Host ""

# Extract category scores via Node since jq isn't available.
foreach ($p in $pages) {
  $json = "$($p.out).report.json"
  if (Test-Path $json) {
    node -e "const j=require('./$($json.Replace('\','/'))'); const c=j.categories; console.log(`'$($p.url)`': perf=' + Math.round(c.performance.score*100) + ' a11y=' + Math.round(c.accessibility.score*100) + ' bp=' + Math.round(c['best-practices'].score*100) + ' seo=' + Math.round(c.seo.score*100));"
  }
}
