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
    Built in atomic commits A-F (see the memo's Commits section). The script is
    now complete: local git pull + migration-detection gate + the 7-step
    remote.ps1 deploy (B), the API smoke 8.1-8.4 (C), the bundle check 8.5-8.6
    (D), and the structured report + exit-code contract (machinery in the A
    skeleton, finalized in E). Steps 9-10 emit a markdown report to stdout AND a
    timestamped logs/deploy/*.md (with a raw-output appendix for postmortems),
    plus an exit code per failure family (see Get-ExitCode for the contract).

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
    [switch]$UpdateBaseline,
    # R-CI capstone (Q4.a / D88): bypass the pre-deploy verify gate (static
    # quality gates: web tsc + api tsc + audit-lint). EMERGENCY ONLY -- a hot-
    # fix/rollback that can't wait for verify. Prints a prominent warning + logs
    # it (D81 ethos: gates enforce; a bypass is allowed only WITH visibility,
    # never silent -- a silent bypass would re-open the D81 silent-red hole).
    [switch]$SkipVerify
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- Exit codes (memo, step 10) -------------------------------------------
$EXIT_OK            = 0
$EXIT_REMOTE_FAILED = 10
$EXIT_SMOKE_FAILED  = 20
$EXIT_BUNDLE_FAILED = 30
$EXIT_GATE_ABORTED  = 40
$EXIT_VERIFY_FAILED = 50
$EXIT_UNEXPECTED    = 99

# --- Paths -----------------------------------------------------------------
$RepoRoot      = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$LogDir        = Join-Path $RepoRoot 'logs\deploy'
$BaselinePath  = Join-Path $RepoRoot 'docs\BUNDLE_BASELINE.json'

# --- Smoke targets (memo step 8) -------------------------------------------
# Public ingress base. The api + ai-gateway sit behind Caddy path-strips
# (/api/* -> api:4000/v1, /ai/* -> ai-gateway:8000/v1; infra/Caddyfile.snippet),
# so the public api root is /api/v1 and the SPA health is /healthz.
$BaseUrl = 'https://digiuniversity.ir'
$ApiBase = "$BaseUrl/api/v1"

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
        return 'no steps executed'
    }
    if ($warns.Count -gt 0) {
        return "PASS with $($warns.Count) warning(s)"
    }
    return 'all green'
}

function Get-ExitCode {
    # The full contract: 0 ok / 10 remote / 20 smoke / 30 bundle / 40 gate-
    # aborted / 50 verify-failed / 99 unexpected. Gate aborts (40), verify
    # failures (50), and 99 (catch) all return at their call site, so this
    # maps only the three "a step failed" families. Cascade order remote->smoke->bundle returns the FIRST
    # failing family: a remote failure usually cascades into smoke/bundle, so
    # reporting the root family is more actionable. (Verified: an unreachable
    # prod fails smoke+bundle and exits 20, not 30 -- smoke precedes bundle.)
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
    # Self-documenting header: a pasted report shows how it was invoked, so the
    # owner can see at a glance whether this was a real deploy and which steps
    # were skipped (the Steps section also marks each [SKIP], but the header is
    # the one-line summary that travels with the ping).
    $mods = New-Object System.Collections.Generic.List[string]
    if ($DryRun)         { $mods.Add('dry-run') }
    if ($SkipMigrate)    { $mods.Add('-SkipMigrate') }
    if ($SkipSeed)       { $mods.Add('-SkipSeed') }
    if ($SkipVerify)     { $mods.Add('-SkipVerify') }
    if ($UpdateBaseline) { $mods.Add('-UpdateBaseline') }
    $mode = if ($mods.Count -gt 0) { ' (' + ($mods -join '; ') + ')' } else { '' }

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
    #
    # D83 ruling: this step-2 diff is a PRE-PUSH heuristic -- it fires only for
    # migrations committed locally but not yet on origin/main. In the normal
    # push-then-deploy flow -- and after the verify gate (step 2.5), whose jest
    # stage pushes main -- origin/main == HEAD, so this is a natural no-op. The
    # AUTHORITATIVE post-deploy check is `prisma migrate status` (8.2); step 2 is
    # redundancy (catches an unpushed migration), not a gap.
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

function Invoke-VerifyGate {
    # R-CI capstone (Q4.a gate flip, D88): run the unified verify gate before any
    # deploy mutation. The static gates (web tsc + api tsc + audit-lint) are
    # BLOCKING -- verify.ps1 returns non-zero (10/20/30) on a static failure and
    # we halt the deploy (exit 50). The jest gate is ADVISORY inside verify.ps1
    # (warn, never exits non-zero) until R-CI-Api makes the suite hermetic. In
    # --dry-run we pass -SkipJest so the probe never pushes/builds on the VPS.
    $verify = Join-Path $PSScriptRoot 'verify.ps1'
    $mode = if ($DryRun) { '-SkipJest' } else { '' }
    Write-Host ">> verify.ps1 $mode"
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $global:LASTEXITCODE = 0
    # Pass the switch literally. An array splat (@verifyArgs) would bind
    # '-SkipJest' as a POSITIONAL arg ("positional parameter cannot be found");
    # only a hashtable splat or a literal switch binds a [switch] correctly.
    try {
        if ($DryRun) { $raw = & $verify -SkipJest 2>&1 }
        else         { $raw = & $verify 2>&1 }
    }
    finally { $ErrorActionPreference = $prevEAP }
    $code = $LASTEXITCODE
    $text = (@($raw) | ForEach-Object { "$_" }) -join "`n"
    Add-Appendix "verify.ps1 $mode (exit $code)" $text
    # Pull verify's one-line verdict ('all green' / 'PASS - ...' / 'FAIL - ...')
    # for the report detail. The Gates lines read '- [PASS] ...' (bracket), so
    # this only matches the verdict line.
    $verdict = ''
    $vm = [regex]::Match($text, '(?m)^-\s+(all green|PASS[^\r\n]*|FAIL[^\r\n]*)\s*$')
    if ($vm.Success) { $verdict = $vm.Groups[1].Value.Trim() }
    if ($code -eq 0) {
        $detail = if ($verdict) { $verdict } else { 'static gates green' }
        Add-Step -Section gate -Name 'verify gate' -Status pass -Detail $detail
        return $true
    }
    $detail = if ($verdict) { $verdict } else { "verify exit $code (static gate failed)" }
    Add-Step -Section gate -Name 'verify gate' -Status fail -Detail $detail
    return $false
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

# --- API smoke (memo steps 8.1-8.4) ---------------------------------------
function Invoke-Curl {
    # Thin wrapper over the real curl.exe -- NOT PowerShell's `curl` alias to
    # Invoke-WebRequest, which throws on 4xx/5xx and would break the
    # expect-401 probe. Appends the HTTP status after the body via -w, then
    # splits it back off, so callers get both without a throw. A transport
    # failure (DNS/TLS/timeout) yields curl's "000" -> Code 0, which callers
    # treat as a failure. EAP is relaxed because curl -S writes to stderr.
    param(
        [Parameter(Mandatory)][string]$Url,
        [string]$Method = 'GET',
        [string]$Body,
        [string[]]$Header = @(),
        [int]$TimeoutSec = 20
    )
    # --retry rides out transient blips (timeouts, conn-refused, 5xx/429) so a
    # one-off network hiccup never fails the deploy verdict; genuine 4xx (401,
    # 404) are NOT retried, so the expect-401 probe still returns immediately.
    $curlArgs = @(
        '-s', '-S', '--max-time', "$TimeoutSec", '--connect-timeout', '10',
        '--retry', '2', '--retry-delay', '1', '--retry-connrefused',
        '-w', "`n%{http_code}", '-X', $Method
    )
    foreach ($h in $Header) { $curlArgs += @('-H', $h) }

    $bodyFile = $null
    if ($PSBoundParameters.ContainsKey('Body')) {
        # Windows PowerShell 5.1 mangles embedded double-quotes when a JSON
        # string is passed as a native-command argument, so the API received
        # malformed JSON and 400'd instead of authenticating. Hand curl the
        # body through a UTF-8 (no BOM) temp file: the `@path` arg has no
        # quotes to mangle, and the file bytes are exactly what we wrote.
        $bodyFile = [System.IO.Path]::GetTempFileName()
        [System.IO.File]::WriteAllText($bodyFile, $Body, (New-Object System.Text.UTF8Encoding($false)))
        $curlArgs += @('--data-binary', "@$bodyFile")
    }
    $curlArgs += $Url

    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $global:LASTEXITCODE = 0
    try { $raw = & curl.exe @curlArgs 2>&1 }
    finally {
        $ErrorActionPreference = $prevEAP
        if ($bodyFile -and (Test-Path $bodyFile)) { Remove-Item $bodyFile -Force -ErrorAction SilentlyContinue }
    }
    $text = (@($raw) | ForEach-Object { "$_" }) -join "`n"
    $code = 0
    $respBody = $text
    if ($text -match '(?s)^(.*)\n(\d{3})\s*$') { $respBody = $matches[1]; $code = [int]$matches[2] }
    elseif ($text -match '^(\d{3})\s*$')        { $respBody = '';          $code = [int]$matches[1] }
    return [pscustomobject]@{ Code = $code; Body = $respBody }
}

function Add-PublicHealthSmoke {
    # 8.1 -- public health through the full ingress path (Caddy -> nginx/api/
    # ai-gateway). Distinct from step 7's `health` action, which probes each
    # container from INSIDE the VPS via docker exec: this catches "containers
    # healthy but Caddy upstream stale" (the 502-after-recreate failure mode).
    $endpoints = @(
        [pscustomobject]@{ Name = 'public /healthz (app)';        Url = "$BaseUrl/healthz" }
        [pscustomobject]@{ Name = 'public /api/v1/health (api)';  Url = "$ApiBase/health" }
        [pscustomobject]@{ Name = 'public /ai/v1/health (ai-gw)'; Url = "$BaseUrl/ai/v1/health" }
    )
    foreach ($e in $endpoints) {
        Write-Host ">> GET $($e.Url)"
        $r = Invoke-Curl -Url $e.Url
        if ($r.Code -eq 200) {
            Add-Step -Section smoke -Name $e.Name -Status pass -Detail '200'
        } else {
            Add-Step -Section smoke -Name $e.Name -Status fail -Detail "HTTP $($r.Code)"
            Add-Appendix "GET $($e.Url) -> $($r.Code)" $r.Body
        }
    }
}

function Add-MigrateStatusSmoke {
    # 8.2 -- post-deploy ground truth: does the live schema match the committed
    # migration history? Parses stdout for Prisma's up-to-date line (the exit
    # code is unreliable through the remote.ps1 + ssh layering).
    Write-Host '>> remote.ps1 migrate-status'
    $r = Invoke-RemoteScript -Action migrate-status
    Add-Appendix "remote.ps1 migrate-status (exit $($r.Code))" $r.Output
    if ($r.Output -match 'Database schema is up to date') {
        Add-Step -Section smoke -Name 'prisma migrate status' -Status pass -Detail 'schema up to date'
    } else {
        Add-Step -Section smoke -Name 'prisma migrate status' -Status fail -Detail 'not up to date (pending migration or drift)'
    }
}

function Add-AuthSmoke {
    # 8.3 + 8.4 -- the hybrid the owner chose (Probe 401 + env upgrade):
    #   * default (no SMOKE_* env): POST a well-formed login for a non-existent
    #     tenant; the auth path must answer 401 (proves "API booted AND auth is
    #     validating"). 429 = throttled but up -> warn; anything else -> fail.
    #   * upgraded (SMOKE_TENANT_SLUG + _ADMIN_EMAIL + _ADMIN_PASSWORD all set):
    #     real round-trip -> 200 + accessToken, then GET /auth/me with it -> 200.
    # The minted token is never logged (success bodies are not appended).
    $slug  = $env:SMOKE_TENANT_SLUG
    $email = $env:SMOKE_ADMIN_EMAIL
    $pw    = $env:SMOKE_ADMIN_PASSWORD
    $haveCreds = $slug -and $email -and $pw

    $loginUrl = "$ApiBase/auth/login"
    $meUrl    = "$ApiBase/auth/me"
    $jsonHdr  = 'Content-Type: application/json'

    if (-not $haveCreds) {
        $body = '{"tenantSlug":"smoke-probe","email":"smoke-probe@invalid.example","password":"smoke-not-a-real-pw"}'
        Write-Host ">> POST $loginUrl (bogus -> expect 401)"
        $r = Invoke-Curl -Url $loginUrl -Method POST -Body $body -Header $jsonHdr
        switch ($r.Code) {
            401     { Add-Step -Section smoke -Name 'auth probe (no creds)' -Status pass -Detail '401 as expected; set SMOKE_* env for full round-trip' }
            429     { Add-Step -Section smoke -Name 'auth probe (no creds)' -Status warn -Detail '429 rate-limited (auth up)' }
            default {
                Add-Step -Section smoke -Name 'auth probe (no creds)' -Status fail -Detail "expected 401, got $($r.Code)"
                Add-Appendix "POST $loginUrl (bogus) -> $($r.Code)" $r.Body
            }
        }
        Add-Step -Section smoke -Name 'authed GET /auth/me' -Status skip -Detail 'no SMOKE_* creds configured'
        return
    }

    $payload = @{ tenantSlug = $slug; email = $email; password = $pw } | ConvertTo-Json -Compress
    Write-Host ">> POST $loginUrl (round-trip; creds from SMOKE_* env)"
    $r = Invoke-Curl -Url $loginUrl -Method POST -Body $payload -Header $jsonHdr
    if ($r.Code -ne 200) {
        Add-Step -Section smoke -Name 'login round-trip' -Status fail -Detail "expected 200, got $($r.Code)"
        Add-Appendix "POST $loginUrl (round-trip) -> $($r.Code)" $r.Body
        Add-Step -Section smoke -Name 'authed GET /auth/me' -Status skip -Detail 'login failed'
        return
    }
    $token = $null
    if ($r.Body -match '"accessToken"\s*:\s*"([^"]+)"') { $token = $matches[1] }
    if (-not $token) {
        Add-Step -Section smoke -Name 'login round-trip' -Status fail -Detail '200 but no accessToken in body'
        Add-Step -Section smoke -Name 'authed GET /auth/me' -Status skip -Detail 'no token'
        return
    }
    Add-Step -Section smoke -Name 'login round-trip' -Status pass -Detail '200 + accessToken'

    Write-Host ">> GET $meUrl (authed)"
    $m = Invoke-Curl -Url $meUrl -Header "Authorization: Bearer $token"
    if ($m.Code -eq 200) {
        Add-Step -Section smoke -Name 'authed GET /auth/me' -Status pass -Detail '200'
    } else {
        Add-Step -Section smoke -Name 'authed GET /auth/me' -Status fail -Detail "expected 200, got $($m.Code)"
        Add-Appendix "GET $meUrl (authed) -> $($m.Code)" $m.Body
    }
}

# --- Bundle check (memo steps 8.5-8.6) ------------------------------------
function Get-AssetSize {
    # Identity (uncompressed) byte size of a deployed asset. We deliberately do
    # NOT send Accept-Encoding (no curl --compressed), so the server returns the
    # raw representation whose Content-Length matches the local `npm run build`
    # chunk size -- the apples-to-apples figure the baseline records. (Browsers
    # get the gzip'd copy; the deploy budget is measured on the raw bytes.)
    # Primary: Content-Length from a HEAD (the memo's `curl -sI`). Fallback for
    # a server that omits Content-Length on HEAD: a GET byte count via
    # %{size_download}. Returns $null if neither yields a size.
    param([Parameter(Mandatory)][string]$Url)
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $global:LASTEXITCODE = 0
    $len = $null
    try {
        $head = & curl.exe -sI -S --max-time 20 --connect-timeout 10 --retry 2 --retry-delay 1 --retry-connrefused $Url 2>&1
        $headText = (@($head) | ForEach-Object { "$_" }) -join "`n"
        if ($headText -match '(?im)^\s*Content-Length:\s*(\d+)\s*$') { $len = [int]$matches[1] }
        if ($null -eq $len) {
            $dl = & curl.exe -s -S --max-time 30 --connect-timeout 10 --retry 2 --retry-delay 1 --retry-connrefused -o NUL -w '%{size_download}' $Url 2>&1
            $dlText = ((@($dl) | ForEach-Object { "$_" }) -join '').Trim()
            if ($dlText -match '(\d+)') { $len = [int]$matches[1] }
        }
    }
    finally { $ErrorActionPreference = $prevEAP }
    return $len
}

function Add-BundleSmoke {
    # Reads the LIVE deployed index.html, so both checks verify what users
    # actually receive (not a local build artefact):
    #   8.5 -- every <link rel=modulepreload> must be an allow-listed vendor
    #          chunk; any per-route/admin chunk preloaded on the anon shell is
    #          a fail (the D66 Path D guard -- eager-import leak regression).
    #   8.6 -- the main (index) chunk's identity size vs docs/BUNDLE_BASELINE.json;
    #          warn at +warnDeltaKiB, fail at +failDeltaKiB. Only growth trips it
    #          (a shrink passes). -UpdateBaseline records the measured size.
    $baseline = $null
    try { $baseline = Get-Content -Raw -LiteralPath $BaselinePath | ConvertFrom-Json }
    catch {
        Add-Step -Section bundle -Name 'bundle baseline' -Status fail -Detail "cannot read/parse docs/BUNDLE_BASELINE.json: $($_.Exception.Message)"
        return
    }

    Write-Host ">> GET $BaseUrl/ (index.html for bundle parse)"
    $r = Invoke-Curl -Url "$BaseUrl/"
    if ($r.Code -ne 200) {
        Add-Step -Section bundle -Name 'fetch index.html' -Status fail -Detail "HTTP $($r.Code)"
        Add-Appendix "GET $BaseUrl/ -> $($r.Code)" $r.Body
        return
    }
    $html = $r.Body

    # --- 8.5 modulepreload allow-list (D66 Path D guard) ------------------
    $allow       = @($baseline.modulepreloadAllowlist)
    $preloadTags = [regex]::Matches($html, '<link\b[^>]*\brel="modulepreload"[^>]*>')
    $preloaded   = New-Object System.Collections.Generic.List[string]
    $leaks       = New-Object System.Collections.Generic.List[string]
    foreach ($t in $preloadTags) {
        if ($t.Value -match 'href="([^"]+)"') {
            $file = ($matches[1] -split '/')[-1]
            $preloaded.Add($file)
            # Match by chunk-name prefix so we never depend on Vite's hash
            # format/length: react-vendor-<hash>.js -like 'react-vendor-*'.
            $ok = $false
            foreach ($a in $allow) { if ($file -like "$a-*") { $ok = $true; break } }
            if (-not $ok) { $leaks.Add($file) }
        }
    }
    if ($preloaded.Count -eq 0) {
        Add-Step -Section bundle -Name 'modulepreload allow-list' -Status warn -Detail 'no modulepreload links found (unexpected for this SPA)'
    } elseif ($leaks.Count -gt 0) {
        Add-Step -Section bundle -Name 'modulepreload allow-list' -Status fail -Detail "non-vendor chunk(s) preloaded: $($leaks -join ', ')"
        Add-Appendix 'modulepreload leak (all preloaded chunks)' ($preloaded -join "`n")
    } else {
        Add-Step -Section bundle -Name 'modulepreload allow-list' -Status pass -Detail "vendor only ($($preloaded.Count): $($allow -join ', '))"
    }

    # --- 8.6 main-bundle size delta vs baseline ---------------------------
    $mainName   = $baseline.mainBundle.name
    $scriptTags = [regex]::Matches($html, '<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"')
    $mainUrl    = $null
    foreach ($s in $scriptTags) {
        $src  = $s.Groups[1].Value
        $file = ($src -split '/')[-1]
        if ($file -like "$mainName-*") {
            $mainUrl = if ($src -match '^https?://') { $src } else { "$BaseUrl$src" }
            break
        }
    }
    if (-not $mainUrl) {
        Add-Step -Section bundle -Name 'main bundle size' -Status fail -Detail "no <script type=module src=/assets/$mainName-*.js> in index.html"
        return
    }

    Write-Host ">> HEAD $mainUrl (identity size)"
    $bytes = Get-AssetSize -Url $mainUrl
    if ($null -eq $bytes) {
        Add-Step -Section bundle -Name 'main bundle size' -Status fail -Detail "could not measure $mainUrl (no Content-Length and no download)"
        return
    }

    $baseBytes = [int]$baseline.mainBundle.sizeBytes
    $deltaKiB  = [math]::Round(($bytes - $baseBytes) / 1024, 2)
    $curKiB    = [math]::Round($bytes / 1024, 2)
    $warnKiB   = [double]$baseline.thresholds.warnDeltaKiB
    $failKiB   = [double]$baseline.thresholds.failDeltaKiB
    $sign      = if ($deltaKiB -ge 0) { '+' } else { '' }
    $detail    = "$curKiB KiB (delta $sign$deltaKiB KiB vs baseline)"

    if ($deltaKiB -gt $failKiB) {
        Add-Step -Section bundle -Name 'main bundle size' -Status fail -Detail "$detail; over +$failKiB KiB fail threshold"
    } elseif ($deltaKiB -gt $warnKiB) {
        Add-Step -Section bundle -Name 'main bundle size' -Status warn -Detail "$detail; over +$warnKiB KiB warn threshold"
    } else {
        Add-Step -Section bundle -Name 'main bundle size' -Status pass -Detail $detail
    }

    # -UpdateBaseline: explicit operator opt-in to record the measured size as
    # the new normal (memo flag). Writes regardless of the delta verdict -- that
    # IS the point (accept an intentional, owner-approved bump). Never silent: it
    # logs here AND lands as a reviewable git diff on docs/BUNDLE_BASELINE.json.
    if ($UpdateBaseline) {
        try {
            $baseline.mainBundle.sizeBytes = $bytes
            $baseline.updatedAt = (Get-Date).ToString('yyyy-MM-dd')
            $baseline.source    = "updated via -UpdateBaseline against $mainUrl"
            $json = $baseline | ConvertTo-Json -Depth 6
            [System.IO.File]::WriteAllText($BaselinePath, $json, (New-Object System.Text.UTF8Encoding($false)))
            Add-Step -Section bundle -Name 'baseline update' -Status info -Detail "mainBundle.sizeBytes -> $bytes (review the git diff)"
        } catch {
            Add-Step -Section bundle -Name 'baseline update' -Status warn -Detail "write failed: $($_.Exception.Message)"
        }
    }
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

    # Step 2.5 -- verify gate (R-CI capstone Q4.a / D88). Runs AFTER the migration
    # gate on purpose: verify's jest stage pushes main, which would empty
    # origin/main..HEAD and blind the step-2 migration heuristic if it ran first.
    # Static gates BLOCK (a red one -> exit 50); jest is advisory. -SkipVerify
    # bypasses (emergency only) with a prominent, logged warning.
    if ($SkipVerify) {
        Write-Host ''
        Write-Host '!! VERIFY SKIPPED (-SkipVerify): static quality gates bypassed -- EMERGENCY USE ONLY.'
        Add-Step -Section gate -Name 'verify gate' -Status warn -Detail 'SKIPPED via -SkipVerify (static gates bypassed; emergency only)'
    } elseif (-not (Invoke-VerifyGate)) {
        Write-Report; exit $EXIT_VERIFY_FAILED
    }

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

    # Step 8 -- API smoke (8.1-8.4) + bundle (8.5-8.6). Runs in BOTH modes:
    # under --dry-run we skip the deploy but still smoke current prod, which is
    # exactly what verifies the report shape end-to-end against the live system.
    Add-PublicHealthSmoke
    Add-MigrateStatusSmoke
    Add-AuthSmoke
    Add-BundleSmoke

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
