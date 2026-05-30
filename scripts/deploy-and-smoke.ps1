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
    # $Section is one or more section keys; rows render in insertion order across
    # all of them. 'Steps' pulls both 'remote' and 'gate' so the migration-gate
    # warning lands in the report next to the deploy steps (Q2.a), not just the
    # live console.
    param([Parameter(Mandatory)][string]$Title, [Parameter(Mandatory)][string[]]$Section)
    $rows = @($script:Steps | Where-Object { $Section -contains $_.Section })
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
    foreach ($l in (Format-Section 'Steps'     @('remote','gate'))) { $report.Add($l) }
    foreach ($l in (Format-Section 'API smoke' 'smoke'))            { $report.Add($l) }
    foreach ($l in (Format-Section 'Bundle'    'bundle'))           { $report.Add($l) }
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

# --- Deploy orchestration (memo steps 1-7) --------------------------------
function Invoke-RemoteScript {
    # Call remote.ps1 in-process: $LASTEXITCODE then reflects the action's last
    # native command (ssh). Safe because build/up/migrate/seed/health are all
    # exit-free, so & cannot terminate this script. EAP is relaxed first: ssh/
    # git write to stderr, which would throw under Stop + 2>&1.
    param([Parameter(Mandatory)][string]$Action)
    $remote  = Join-Path $PSScriptRoot 'remote.ps1'
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $global:LASTEXITCODE = 0
    try { $raw = & $remote -Action $Action 2>&1 }
    finally { $ErrorActionPreference = $prevEAP }
    $code = $LASTEXITCODE
    $text = (@($raw) | ForEach-Object { "$_" }) -join "`n"
    if ($VerbosePreference -ne 'SilentlyContinue' -and $text) { Write-Host $text }
    return [pscustomobject]@{ Code = $code; Output = $text }
}

function Invoke-GitPull {
    Write-Host '>> git pull --ff-only origin main'
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $global:LASTEXITCODE = 0
    try { $raw = & git -C $RepoRoot pull --ff-only origin main 2>&1 }
    finally { $ErrorActionPreference = $prevEAP }
    $code = $LASTEXITCODE
    $text = (@($raw) | ForEach-Object { "$_" }) -join "`n"
    Add-Appendix 'git pull --ff-only origin main' $text
    if ($code -eq 0) {
        Add-Step -Section remote -Name 'git pull (local)' -Status pass
        return $true
    }
    Add-Step -Section remote -Name 'git pull (local)' -Status fail -Detail "exit $code (diverged or dirty tree)"
    return $false
}

function Invoke-MigrationGate {
    # Detect via origin/main..HEAD (everything this deploy will push to prod),
    # NOT HEAD@{1}..HEAD which sees only the tip commit and would miss a
    # migration committed earlier in the sub-R (the R4 A->G case). The post-
    # deploy ground-truth check is prisma migrate status at step 8.2, not here.
    $migDir  = 'apps/api/prisma/migrations'
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { $diff = & git -C $RepoRoot diff --name-status origin/main..HEAD -- $migDir 2>&1 }
    finally { $ErrorActionPreference = $prevEAP }
    $added = @(@($diff) | Where-Object { $_ -match '^A\s' -and $_ -match 'migration\.sql$' })
    if ($added.Count -eq 0) {
        Add-Step -Section gate -Name 'migration gate' -Status pass -Detail 'no new migration'
        return $true
    }
    $names = @($added | ForEach-Object {
        (($_ -split "`t")[1]) -replace '^apps/api/prisma/migrations/', '' -replace '/migration\.sql$', ''
    } | Sort-Object -Unique)
    $nameList = $names -join ', '
    Write-Host ''
    Write-Host "!! NEW MIGRATION DETECTED: $nameList"
    Write-Host '   This will modify the production database schema on deploy.'
    Add-Step -Section gate -Name 'migration gate' -Status warn -Detail "$($names.Count) new: $nameList"
    if ($DryRun) {
        Write-Host '   (dry-run: warning only, no deploy)'
        return $true
    }
    for ($i = 5; $i -ge 1; $i--) { Write-Host "   proceeding in $i ..."; Start-Sleep -Seconds 1 }
    if (-not $Yes) {
        $ans = Read-Host "   Type 'abort' to cancel, anything else (or Enter) to proceed"
        if ($ans -eq 'abort') {
            Add-Step -Section gate -Name 'migration gate' -Status fail -Detail 'aborted by operator'
            return $false
        }
    }
    return $true
}

function Add-RemoteStep {
    param([Parameter(Mandatory)][string]$Action, [string]$Label = $Action)
    Write-Host ">> remote.ps1 $Action"
    $r = Invoke-RemoteScript -Action $Action
    Add-Appendix "remote.ps1 $Action (exit $($r.Code))" $r.Output
    if ($r.Code -eq 0) {
        Add-Step -Section remote -Name $Label -Status pass
        return $true
    }
    Add-Step -Section remote -Name $Label -Status fail -Detail "exit $($r.Code)"
    return $false
}

function Add-HealthStep {
    # health echoes 'FAILED' per down service and always exits 0, so its exit
    # code is meaningless -- parse the output for FAILED instead.
    Write-Host '>> remote.ps1 health'
    $r = Invoke-RemoteScript -Action health
    Add-Appendix "remote.ps1 health (exit $($r.Code))" $r.Output
    $failed = @([regex]::Matches($r.Output, 'FAILED')).Count
    if ($failed -gt 0) {
        Add-Step -Section remote -Name 'health (4 services)' -Status fail -Detail "$failed service(s) FAILED"
        return $false
    }
    Add-Step -Section remote -Name 'health (4 services)' -Status pass
    return $true
}

# --- main ------------------------------------------------------------------
try {
    Push-Location $RepoRoot
    Initialize-Log
    $banner = "deploy-and-smoke - run $($script:RunId)"
    if ($DryRun) { $banner += ' (dry-run)' }
    Write-Host $banner

    # Step 1 -- local git pull (refreshes origin/main for the gate below).
    if (-not (Invoke-GitPull)) { Write-Report; exit $EXIT_REMOTE_FAILED }

    # Step 2 -- migration-detection gate (Q2.a). Operator abort -> exit 40.
    if (-not (Invoke-MigrationGate)) { Write-Report; exit $EXIT_GATE_ABORTED }

    if ($DryRun) {
        Add-Step -Section remote -Name 'deploy (build/up/migrate/seed/health)' -Status skip -Detail 'dry-run'
    } else {
        # Steps 3-4 -- build + up. Halt on failure: smoking a broken deploy is noise.
        if (-not (Add-RemoteStep -Action build -Label 'build')) { Write-Report; exit $EXIT_REMOTE_FAILED }
        if (-not (Add-RemoteStep -Action up    -Label 'up'))    { Write-Report; exit $EXIT_REMOTE_FAILED }

        # Step 5 -- migrate (skippable).
        if ($SkipMigrate) {
            Add-Step -Section remote -Name 'migrate' -Status skip -Detail '-SkipMigrate'
        } elseif (-not (Add-RemoteStep -Action migrate -Label 'migrate')) {
            Write-Report; exit $EXIT_REMOTE_FAILED
        }

        # Step 6 -- seed (always run unless skipped; idempotent, Q4.a).
        if ($SkipSeed) {
            Add-Step -Section remote -Name 'seed' -Status skip -Detail '-SkipSeed'
        } elseif (-not (Add-RemoteStep -Action seed -Label 'seed')) {
            Write-Report; exit $EXIT_REMOTE_FAILED
        }

        # Step 7 -- health. Records but does not halt; the smoke (step 8) adds detail.
        Add-HealthStep | Out-Null
    }

    # Step 8 API smoke (C) + bundle (D) are wired in by later commits.

    Write-Report
    exit (Get-ExitCode)
}
catch {
    Write-Host "[FAIL] unexpected: $($_.Exception.Message)"
    Add-Appendix 'unexpected-exception' ($_ | Out-String)
    try { Write-Report } catch { }
    exit $EXIT_UNEXPECTED
}
finally {
    Pop-Location -ErrorAction SilentlyContinue
}
