param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("push","pull","build","up","down","restart","logs","logs-live","test","status","shell","domain-probe","caddy-install","caddy-reload","caddy-verify","caddy-logs","caddy-probe-and-logs","caddy-which-config","backup","restore","migrate","seed","health","rollout","rollback","provision-env","show-env")]
    [string]$Action,

    # Optional positional args for the new ops actions:
    #   restore -File <path-on-vps>
    #   rollout -Service <compose-service-name>
    #   provision-env -Force (rotate existing .env)
    [string]$File,
    [string]$Service,
    [switch]$Force
)

$Server = "my-vps"
$ProjectPath = "/var/www/digiuniversity"
$BackupDir = "/var/backups/digiuniversity"
$Branch = "main"

function Remote($cmd) {
    ssh $Server "cd $ProjectPath && $cmd"
}

function Invoke-RemoteBash([string]$bashScript) {
    # Execute a multi-line bash script on the VPS without any UTF-8 BOM
    # or CRLF leaking in. We base64-encode the script on the Windows
    # side and have bash decode + exec it remotely — that sidesteps
    # every stdin encoding pitfall (Process.StandardInput writes a BOM,
    # CRLF normalisation, code-page mangling, etc.).
    #
    # `| Out-Host` forces ssh's output to render on the user's terminal
    # rather than being captured into the function's pipeline output
    # (which would happen with `(Invoke-RemoteBash ...)` callers and
    # silence everything ssh wrote).
    #
    # Returns the bash exit code so callers can propagate via `exit`.
    $normalised = $bashScript -replace "`r`n", "`n" -replace "`r", "`n"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($normalised)
    $b64 = [Convert]::ToBase64String($bytes)
    ssh $Server "echo $b64 | base64 -d | bash -s" | Out-Host
    return $LASTEXITCODE
}

function Invoke-RemoteBashWithArg([string]$bashScript, [string]$arg) {
    # Same as Invoke-RemoteBash but passes one positional arg to bash,
    # readable as $1. Used by provision-env for the force/noforce flag.
    $normalised = $bashScript -replace "`r`n", "`n" -replace "`r", "`n"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($normalised)
    $b64 = [Convert]::ToBase64String($bytes)
    ssh $Server "echo $b64 | base64 -d | bash -s -- $arg" | Out-Host
    return $LASTEXITCODE
}

switch ($Action) {
    "push" {
        git add .
        git commit -m "agent update"
        git push origin $Branch
    }

    "pull" {
        Remote "git pull origin $Branch"
    }

    "build" {
        git push origin $Branch
        Remote "git pull origin $Branch && docker compose build"
    }

    "up" {
        git push origin $Branch
        Remote "git pull origin $Branch && docker compose up -d --build"
    }

    "down" {
        Remote "docker compose down"
    }

    "restart" {
        git push origin $Branch
        Remote "git pull origin $Branch && docker compose down && docker compose up -d --build"
    }

    "logs" {
        Remote "docker compose logs --tail=200"
    }

    "logs-live" {
        ssh $Server "cd $ProjectPath && docker compose logs -f --tail=100"
    }

    "test" {
        # Builds and runs the api test image against the live postgres
        # + ai-gateway services. Each spec creates its own tenant slug
        # so test data never collides with the demo seed.
        git push origin $Branch
        Remote "git pull origin $Branch && docker compose --profile test build api-test && docker compose --profile test run --rm api-test"
    }

    "status" {
        Remote "git status && docker compose ps && docker ps"
    }

    "shell" {
        ssh $Server
    }

    "domain-probe" {
        # Run from the VPS itself so we bypass any Windows TLS quirks.
        # Direct-container check uses docker exec instead of a host port,
        # so this still works after R5 removes the 8090:80 publication.
        Remote "echo '--- DNS ---' && (getent hosts digiuniversity.ir || echo 'no DNS resolution from VPS') ; echo '--- direct container (via docker exec) ---' && docker exec digiuniversity-app curl -sSI -H 'Host: digiuniversity.ir' http://127.0.0.1/ ; echo '--- via host Caddy on :80 ---' && curl -sSI -H 'Host: digiuniversity.ir' http://127.0.0.1/ ; echo '--- via host Caddy on :443 with Host hdr ---' && curl -k -sSI --resolve digiuniversity.ir:443:127.0.0.1 https://digiuniversity.ir/ ; echo '--- /healthz via local :443 ---' && curl -k -sS --resolve digiuniversity.ir:443:127.0.0.1 https://digiuniversity.ir/healthz"
    }

    "caddy-install" {
        # Copy the Caddyfile snippet into the host Caddy's config dir and
        # reload Caddy. Assumes hooshgate_caddy mounts /etc/caddy as a host
        # volume (the conventional setup). We only append if not already
        # present, so re-running is safe.
        git push origin $Branch
        $bash = @'
set -eu
cd /var/www/digiuniversity
git pull origin main

CADDY_CONTAINER=hooshgate_caddy
APP_NETWORK=digiuniversity_web

# 1. Make sure docker-compose is up and our network exists.
docker compose up -d --build

# 2. Attach the host Caddy to the app network (idempotent).
if ! docker network inspect "$APP_NETWORK" --format '{{range .Containers}}{{.Name}} {{end}}' | grep -qw "$CADDY_CONTAINER"; then
    docker network connect "$APP_NETWORK" "$CADDY_CONTAINER"
    echo "Connected $CADDY_CONTAINER to $APP_NETWORK."
else
    echo "$CADDY_CONTAINER is already on $APP_NETWORK."
fi

# 3. Locate the host-side Caddyfile / config dir.
HOST_CADDYFILE=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}' "$CADDY_CONTAINER" 2>/dev/null || true)
HOST_CADDY_DIR=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/caddy"}}{{.Source}}{{end}}{{end}}' "$CADDY_CONTAINER" 2>/dev/null || true)

if [ -z "$HOST_CADDYFILE" ] && [ -z "$HOST_CADDY_DIR" ]; then
    echo "ERROR: $CADDY_CONTAINER does not bind-mount /etc/caddy or /etc/caddy/Caddyfile."
    exit 1
fi

# 4. Idempotently install the snippet. If a previous version is there,
#    rewrite the block in place between BEGIN/END markers.
MARK_BEGIN="# >>> digiuniversity site block (managed by remote.ps1) >>>"
MARK_END="# <<< digiuniversity site block <<<"
SNIPPET=$(printf "\n%s\n%s\n%s\n" "$MARK_BEGIN" "$(cat infra/Caddyfile.snippet)" "$MARK_END")

write_snippet() {
    target_file="$1"
    # Build the cleaned + extended content in memory, then write it back
    # with `tee` (O_TRUNC) so the file's inode is preserved. Docker bind
    # mounts of single files track the inode, so sed -i (which replaces
    # the file) would silently break the mount.
    cleaned=$(sudo cat "$target_file" \
        | sed "/^# >>> digiuniversity site block/,/^# <<< digiuniversity site block/d" \
        | sed "/^digiuniversity\.ir/,/^}/d" \
        | sed "/^# Option [AB] —.*$/d" \
        | sed "/^# We use container-to-container traffic.*$/d" \
        | awk 'NF {p=1} p{print}' \
        | awk 'BEGIN{n=0} /./ {for(i=0;i<n;i++) print ""; n=0; print; next} {n++}')

    printf "%s%s" "$cleaned" "$SNIPPET" | sudo tee "$target_file" > /dev/null
    echo "Wrote managed block to $target_file (inode preserved)"
}

if [ -n "$HOST_CADDY_DIR" ] && [ -d "$HOST_CADDY_DIR" ]; then
    # Prefer a conf.d include if the dir is mounted as a directory.
    sudo mkdir -p "$HOST_CADDY_DIR/conf.d"
    sudo cp infra/Caddyfile.snippet "$HOST_CADDY_DIR/conf.d/digiuniversity.caddy"
    if [ -n "$HOST_CADDYFILE" ] && ! sudo grep -q "import conf.d/\*" "$HOST_CADDYFILE"; then
        echo "" | sudo tee -a "$HOST_CADDYFILE" > /dev/null
        echo "import conf.d/*" | sudo tee -a "$HOST_CADDYFILE" > /dev/null
    fi
    echo "Installed snippet at $HOST_CADDY_DIR/conf.d/digiuniversity.caddy"
elif [ -n "$HOST_CADDYFILE" ]; then
    write_snippet "$HOST_CADDYFILE"
fi

# 6. Reload Caddy. If a prior sed -i orphaned the bind mount (host inode
#    != container inode), the container's view of Caddyfile is stale and
#    Caddy would reload the old content. The Caddyfile may also be
#    mounted read-only, so we can't write to it from inside the
#    container. Workaround: pipe the canonical host file straight into
#    `caddy reload --config -`, which bypasses the orphan entirely. The
#    orphaned mount self-heals on the next legitimate restart of the
#    Caddy container.
if [ -n "$HOST_CADDYFILE" ]; then
    HOST_INO=$(sudo stat -c %i "$HOST_CADDYFILE")
    CONT_INO=$(docker exec "$CADDY_CONTAINER" stat -c %i /etc/caddy/Caddyfile)
    if [ "$HOST_INO" != "$CONT_INO" ]; then
        echo "Bind-mount inode drift detected (host=$HOST_INO container=$CONT_INO); reloading Caddy from stdin instead of the orphaned file."
        sudo cat "$HOST_CADDYFILE" | docker exec -i "$CADDY_CONTAINER" caddy reload --config /dev/stdin --adapter caddyfile
    else
        docker exec "$CADDY_CONTAINER" caddy validate --config /etc/caddy/Caddyfile
        docker exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile
    fi
else
    docker exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile
fi
echo "Caddy reloaded."
'@
        # Pipe the script into bash on the VPS so 'set -e' and arrays work
        # regardless of the user's login shell. We normalise to LF and write
        # raw bytes so PowerShell does not inject a BOM or CRLFs.
        $bash = $bash -replace "`r`n", "`n" -replace "`r", "`n"
        $si = New-Object System.Diagnostics.ProcessStartInfo
        $si.FileName = "ssh"
        $si.Arguments = "$Server `"bash -s`""
        $si.UseShellExecute = $false
        $si.RedirectStandardInput = $true
        $p = [System.Diagnostics.Process]::Start($si)
        $p.StandardInput.NewLine = "`n"
        $p.StandardInput.Write($bash)
        $p.StandardInput.Close()
        $p.WaitForExit()
        exit $p.ExitCode
    }

    "caddy-reload" {
        Remote "docker exec hooshgate_caddy caddy reload --config /etc/caddy/Caddyfile"
    }

    "caddy-logs" {
        # Tail Caddy's recent stdout to debug proxy issues. Filtered to lines
        # that mention digiuniversity so other tenants stay out of the dump.
        Remote "docker logs --tail=400 hooshgate_caddy 2>&1 | grep -iE 'digiuniversity|reverse_proxy|upstream' | tail -40"
    }

    "caddy-which-config" {
        # Confirm exactly which Caddyfile Caddy is loading, and what the
        # in-container file's reverse_proxy line says.
        Remote "echo '--- Caddy process command-line ---' && docker exec hooshgate_caddy sh -c 'cat /proc/1/cmdline | tr \0 \  ; echo' && echo '--- digi reverse_proxy line as Caddy sees it ---' && docker exec hooshgate_caddy grep -nE 'reverse_proxy.*8090|reverse_proxy.*digiuniversity' /etc/caddy/Caddyfile || true ; echo '--- inode of /etc/caddy/Caddyfile (container) vs host file ---' && docker exec hooshgate_caddy stat -c '%i %n' /etc/caddy/Caddyfile ; sudo stat -c '%i %n' /home/ubuntu/Desktop/magazine/deploy/Caddyfile"
    }

    "caddy-probe-and-logs" {
        # Force a request through Caddy from inside the network, then
        # immediately tail the very latest digiuniversity log entry to see
        # what Caddy actually attempted.
        $bash = @'
set -eu
echo "--- request via local :443 ---"
curl -k -sSI --resolve digiuniversity.ir:443:127.0.0.1 https://digiuniversity.ir/ || true
sleep 1
echo "--- most recent Caddy log entries for digiuniversity ---"
docker logs --since=10s hooshgate_caddy 2>&1 | grep -iE 'digiuniversity|upstream|dial' | tail -10
'@
        $bash = $bash -replace "`r`n", "`n" -replace "`r", "`n"
        $si = New-Object System.Diagnostics.ProcessStartInfo
        $si.FileName = "ssh"
        $si.Arguments = "$Server `"bash -s`""
        $si.UseShellExecute = $false
        $si.RedirectStandardInput = $true
        $p = [System.Diagnostics.Process]::Start($si)
        $p.StandardInput.NewLine = "`n"
        $p.StandardInput.Write($bash)
        $p.StandardInput.Close()
        $p.WaitForExit()
        exit $p.ExitCode
    }

    "caddy-verify" {
        # Narrow verifier: count managed/unmanaged digiuniversity blocks
        # in the host Caddyfile without dumping unrelated tenants' config.
        $bash = @'
set -eu
CADDY=hooshgate_caddy
HOST_CADDYFILE=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}' "$CADDY")
echo "Caddyfile: $HOST_CADDYFILE"
echo -n "managed-marker lines (expect 2): "
sudo grep -cE '^# (>>>|<<<) digiuniversity site block' "$HOST_CADDYFILE" || true
echo -n "unmanaged site-opener lines (expect 0): "
sudo grep -cE '^digiuniversity\.ir' "$HOST_CADDYFILE" || true
echo -n "header_up X-Forwarded-* lines in digi area (expect 0): "
sudo grep -cE 'header_up X-Forwarded' "$HOST_CADDYFILE" || true
echo "--- unmanaged digiuniversity lines OUTSIDE the markers (expect none) ---"
sudo awk '
  /^# >>> digiuniversity/ {inblock=1; next}
  /^# <<< digiuniversity/ {inblock=0; next}
  inblock==0 && /^digiuniversity\.ir/ {print FILENAME ":" NR ": " $0}
' "$HOST_CADDYFILE" || echo "(none)"
echo "--- containers on digiuniversity_web ---"
docker network inspect digiuniversity_web --format '{{range .Containers}}{{.Name}} ({{.IPv4Address}}){{"\n"}}{{end}}'
echo "--- hooshgate_caddy → digiuniversity-app reachability ---"
docker exec hooshgate_caddy wget -qO- --timeout=5 http://digiuniversity-app/healthz 2>&1 || echo "(reachability failed)"
echo "--- mounts under /etc/caddy in hooshgate_caddy ---"
docker inspect -f '{{range .Mounts}}{{.Destination}} <- {{.Source}}{{"\n"}}{{end}}' hooshgate_caddy | grep -E '/etc/caddy' || echo "(none)"
echo "--- line numbers of reverse_proxy 127.0.0.1:8090 in Caddyfile (expect 0) ---"
sudo grep -nE 'reverse_proxy[[:space:]]+127\.0\.0\.1:8090' "$HOST_CADDYFILE" || echo "(none)"
echo "--- line numbers of reverse_proxy .*digiuniversity in Caddyfile ---"
sudo grep -nE 'reverse_proxy[[:space:]]+digiuniversity' "$HOST_CADDYFILE" || echo "(none)"
echo "--- Caddy running config (admin API): upstreams for digiuniversity ---"
docker exec hooshgate_caddy sh -c 'wget -qO- http://localhost:2019/config/apps/http/servers 2>/dev/null | head -c 30000' \
  | python3 -c "
import json,sys
try:
    cfg=json.load(sys.stdin)
except Exception as e:
    print('cannot parse:', e); sys.exit(0)
for sname,srv in cfg.items():
    for route in srv.get('routes',[]):
        match=route.get('match',[{}])
        hosts=match[0].get('host',[])
        if any('digiuniversity' in h for h in hosts):
            print(sname, hosts)
            # Walk to find reverse_proxy upstreams
            def find_upstreams(o):
                if isinstance(o,dict):
                    if 'upstreams' in o: return o['upstreams']
                    for v in o.values():
                        r=find_upstreams(v)
                        if r is not None: return r
                if isinstance(o,list):
                    for v in o:
                        r=find_upstreams(v)
                        if r is not None: return r
                return None
            ups=find_upstreams(route)
            print('  upstreams:', ups)
" || echo '(admin API not reachable)'
'@
        $bash = $bash -replace "`r`n", "`n" -replace "`r", "`n"
        $si = New-Object System.Diagnostics.ProcessStartInfo
        $si.FileName = "ssh"
        $si.Arguments = "$Server `"bash -s`""
        $si.UseShellExecute = $false
        $si.RedirectStandardInput = $true
        $p = [System.Diagnostics.Process]::Start($si)
        $p.StandardInput.NewLine = "`n"
        $p.StandardInput.Write($bash)
        $p.StandardInput.Close()
        $p.WaitForExit()
        exit $p.ExitCode
    }

    "health" {
        # Probe the four services from inside the VPS via docker exec, so
        # the action does not depend on any host port publication. After
        # R5, the SPA container is reachable only through the
        # digiuniversity_web docker network (Caddy joins it via
        # caddy-install) — this probe still works because docker exec
        # runs inside the container's own network namespace.
        Remote "set -e; echo '--- nginx (digiuniversity-app) /healthz ---'; docker exec digiuniversity-app curl -fsS http://127.0.0.1/healthz || echo 'FAILED'; echo; echo '--- api /v1/health ---'; docker exec digiuniversity-api curl -fsS http://127.0.0.1:4000/v1/health || echo 'FAILED'; echo; echo '--- ai-gateway /v1/health ---'; docker exec digiuniversity-ai-gateway curl -fsS http://127.0.0.1:8000/v1/health || echo 'FAILED'; echo; echo '--- postgres pg_isready ---'; docker exec digiuniversity-postgres pg_isready -U digiuniversity -d digiuniversity || echo 'FAILED'"
    }

    "migrate" {
        # Apply pending Prisma migrations against the live database.
        # Safe to run on each deploy; `migrate deploy` is idempotent and
        # never resets data (unlike `migrate dev`). Kept separate from
        # `up` so we can run it standalone after a schema change.
        Remote "docker compose exec -T api npx prisma migrate deploy"
    }

    "seed" {
        # Re-run the seeder explicitly. RUN_SEED at boot is opt-in
        # (phase-13 default), so production starts without seeding. Use
        # this to populate the demo tenant on a freshly migrated DB.
        Remote "docker compose exec -T api npm run seed"
    }

    "backup" {
        # Stream a compressed pg_dump to a timestamped file on the VPS,
        # keep the last 14. Prefers /var/backups/digiuniversity (the
        # bootstrap-vps.sh target) but falls back to ~/backups/digi-
        # university when it isn't writable — so the action works on a
        # fresh VPS before bootstrap has been run.
        $bash = @'
set -eu
BACKUP_DIR=/var/backups/digiuniversity
if ! ( [ -d "$BACKUP_DIR" ] && [ -w "$BACKUP_DIR" ] ); then
    if ! mkdir -p "$BACKUP_DIR" 2>/dev/null; then
        BACKUP_DIR="$HOME/backups/digiuniversity"
        mkdir -p "$BACKUP_DIR"
        echo "Note: /var/backups/digiuniversity unavailable; using $BACKUP_DIR."
        echo "      Run scripts/bootstrap-vps.sh on the VPS to get the system-wide path."
    fi
fi
chmod 0700 "$BACKUP_DIR" 2>/dev/null || true
TS=$(date +%F-%H%M%S)
OUT="$BACKUP_DIR/digi-$TS.sql.gz"
docker exec digiuniversity-postgres pg_dump -U digiuniversity -d digiuniversity --no-owner --no-privileges | gzip -9 > "$OUT"
SIZE=$(du -h "$OUT" | cut -f1)
echo "Wrote $OUT ($SIZE)"
# Rotation: keep the 14 most recent .sql.gz, delete the rest.
ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -v
echo "--- last 5 backups ---"
ls -1tlh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -5
'@
        exit (Invoke-RemoteBash $bash)
    }

    "restore" {
        # Restore a previously-created backup. Required: -File <abs-path>.
        # Refuse if no file path; we will not guess.
        if ([string]::IsNullOrWhiteSpace($File)) {
            Write-Error "restore requires -File <path>. Run 'remote.ps1 backup' first, then pick a file from /var/backups/digiuniversity/."
            exit 2
        }
        Write-Host "About to restore from: $File"
        Write-Host "This will DROP and re-create every table in the digiuniversity database."
        $confirm = Read-Host "Type 'restore' to confirm"
        if ($confirm -ne 'restore') {
            Write-Host "Aborted."
            exit 1
        }
        # Drop + recreate the public schema, then pipe the gzip through psql.
        Remote "set -e; test -f '$File' || { echo 'No such file: $File'; exit 2; }; docker exec -i digiuniversity-postgres psql -U digiuniversity -d digiuniversity -c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'; gunzip -c '$File' | docker exec -i digiuniversity-postgres psql -U digiuniversity -d digiuniversity"
    }

    "rollout" {
        # Zero-downtime update of a single service via wowu/docker-rollout.
        # The plugin must already be installed on the VPS (see
        # scripts/bootstrap-vps.sh). Without it, this falls back to a
        # plain `docker compose up -d --build $Service`, which DOES drop
        # connections briefly — so we detect the plugin first.
        if ([string]::IsNullOrWhiteSpace($Service)) {
            Write-Error "rollout requires -Service <name>. Valid: app | api | ai-gateway | postgres"
            exit 2
        }
        git push origin $Branch
        Remote "git pull origin $Branch && docker compose build $Service && (docker rollout --help >/dev/null 2>&1 && docker rollout $Service || (echo 'docker-rollout plugin not installed; falling back to compose up (NOT zero-downtime). Run scripts/bootstrap-vps.sh to install.' && docker compose up -d --no-deps $Service))"
    }

    "provision-env" {
        # Write /var/www/digiuniversity/.env on the VPS with strong random
        # values. Refuses to clobber an existing file unless -Force is
        # given. POSTGRES_PASSWORD is preserved from the existing .env
        # (or defaulted to the value that the live postgres-data volume
        # was initialised with) — rotating it requires also rotating the
        # postgres user's password, which is a separate concern.
        #
        # Secrets are never printed back to stdout. We print only
        # metadata (ls -l, var count).
        $forceArg = if ($Force) { "force" } else { "noforce" }
        # Literal here-string @'...'@ — PowerShell does NOT interpolate
        # any $ or backtick inside, so the bash below is verbatim.
        # Invoke-RemoteBashWithArg pipes it through bash -s with a
        # UTF-8-no-BOM stream so `set -eu` actually takes effect on line 1.
        $bash = @'
set -eu
ENV_FILE=/var/www/digiuniversity/.env
MODE="$1"
if [ -f "$ENV_FILE" ] && [ "$MODE" != "force" ]; then
    echo "Refusing to overwrite $ENV_FILE without -Force." >&2
    exit 2
fi
# Preserve existing postgres password when rotating — otherwise the
# api can no longer auth against the running pg instance.
PG_PW=""
if [ -f "$ENV_FILE" ]; then
    PG_PW=$(grep -E '^POSTGRES_PASSWORD=' "$ENV_FILE" | head -1 | sed 's/^POSTGRES_PASSWORD=//')
fi
if [ -z "$PG_PW" ]; then
    # First-time provision on this VPS — match the value the existing
    # postgres-data volume was initialised with so the api can still
    # connect. To genuinely rotate, do it via psql ALTER USER first.
    PG_PW=digiuniversity_dev
fi

# Trim non-base64-safe chars and clamp to a fixed length per var.
# 64 chars of base64 alphabet => 384 bits of entropy in JWT_SECRET.
JWT=$(openssl rand -base64 96 | tr -d '\n=/+ ' | head -c 64)
ENC=$(openssl rand -base64 64 | tr -d '\n=/+ ' | head -c 32)
SEED_PW=$(openssl rand -base64 32 | tr -d '\n=/+ ' | head -c 24)
AI_KEY=$(openssl rand -hex 32)
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

umask 0177
{
    echo "# Production secrets for digiuniversity. Generated by remote.ps1 provision-env."
    echo "# NEVER commit. NEVER paste. NEVER copy to another host."
    echo "# Rotate via: .\\scripts\\remote.ps1 provision-env -Force"
    echo "# Generated: $TS"
    echo ""
    echo "NODE_ENV=production"
    echo "TZ=Asia/Tehran"
    echo "APP_URL=https://digiuniversity.ir"
    echo ""
    echo "# JWT signing key (HS256 today; RS256 in P20)."
    echo "JWT_SECRET=$JWT"
    echo "JWT_ACCESS_TTL=15m"
    echo "JWT_REFRESH_TTL=30d"
    echo "ENCRYPTION_KEY=$ENC"
    echo ""
    echo "# Postgres — preserved from existing .env, or seeded with the value"
    echo "# the existing postgres-data volume was initialised with."
    echo "POSTGRES_USER=digiuniversity"
    echo "POSTGRES_PASSWORD=$PG_PW"
    echo "POSTGRES_DB=digiuniversity"
    echo ""
    echo "# Seed admin (only when RUN_SEED=true on a fresh DB)."
    echo "SEED_TENANT_SLUG=demo"
    echo "SEED_TENANT_NAME=Demo"
    echo "SEED_ADMIN_EMAIL=admin@digiuniversity.ir"
    echo "SEED_ADMIN_PASSWORD=$SEED_PW"
    echo ""
    echo "# AI gateway — mock by default; no GPU on this VPS."
    echo "AI_MODE=mock"
    echo "AI_SERVICES_BASE_URL=https://future-gpu-server.example.com"
    echo "AI_SERVICES_API_KEY=$AI_KEY"
    echo "AI_TIMEOUT_SECONDS=120"
    echo ""
    echo "# Production defaults — opt-in seeding, info logs, Sentry off."
    echo "RUN_SEED=false"
    echo "LOG_LEVEL=info"
    echo "SENTRY_DSN="
} > "$ENV_FILE"
chmod 0600 "$ENV_FILE"
ls -l "$ENV_FILE"
echo "OK: $(grep -cE '^[A-Z_]+=' "$ENV_FILE") env vars set."
'@
        exit (Invoke-RemoteBashWithArg $bash $forceArg)
    }

    "show-env" {
        # Show .env metadata only — file path, owner, mode, size, mtime,
        # var count. NEVER prints the file contents (secrets would land
        # in the agent's transcript + scrollback).
        Remote "ls -l /var/www/digiuniversity/.env 2>/dev/null || echo 'no .env file (run provision-env first)'; echo '---'; stat -c 'owner: %U:%G  mode: %a  size: %s  mtime: %y' /var/www/digiuniversity/.env 2>/dev/null || true; echo '---'; grep -cE '^[A-Z_]+=' /var/www/digiuniversity/.env 2>/dev/null | xargs -I{} echo 'vars set: {}'"
    }

    "rollback" {
        # Safe rollback: revert the current commit (creates a new commit
        # that undoes the last one) and redeploy. Never `git reset --hard`
        # on shared history — that rewrites main and any other agent
        # pulling will pick up the bad state again on next fetch.
        Write-Host "Rolling back HEAD on origin/main by reverting the last commit."
        $head = git rev-parse --short HEAD
        Write-Host "Current HEAD: $head"
        $confirm = Read-Host "Type 'rollback' to confirm git revert + redeploy"
        if ($confirm -ne 'rollback') {
            Write-Host "Aborted."
            exit 1
        }
        git revert --no-edit HEAD
        if ($LASTEXITCODE -ne 0) {
            Write-Error "git revert failed (likely a merge commit; fix manually). Aborting."
            exit $LASTEXITCODE
        }
        git push origin $Branch
        Remote "git pull origin $Branch && docker compose up -d --build"
    }
}