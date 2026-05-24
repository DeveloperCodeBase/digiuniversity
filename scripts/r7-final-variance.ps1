# Final Phase-A perf variance check — 5 runs each on /, /login, /programs.
# Produces docs/gate-a-evidence/lh-*-runN.report.{json,html} files.
# Used to tighten the median + range numbers in the close memo evidence.

$ErrorActionPreference = "Continue"

$pages = @(
  @{ url = "https://digiuniversity.ir/";          slug = "landing"  },
  @{ url = "https://digiuniversity.ir/login";     slug = "login"    },
  @{ url = "https://digiuniversity.ir/programs";  slug = "programs" }
)

for ($i = 1; $i -le 5; $i++) {
  foreach ($p in $pages) {
    Write-Host ""
    Write-Host "========== RUN $i — $($p.url) =========="
    & .\scripts\r7-1-r7-2-lighthouse-page.ps1 -Url $p.url -Out "docs/gate-a-evidence/lh-$($p.slug)-final-run$i"
    Start-Sleep -Seconds 5
  }
}

Write-Host ""
Write-Host "========== FINAL VARIANCE MEDIAN =========="
foreach ($p in $pages) {
  Write-Host ""
  Write-Host "$($p.slug):"
  $scores = @()
  for ($i = 1; $i -le 5; $i++) {
    $jsonPath = "docs/gate-a-evidence/lh-$($p.slug)-final-run$i.report.json"
    if (Test-Path $jsonPath) {
      $j = Get-Content $jsonPath -Raw | ConvertFrom-Json
      $perf = [int]([math]::Round($j.categories.performance.score * 100))
      Write-Host "  run ${i}: perf=$perf"
      $scores += $perf
    }
  }
  if ($scores.Count -gt 0) {
    $sorted = $scores | Sort-Object
    $median = $sorted[[int]($sorted.Count / 2)]
    $min = $sorted[0]
    $max = $sorted[-1]
    Write-Host "  median=$median  min=$min  max=$max  range=$($max - $min)"
  }
}
