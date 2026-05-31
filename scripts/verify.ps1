#requires -Version 5.1
<#
.SYNOPSIS
    Unified quality-gate runner for digiuniversity (R-CI capstone, Q3.a).

.DESCRIPTION
    ONE entry point for the four quality gates, so the same definition of
    "green" is consumed by both CI and the deploy gate (deploy-and-smoke.ps1).
    This is the structural D81 closure: before R-CI, audit-lint lived only in
    the test path (pretest -> lint:audit) and could stay silently red while the
    deploy path went green. verify.ps1 is the single source of truth.

    Gates (in order):
      1. web tsc      apps/web    `npm run typecheck`  (tsc --noEmit)
      2. api tsc      apps/api    `npm run typecheck`  (tsc --noEmit -p tsconfig.build.json)
      3. audit-lint   repo root   tools/eslint-rules/audit-on-mutation.js
      4. api jest     VPS         `remote.ps1 test`    (DB-backed, docker test profile)

    Gates 1-3 are local, fast, and SIDE-EFFECT-FREE -- they check the current
    working tree. Gate 4 is the DB-backed jest suite; it runs on the VPS via
    `remote.ps1 test`, which FIRST does `git push origin main` (so the VPS tests
    the committed+pushed code, i.e. exactly what a deploy would ship) and then
    builds + runs the api-test docker profile against the live postgres. The
    api-test image creates its own throwaway tenant slugs, so it never touches
    the running production schema.

    Ordering is deliberate: the three static gates run first and the jest gate
    runs ONLY if all three are green. A red static gate therefore NEVER triggers
    the push (you don't ship -- or push -- code that doesn't even typecheck).
    Use -SkipJest for a fast, fully-local, zero-push run.

    Scope note: gates 1-3 see your LOCAL working tree (including uncommitted
    edits); gate 4 sees the last-pushed origin/main. In the normal commit ->
    verify -> deploy flow there are no uncommitted edits at verify time, so both
    see the same code. Mid-edit standalone runs: -SkipJest, or commit first.

.NOTES
    Built for R-CI capstone phase 1 (decision-log D87 resume anchor).
    Spec: docs/PHASE_B_RCI_CLEANUP_MEMO.md (Q3.a) + PHASE_A_DECISIONS.md (D81/D84/D87).

    ASCII-only on purpose: Windows PowerShell 5.1 decodes a BOM-less .ps1 as the
    system ANSI code page, so non-ASCII glyphs would mojibake at execution time.
    Status is reported with [PASS]/[FAIL]/[SKIP] tags. The script is kept
    PS 5.1- AND PS 7-compatible so a future CI consumer (ubuntu pwsh) can call it
    for the static gates.

    Exit codes (one per failure family; first failing gate in gate order wins):
      0   all gates green
      10  web tsc failed
      20  api tsc failed
      30  audit-lint failed
      40  api jest failed
      99  unexpected exception
#>
[CmdletBinding()]
param(
    # Static-only: run gates 1-3 (web tsc + api tsc + audit-lint) and skip the
    # DB-backed jest gate. No `git push`, no VPS, no docker. Use for fast local
    # iteration or a CI static-analysis pass.
    [switch]$SkipJest
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- Exit codes ------------------------------------------------------------
$EXIT_OK         = 0
$EXIT_WEB_TSC    = 10
$EXIT_API_TSC    = 20
$EXIT_AUDIT      = 30
$EXIT_JEST       = 40
$EXIT_UNEXPECTED = 99

# --- Paths -----------------------------------------------------------------
$RepoRoot    = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$WebDir      = Join-Path $RepoRoot 'apps\web'
$ApiDir      = Join-Path $RepoRoot 'apps\api'
$AuditScript = Join-Path $RepoRoot 'tools\eslint-rules\audit-on-mutation.js'
$RemoteScript= Join-Path $PSScriptRoot 'remote.ps1'
$LogDir      = Join-Path $RepoRoot 'logs\verify'

# --- Run state -------------------------------------------------------------
# Each gate is a record: { Name; Status; Detail; ExitOnFail }. Status drives
# both the verdict and the exit code: pass/skip/info never fail; fail does.
$script:Steps    = New-Object System.Collections.Generic.List[object]
# Raw captured command output, appended to the log file only (postmortems).
$script:Appendix = New-Object System.Collections.Generic.List[string]
$script:RunId    = (Get-Date).ToString('yyyy-MM-dd-HHmmss')

function Add-Step {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][ValidateSet('pass','fail','skip','info')][string]$Status,
        [string]$Detail = '',
        [int]$ExitOnFail = 0
    )
    $script:Steps.Add([pscustomobject]@{
        Name       = $Name
        Status     = $Status
        Detail     = $Detail
        ExitOnFail = $ExitOnFail
    })
    $glyph = switch ($Status) {
        'pass' { '[OK]  ' }
        'fail' { '[FAIL]' }
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
    # Retention: prune verify logs older than 30 days (mirrors deploy logs).
    $cutoff = (Get-Date).AddDays(-30)
    Get-ChildItem -Path $LogDir -Filter '*.md' -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -lt $cutoff } |
        Remove-Item -Force -ErrorAction SilentlyContinue
}

function Invoke-Native {
    # Run a native command, capture its exit code + merged output WITHOUT
    # throwing on stderr. EAP is relaxed to Continue first because npm/tsc/node/
    # ssh write progress to stderr, which would throw under Stop + 2>&1. This is
    # the same proven pattern deploy-and-smoke.ps1 uses for remote.ps1/curl/git.
    param([Parameter(Mandatory)][scriptblock]$Script)
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $global:LASTEXITCODE = 0
    try { $raw = & $Script 2>&1 }
    finally { $ErrorActionPreference = $prevEAP }
    $code = $LASTEXITCODE
    $text = (@($raw) | ForEach-Object { "$_" }) -join "`n"
    if ($VerbosePreference -ne 'SilentlyContinue' -and $text) { Write-Host $text }
    return [pscustomobject]@{ Code = $code; Output = $text }
}

# --- Gate 1+2: tsc (web + api share the same npm `typecheck` script) -------
function Add-TscGate {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$WorkDir,
        [Parameter(Mandatory)][int]$ExitCode
    )
    Write-Host ">> $Name  ($WorkDir : npm run typecheck)"
    Push-Location $WorkDir
    try { $r = Invoke-Native { npm run typecheck } }
    finally { Pop-Location }
    Add-Appendix "$Name (npm run typecheck, exit $($r.Code))" $r.Output
    if ($r.Code -eq 0) {
        Add-Step -Name $Name -Status pass -Detail '0 errors'
        return $true
    }
    # tsc ends with "Found N error(s) in ...": surface the count when present.
    $detail = "exit $($r.Code)"
    if ($r.Output -match 'Found\s+(\d+)\s+error') { $detail = "$($matches[1]) type error(s)" }
    Add-Step -Name $Name -Status fail -Detail $detail -ExitOnFail $ExitCode
    return $false
}

# --- Gate 3: audit-on-mutation lint ----------------------------------------
function Add-AuditGate {
    # node tools/eslint-rules/audit-on-mutation.js
    #   exit 0 = PASS (stdout: "PASS (N controller files scanned, 0 violations)")
    #   exit 1 = violations (stderr lists each)
    #   exit 2 = internal error (typescript not resolvable -> npm install apps/api)
    Write-Host '>> audit-lint  (tools/eslint-rules/audit-on-mutation.js)'
    $r = Invoke-Native { node $AuditScript }
    Add-Appendix "audit-on-mutation (exit $($r.Code))" $r.Output
    if ($r.Code -eq 0) {
        $detail = 'no violations'
        if ($r.Output -match '(\d+)\s+controller files scanned') { $detail = "$($matches[1]) controllers, 0 violations" }
        Add-Step -Name 'audit-lint' -Status pass -Detail $detail
        return $true
    }
    if ($r.Code -eq 2) {
        Add-Step -Name 'audit-lint' -Status fail -Detail 'could not run (typescript unresolved - run npm install in apps/api)' -ExitOnFail $EXIT_AUDIT
        return $false
    }
    $detail = "exit $($r.Code)"
    if ($r.Output -match '(\d+)\s+violation') { $detail = "$($matches[1]) violation(s)" }
    Add-Step -Name 'audit-lint' -Status fail -Detail $detail -ExitOnFail $EXIT_AUDIT
    return $false
}

# --- Gate 4: api jest (DB-backed, on the VPS via remote.ps1 test) -----------
function Add-JestGate {
    # remote.ps1 test = local audit-lint (re-run) -> git push origin main ->
    # remote `docker compose --profile test build api-test && run --rm api-test`.
    # The push is intrinsic: the VPS tests the committed+pushed code (what a
    # deploy ships). We only reach here when gates 1-3 are green, so the push
    # never carries un-typechecked code. Exit code propagates jest's result
    # (the final ssh native command).
    Write-Host '>> api jest  (remote.ps1 test -> git push + VPS docker test profile)'
    Write-Host '   note: this pushes origin/main, then runs DB-backed jest on the VPS.'
    $r = Invoke-Native { & $RemoteScript -Action test }
    Add-Appendix "remote.ps1 test (exit $($r.Code))" $r.Output
    if ($r.Code -eq 0) {
        $detail = 'jest suite passed'
        $m = [regex]::Match($r.Output, 'Tests:\s+([^\r\n]+)')
        if ($m.Success) { $detail = "Tests: $($m.Groups[1].Value.Trim())" }
        Add-Step -Name 'api jest (DB-backed)' -Status pass -Detail $detail
        return $true
    }
    Add-Step -Name 'api jest (DB-backed)' -Status fail -Detail "exit $($r.Code) (see log appendix)" -ExitOnFail $EXIT_JEST
    return $false
}

# --- Report ----------------------------------------------------------------
function Get-Verdict {
    $fails = @($script:Steps | Where-Object { $_.Status -eq 'fail' })
    if ($fails.Count -gt 0) {
        $names = ($fails | ForEach-Object { $_.Name }) -join '; '
        return "FAIL - $($fails.Count) gate(s): $names"
    }
    $skips = @($script:Steps | Where-Object { $_.Status -eq 'skip' })
    if ($skips.Count -gt 0) {
        return "PASS (with $($skips.Count) skipped gate(s))"
    }
    return 'all green'
}

function Get-ExitCode {
    # First failing gate in gate order wins (ExitOnFail carries the family code).
    $failed = @($script:Steps | Where-Object { $_.Status -eq 'fail' -and $_.ExitOnFail -ne 0 })
    if ($failed.Count -gt 0) { return $failed[0].ExitOnFail }
    return $EXIT_OK
}

function Write-Report {
    $sha = Get-HeadSha
    $iso = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
    $mode = if ($SkipJest) { ' (static-only)' } else { '' }

    $report = New-Object System.Collections.Generic.List[string]
    $report.Add("# Verify Report - $sha - $iso$mode")
    $report.Add('')
    $report.Add('## Gates')
    if ($script:Steps.Count -eq 0) {
        $report.Add('- (none)')
    } else {
        foreach ($s in $script:Steps) {
            $tag = switch ($s.Status) {
                'pass' { '[PASS]' }
                'fail' { '[FAIL]' }
                'skip' { '[SKIP]' }
                default { '[INFO]' }
            }
            $line = "- $tag $($s.Name)"
            if ($s.Detail) { $line += " - $($s.Detail)" }
            $report.Add($line)
        }
    }
    $report.Add('')
    $report.Add('## Verdict')
    $report.Add("- $(Get-Verdict)")

    # stdout = the markdown report (a caller can capture it; phase-2 folds it
    # into the deploy report appendix).
    Write-Output ($report -join "`n")

    # Log file = report + raw-output appendix for postmortems.
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
    Write-Host "Report written to logs/verify/$($script:RunId).md"
}

# --- main ------------------------------------------------------------------
try {
    Push-Location $RepoRoot
    Initialize-Log
    $banner = "verify - run $($script:RunId)"
    if ($SkipJest) { $banner += ' (static-only)' }
    Write-Host $banner

    # Gates 1-3: local static analysis. Always run all three (collect every
    # failure in one pass), then decide on the jest gate.
    $webOk   = Add-TscGate   -Name 'web tsc' -WorkDir $WebDir -ExitCode $EXIT_WEB_TSC
    $apiOk   = Add-TscGate   -Name 'api tsc' -WorkDir $ApiDir -ExitCode $EXIT_API_TSC
    $auditOk = Add-AuditGate
    $staticOk = $webOk -and $apiOk -and $auditOk

    # Gate 4: jest. Only when static is green AND not -SkipJest -- so a red
    # static gate never causes a push, and -SkipJest is a fully-local run.
    if ($SkipJest) {
        Add-Step -Name 'api jest (DB-backed)' -Status skip -Detail '-SkipJest (static-only run; no push)'
    } elseif (-not $staticOk) {
        Add-Step -Name 'api jest (DB-backed)' -Status skip -Detail 'static gate(s) red - jest skipped (no push to origin/main)'
    } else {
        Add-JestGate | Out-Null
    }

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
