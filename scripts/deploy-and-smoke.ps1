#requires -Version 5.1
<#
.SYNOPSIS
    One-command deploy + smoke for digiuniversity. Wraps scripts/remote.ps1.

.DESCRIPTION
    Collapses the manual 6-step remote.ps1 deploy + the API smoke + the bundle
    check into a single invocation (Phase B R5). Emits a markdown report to
    stdout AND to logs/deploy/<timestamp>.md, plus an exit code per failure
    family so callers can branch on the outcome.

    Spec:    docs/PHASE_B_R5_DEPLOY_SCRIPT_MEMO.md
    Runbook: docs/DEPLOY_SCRIPT_USAGE.md

.NOTES
    Built in atomic commits A-F (memo, Commits section). THIS commit is the
    skeleton (A): flags + logging + report rendering + exit-code contract.
    The deploy / smoke / bundle steps are wired into main() across B-E.

    ASCII-only on purpose: Windows PowerShell 5.1 decodes a BOM-less .ps1 as
    the system ANSI code page, so non-ASCII glyphs (check marks, em dashes)
    would mojibake at execution time. Status is reported with [PASS]/[FAIL]
    tags instead.
#>
[CmdletBinding()]
param(
    # Bypass the migration-gate abort prompt (default for Claude automation).
    # The warning + 5s pause still print so they land in the report (Q2.a).
    [switch]$Yes,
    # Skip 'remote.ps1 migrate' (step 5) when no migration is pending.
    [switch]$SkipMigrate,
    # Skip 'remote.ps1 seed' (step 6).
    [switch]$SkipSeed,
    # Probe-only: run steps 1, 2 (warn only), and 8 (smoke + bundle) against
    # current prod with no deploy mutation (no build/up/migrate/seed). Used to
    # verify the report shape end-to-end against the live system.
    [switch]$DryRun,
    # After a green run, overwrite docs/BUNDLE_BASELINE.json with the measured
    # main-bundle size. Explicit + manual; the script never updates it silently.
    [switch]$UpdateBaseline
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- Exit codes (memo, step 10) -------------------------------------------
$EXIT_OK            = 0
$EXIT_REMOTE_FAILED = 10
$EXIT_SMOKE_FAILED  = 20
$EXIT_BUNDLE_FAILED = 30
$EXIT_GATE_ABORTED  = 40
$EXIT_UNEXPECTED    = 99

# --- Paths -----------------------------------------------------------------
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$LogDir   = Join-Path $RepoRoot 'logs\deploy'

# --- Run state -------------------------------------------------------------
# Each step is a record: { Section; Name; Status; Detail }. Section is one of
# remote | smoke | bundle | gate. Status drives both the verdict and the exit
# code: pass/warn/skip/info never fail the run; fail does.
$script:Steps    = New-Object System.Collections.Generic.List[object]
# Raw captured command output, appended to the log file only (postmortems).
$script:Appendix = New-Object System.Collections.Generic.List[string]
$script:RunId    = (Get-Date).ToString('yyyy-MM-dd-HHmmss')

function Add-Step {
    param(
        [Parameter(Mandatory)][ValidateSet('remote','smoke','bundle','gate')][string]$Section,
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][ValidateSet('pass','fail','warn','skip','info')][string]$Status,
        [string]$Detail = ''
    )
    $script:Steps.Add([pscustomobject]@{
        Section = $Section
        Name    = $Name
        Status  = $Status
        Detail  = $Detail
    })
    # Live progress to the console only (never to the stdout report buffer).
    $glyph = switch ($Status) {
        'pass' { '[OK]  ' }
        'fail' { '[FAIL]' }
        'warn' { '[WARN]' }
        'skip' { '[skip]' }
        default { '[..]  ' }
    }
    $line = "$glyph $Name"
    if ($Detail) { $line += " - $Detail" }
    Write-Host $line
}

function Add-Appendix {
    param([Parameter(Mandatory)][string]$Title, [string]$Body = '')
    $script:Appendix.Add("### $Title")
    $script:Appendix.Add('```')
    $script:Appendix.Add($Body.TrimEnd())
    $script:Appendix.Add('```')
    $script:Appendix.Add('')
}

function Get-HeadSha {
    try { (& git -C $RepoRoot rev-parse --short HEAD).Trim() }
    catch { 'unknown' }
}

function Initialize-Log {
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
    }
    # Retention: prune deploy logs older than 30 days on each run (Q5.a).
    $cutoff = (Get-Date).AddDays(-30)
    Get-ChildItem -Path $LogDir -Filter '*.md' -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -lt $cutoff } |
        Remove-Item -Force -ErrorAction SilentlyContinue
}

function Format-Section {
    param([Parameter(Mandatory)][string]$Title, [Parameter(Mandatory)][string]$Section)
    $rows = @($script:Steps | Where-Object { $_.Section -eq $Section })
    $out  = New-Object System.Collections.Generic.List[string]
    $out.Add("## $Title")
    if ($rows.Count -eq 0) {
        $out.Add('- (none)')
    } else {
        foreach ($r in $rows) {
            $tag = switch ($r.Status) {
                'pass' { '[PASS]' }
                'fail' { '[FAIL]' }
                'warn' { '[WARN]' }
                'skip' { '[SKIP]' }
                default { '[INFO]' }
            }
            $line = "- $tag $($r.Name)"
            if ($r.Detail) { $line += " - $($r.Detail)" }
            $out.Add($line)
        }
    }
    $out.Add('')
    return $out
}

function Get-Verdict {
    $fails = @($script:Steps | Where-Object { $_.Status -eq 'fail' })
    $warns = @($script:Steps | Where-Object { $_.Status -eq 'warn' })
    if ($fails.Count -gt 0) {
        $names = ($fails | ForEach-Object { $_.Name }) -join '; '
        return "FAIL - $($fails.Count) failure(s): $names"
    }
    if ($script:Steps.Count -eq 0) {
        return 'no steps executed (skeleton run)'
    }
    if ($warns.Count -gt 0) {
        return "PASS with $($warns.Count) warning(s)"
    }
    return 'all green'
}

function Get-ExitCode {
    # Gate aborts are returned at the call site (EXIT_GATE_ABORTED). Otherwise
    # map the first failing family in cascade order: a remote failure usually
    # causes downstream smoke/bundle failures, so report the root family.
    $map = @{ remote = $EXIT_REMOTE_FAILED; smoke = $EXIT_SMOKE_FAILED; bundle = $EXIT_BUNDLE_FAILED }
    foreach ($sec in 'remote','smoke','bundle') {
        $failed = @($script:Steps | Where-Object { $_.Section -eq $sec -and $_.Status -eq 'fail' })
        if ($failed.Count -gt 0) { return $map[$sec] }
    }
    return $EXIT_OK
}

function Write-Report {
    $sha  = Get-HeadSha
    $iso  = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
    $mode = if ($DryRun) { ' (dry-run)' } else { '' }

    $report = New-Object System.Collections.Generic.List[string]
    $report.Add("# Deploy & Smoke Report - $sha - $iso$mode")
    $report.Add('')
    foreach ($l in (Format-Section 'Steps'     'remote')) { $report.Add($l) }
    foreach ($l in (Format-Section 'API smoke' 'smoke'))  { $report.Add($l) }
    foreach ($l in (Format-Section 'Bundle'    'bundle')) { $report.Add($l) }
    $report.Add('## Verdict')
    $report.Add("- $(Get-Verdict)")

    # stdout = the markdown report (Claude pastes this into the owner ping).
    Write-Output ($report -join "`n")

    # Log file = the report + a raw-output appendix for postmortems.
    $logPath = Join-Path $LogDir "$($script:RunId).md"
    $full = New-Object System.Collections.Generic.List[string]
    foreach ($l in $report) { $full.Add($l) }
    if ($script:Appendix.Count -gt 0) {
        $full.Add('')
        $full.Add('---')
        $full.Add('## Appendix - captured command output')
        $full.Add('')
        foreach ($l in $script:Appendix) { $full.Add($l) }
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($logPath, $full, $utf8NoBom)
    Write-Host ''
    Write-Host "Report written to logs/deploy/$($script:RunId).md"
}

# --- main ------------------------------------------------------------------
try {
    Initialize-Log
    $banner = "deploy-and-smoke - run $($script:RunId)"
    if ($DryRun) { $banner += ' (dry-run)' }
    Write-Host $banner

    # Deploy + smoke phases are wired in here across commits B-E:
    #   B -> git pull + migration gate + remote.ps1 build/up/migrate/seed/health
    #   C -> API smoke (health / migrate-status / login round-trip / authed GET)
    #   D -> bundle (modulepreload allow-list + main-bundle delta vs baseline)

    Write-Report
    exit (Get-ExitCode)
}
catch {
    Write-Host "[FAIL] unexpected: $($_.Exception.Message)"
    Add-Appendix 'unexpected-exception' ($_ | Out-String)
    try { Write-Report } catch { }
    exit $EXIT_UNEXPECTED
}
