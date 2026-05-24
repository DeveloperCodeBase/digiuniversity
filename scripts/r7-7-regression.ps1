# R7.7 regression sweep — runs 7 visual specs sequentially via scripts/remote.ps1.
# Output per-spec logs are saved under docs/gate-a-evidence/r7-7-regression-<spec>.log
# so they can be inspected later. The final summary is printed to stdout.

$ErrorActionPreference = "Continue"

$specs = @(
  "phase-a-r1-1-appshell",
  "phase-a-r3-dashboards",
  "phase-a-r5-login",
  "phase-a-r6-classroom",
  "phase-a-r6-6-navbar-rtl",
  "phase-a-r7-12-mini-rail",
  "gate-a-role-routing"
)

$results = @()
foreach ($s in $specs) {
  Write-Host ""
  Write-Host "========== RUNNING $s =========="
  Write-Host ""
  $start = Get-Date
  $logPath = "docs/gate-a-evidence/r7-7-regression-$s.log"
  & .\scripts\remote.ps1 visual -Service $s 2>&1 | Tee-Object -FilePath $logPath
  $exit = $LASTEXITCODE
  $dur = [int]((Get-Date) - $start).TotalSeconds
  $results += [pscustomobject]@{ spec = $s; exit = $exit; sec = $dur }
  Write-Host ""
  Write-Host "========== DONE $s (exit=$exit, ${dur}s) =========="
  Write-Host ""
}

Write-Host ""
Write-Host "========== SUMMARY =========="
Write-Host ""
$results | Format-Table -AutoSize | Out-String | Write-Host
