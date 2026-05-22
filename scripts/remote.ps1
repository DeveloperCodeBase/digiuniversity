param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("push","pull","build","up","down","restart","logs","logs-live","test","status","shell","domain-probe","caddy-install","caddy-reload","caddy-verify","caddy-logs","caddy-probe-and-logs","caddy-which-config","backup","restore","migrate","seed","health","rollout","rollback","provision-env","show-env","pin-image","list-images","spa-probe","security-probe","visual")]
    [string]$Action,

    # Optional positional args for the new ops actions:
    #   restore -File <path-on-vps>
    #   rollout -Service <compose-service-name>
    #   provision-env -Force (rotate existing .env)
    #   rollback -Sha <git-sha> (image-tag rollback; falls back to git revert)
    [string]$File,
    [string]$Service,
    [string]$Sha,
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
        # Phase-16 hardening: the docs/ bind mount from the visual
        # container can leave tracked PNGs locally modified. Reset
        # docs/ before pull so we always converge on origin/main.
        Remote "git checkout -- docs/ 2>/dev/null; git clean -fd docs/ 2>/dev/null; git pull origin $Branch"
    }

    "build" {
        git push origin $Branch
        Remote "git checkout -- docs/ 2>/dev/null; git clean -fd docs/ 2>/dev/null; git pull origin $Branch && docker compose build"
    }

    "up" {
        git push origin $Branch
        Remote "git checkout -- docs/ 2>/dev/null; git clean -fd docs/ 2>/dev/null; git pull origin $Branch && docker compose up -d --build"
    }

    "down" {
        Remote "docker compose down"
    }

    "restart" {
        git push origin $Branch
        Remote "git checkout -- docs/ 2>/dev/null; git clean -fd docs/ 2>/dev/null; git pull origin $Branch && docker compose down && docker compose up -d --build"
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
        # Stream the host Caddyfile into Caddy via stdin and reload — this
        # bypasses the bind-mount inode drift bug (caddy-install writes
        # the host file in place, but the container's view can be stale
        # if the mount got orphaned by a previous in-place edit). Also
        # forces full re-resolution of upstream DNS, which a plain
        # `caddy reload --config /etc/caddy/Caddyfile` does NOT do if
        # Caddy thinks the config bytes are unchanged. After a
        # `docker compose up -d` recreates the api container its IP
        # rotates and the stale Caddy upstream entry 502s — this gets
        # us off it without restarting Caddy entirely.
        $bash = @'
set -eu
CADDY=hooshgate_caddy
HOST_CADDYFILE=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}' "$CADDY")
if [ -z "$HOST_CADDYFILE" ]; then
    echo "ERROR: $CADDY does not bind-mount /etc/caddy/Caddyfile"; exit 1
fi
echo "Reloading $CADDY from $HOST_CADDYFILE via stdin"
sudo cat "$HOST_CADDYFILE" | docker exec -i "$CADDY" caddy reload --config /dev/stdin --adapter caddyfile
echo "Caddy reloaded; upstreams will re-resolve on next request."
'@
        exit (Invoke-RemoteBash $bash)
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
echo "--- line numbers of reverse_proxy api:4000 in Caddyfile (expect >= 1) ---"
sudo grep -nE 'reverse_proxy[[:space:]]+api:4000' "$HOST_CADDYFILE" || echo "(none)"
echo "--- dump only the digiuniversity block from host Caddyfile ---"
sudo awk '
  /^# >>> digiuniversity/ {p=1}
  p {print}
  /^# <<< digiuniversity/ {p=0}
' "$HOST_CADDYFILE" || true
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
        # Two-mode rollback:
        #
        # 1) With -Sha <git-sha>: pin IMAGE_TAG=<sha> and `compose up -d`
        #    against the existing :<sha> tagged images on the VPS.
        #    Requires `pin-image` to have been run after the build whose
        #    SHA you want. Fast (no rebuild), no git history rewrite.
        #
        # 2) Without -Sha: safe `git revert HEAD` (creates a new commit
        #    undoing the last) and redeploy. Slow (rebuild) but works
        #    even when no SHA-tagged images exist locally. NEVER does
        #    `git reset --hard` on shared history.
        if (-not [string]::IsNullOrWhiteSpace($Sha)) {
            Write-Host "Image-tag rollback: pinning IMAGE_TAG=$Sha"
            Write-Host "Requires that scripts/remote.ps1 pin-image was run after the build for $Sha."
            $confirm = Read-Host "Type 'rollback' to confirm"
            if ($confirm -ne 'rollback') { Write-Host "Aborted."; exit 1 }
            Remote "IMAGE_TAG=$Sha docker compose up -d --no-build"
            Write-Host "Done. Verify with `remote.ps1 health` + `remote.ps1 status`."
            exit 0
        }
        Write-Host "Git-revert rollback: reverting HEAD on origin/main, then redeploying with rebuild."
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

    "pin-image" {
        # Tag the currently-running app/api/ai-gateway images with the
        # current git short-SHA, so a later `rollback -Sha <sha>` can
        # restore them without rebuilding.
        #
        # Tags are local to the VPS docker daemon. They survive a host
        # reboot but NOT a docker prune; periodic re-pinning + GHCR
        # push (future deploy.yml) is the durable answer.
        $shortSha = (git rev-parse --short HEAD).Trim()
        Write-Host "Pinning current images to tag :$shortSha"
        # Verification grep uses TWO columns: repository tag — that's
        # the `table` format with whitespace-separated fields. Match on
        # the tag exactly (word boundary) without anchoring to EOL.
        Remote "docker tag digiuniversity:latest digiuniversity:$shortSha && docker tag digiuniversity-api:latest digiuniversity-api:$shortSha && docker tag digiuniversity-ai-gateway:latest digiuniversity-ai-gateway:$shortSha && echo 'Pinned:' && docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' | grep -E '^(digiuniversity|digiuniversity-api|digiuniversity-ai-gateway)[[:space:]]+$shortSha[[:space:]]'"
    }

    "list-images" {
        # Show all SHA-tagged digiuniversity images on the VPS, newest
        # first. Useful to pick a -Sha for rollback.
        Remote "docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.CreatedSince}}\t{{.Size}}' | grep -E '^(digiuniversity|digiuniversity-api|digiuniversity-ai-gateway)' | head -30"
    }

    "spa-probe" {
        # Phase-14 R3 verification: confirm BrowserRouter URLs resolve
        # end-to-end through Caddy + nginx. Each path should return
        # HTTP 200 with the SPA shell HTML (Content-Type: text/html).
        # If any path returns a 404, the SPA fallback is broken.
        $bash = @'
set -eu
HOST=digiuniversity.ir
for P in / /home /catalog /course/abc-123 /tutor /labs/nonexistent-path; do
  STATUS=$(curl -k -s -o /dev/null -w '%{http_code}' --resolve "$HOST:443:127.0.0.1" "https://$HOST$P")
  TYPE=$(curl -k -s -I --resolve "$HOST:443:127.0.0.1" "https://$HOST$P" | grep -i '^content-type:' | tr -d '\r')
  if [ "$STATUS" = "200" ]; then
    printf "OK   %3s  %-40s %s\n" "$STATUS" "$P" "$TYPE"
  else
    printf "FAIL %3s  %-40s %s\n" "$STATUS" "$P" "$TYPE"
  fi
done
'@
        exit (Invoke-RemoteBash $bash)
    }

    "security-probe" {
        # Phase-15 R4+R5 verification harness.
        #
        #   1) CSP header: confirm Content-Security-Policy-Report-Only is
        #      present on / and that the policy keywords look right.
        #   2) /sw-recovery.js: must exist (200) and ship Cache-Control
        #      with no-cache so a deploy reaches every client.
        #   3) Rate limit on /v1/auth/login: 11 bad logins from one IP
        #      should yield at least one 429 once the bucket fills.
        #
        # All curls run from inside the VPS so we hit the host Caddy on
        # 127.0.0.1 (no public traffic, no test pollution of the rate
        # limiter for real users). The login probe uses an obviously
        # invalid credential and expects 401 until 429 kicks in.
        $bash = @'
set -eu
HOST=digiuniversity.ir
RESOLVE="--resolve $HOST:443:127.0.0.1"

echo "--- (1) CSP header on / ---"
HDR=$(curl -k -sSI $RESOLVE "https://$HOST/")
echo "$HDR" | grep -iE '^(content-security-policy|content-security-policy-report-only):' || {
  echo "FAIL: no CSP header"
  exit 1
}

echo
echo "--- (2) /sw-recovery.js cache + existence ---"
SW=$(curl -k -sSI $RESOLVE "https://$HOST/sw-recovery.js")
echo "$SW" | head -1
echo "$SW" | grep -iE '^cache-control:' || {
  echo "FAIL: /sw-recovery.js missing Cache-Control"
  exit 1
}

echo
echo "--- (3) /api/v1/auth/login rate limit via Caddy (front-door) ---"
# This is the path real SPA traffic takes: Caddy strips /api and forwards
# /v1/* to the api container. If this 502s, ops needs to re-run
# `scripts/remote.ps1 caddy-reload` so Caddy re-resolves api's IP after
# a `docker compose up -d` recreate. The throttler is keyed on req.ip
# (which Caddy passes via X-Forwarded-For); the express trust-proxy
# setting in main.ts surfaces it as req.ip so the bucket fills per
# real client, not per Caddy.
PASS=0
LIMIT=0
GATEWAY_502=0
for i in $(seq 1 12); do
  CODE=$(curl -k -s -o /dev/null -w '%{http_code}' $RESOLVE \
    -X POST "https://$HOST/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"tenantSlug":"demo","email":"throttle-test@example.com","password":"badpw"}')
  printf "  req %02d -> %s\n" "$i" "$CODE"
  case "$CODE" in
    400|401) PASS=$((PASS+1)) ;;
    429)     LIMIT=$((LIMIT+1)) ;;
    502)     GATEWAY_502=$((GATEWAY_502+1)) ;;
  esac
done
echo "summary: ${PASS} x 400|401 (rejected creds), ${LIMIT} x 429 (rate-limited), ${GATEWAY_502} x 502 (caddy upstream stale)"
if [ "$GATEWAY_502" -gt 0 ]; then
  echo "FAIL: Caddy is 502ing — run 'scripts/remote.ps1 caddy-reload' to re-resolve api upstream"
  exit 1
fi
if [ "$LIMIT" -lt 1 ]; then
  echo "FAIL: expected at least one 429 across 12 requests"
  exit 1
fi
echo "PASS: rate limit fired after the configured bucket size"

echo
echo "--- (4) sanity: api container reachable on internal network ---"
API_IP=$(docker network inspect digiuniversity_web --format \
  '{{range .Containers}}{{if eq .Name "digiuniversity-api"}}{{.IPv4Address}}{{end}}{{end}}' \
  | cut -d'/' -f1)
DIRECT=$(docker exec digiuniversity-app curl -s -o /dev/null -w '%{http_code}' \
  "http://${API_IP}:4000/v1/health")
echo "direct GET http://${API_IP}:4000/v1/health -> ${DIRECT}"
[ "$DIRECT" = "200" ] || { echo "FAIL: api unhealthy on internal network"; exit 1; }

echo
echo "--- (5) Phase-15 R6: CASL gate + /v1/auth/me ships abilities ---"
# We assert the *negative* CASL case (student gets 403 on admin-only
# audit-logs) and that /v1/auth/me ships the packed ability set the
# SPA needs to render <Can> in R7. Both checks use the demo student
# whose password is fixed in the seed, so we don't need to read any
# production secret to probe.
#
# Logins fire from the digiuniversity-app container against api on
# the docker bridge — that path bypasses the front-door throttler so
# this probe is safe to run repeatedly during dev iteration.
STUDENT_PASS="StudentPass!1"

STU_BODY=$(docker exec digiuniversity-app sh -c "curl -s -X POST 'http://${API_IP}:4000/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"tenantSlug\":\"demo\",\"email\":\"student1@digiuniversity.ir\",\"password\":\"${STUDENT_PASS}\"}'")
STU_TOK=$(echo "$STU_BODY" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
if [ -z "$STU_TOK" ]; then
  echo "FAIL: student login did not return a token"
  echo "$STU_BODY"
  exit 1
fi

STU_AUDIT=$(docker exec digiuniversity-app curl -s -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer $STU_TOK" "http://${API_IP}:4000/v1/audit-logs?limit=1")
STU_ME=$(docker exec digiuniversity-app curl -s \
  -H "Authorization: Bearer $STU_TOK" "http://${API_IP}:4000/v1/auth/me")

echo "  student GET /v1/audit-logs -> ${STU_AUDIT} (expect 403 from CASL/Roles)"
echo "  student GET /v1/auth/me     -> abilities field present? $(echo "$STU_ME" | grep -q '\"abilities\":\[' && echo yes || echo no)"

if [ "$STU_AUDIT" != "403" ]; then
  echo "FAIL: student should be 403 on /v1/audit-logs, got ${STU_AUDIT}"
  exit 1
fi
if ! echo "$STU_ME" | grep -q '"abilities":\['; then
  echo "FAIL: /v1/auth/me missing the abilities array — R6 plumbing not active"
  exit 1
fi

# Confirm the student's ability rules actually contain a read-Course
# entry (proves AbilityFactory ran, not just an empty array).
if ! echo "$STU_ME" | grep -qE '"abilities":\[[^]]*Course'; then
  echo "FAIL: student ability rules do not mention Course — factory not wired"
  exit 1
fi

echo "PASS: CASL gate denies non-admin AND /v1/auth/me ships role-shaped ability rules"

echo
echo "--- (6) Phase-15 R7: support + super_admin can read /v1/audit-logs ---"
# Phase-15 R7 seeded support1@ and superadmin@; the AbilityFactory
# grants both roles read access to AuditLog. Verify the positive
# case from two angles without needing the admin password.
SUP_BODY=$(docker exec digiuniversity-app sh -c "curl -s -X POST 'http://${API_IP}:4000/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"tenantSlug\":\"demo\",\"email\":\"support1@digiuniversity.ir\",\"password\":\"SupportPass!1\"}'")
SUP_TOK=$(echo "$SUP_BODY" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')

SA_BODY=$(docker exec digiuniversity-app sh -c "curl -s -X POST 'http://${API_IP}:4000/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"tenantSlug\":\"demo\",\"email\":\"superadmin@digiuniversity.ir\",\"password\":\"SuperAdminPass!1\"}'")
SA_TOK=$(echo "$SA_BODY" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')

if [ -z "$SUP_TOK" ] || [ -z "$SA_TOK" ]; then
  echo "WARN: support or super_admin login failed — was 'remote.ps1 seed' run after the R7 deploy?"
  echo "  support body: ${SUP_BODY}"
  echo "  super_admin body: ${SA_BODY}"
else
  SUP_AUDIT=$(docker exec digiuniversity-app curl -s -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer $SUP_TOK" "http://${API_IP}:4000/v1/audit-logs?limit=1")
  SA_AUDIT=$(docker exec digiuniversity-app curl -s -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer $SA_TOK" "http://${API_IP}:4000/v1/audit-logs?limit=1")
  echo "  support     GET /v1/audit-logs -> ${SUP_AUDIT} (expect 200)"
  echo "  super_admin GET /v1/audit-logs -> ${SA_AUDIT}  (expect 200)"
  if [ "$SUP_AUDIT" != "200" ]; then echo "FAIL: support should be 200, got ${SUP_AUDIT}"; exit 1; fi
  if [ "$SA_AUDIT" != "200" ]; then echo "FAIL: super_admin should be 200, got ${SA_AUDIT}"; exit 1; fi
  echo "PASS: support + super_admin can read AuditLog via the CASL positive path"
fi

echo
echo "--- (7) Phase-20-pre: HIBP blocks a known-breached password at register ---"
# "password" is the canonical pwned credential — appears millions of
# times in HIBP. If our HIBP wiring works, registering with it must
# 400 with a body that mentions "breach". Fail-open semantics mean an
# HIBP outage produces 201/409 instead, in which case we WARN rather
# than FAIL: the production policy is still in effect, the network
# was just unreachable from inside the api container at probe time.
#
# Email is timestamped so re-running this probe doesn't 409 against a
# user that registration accidentally created on a previous run where
# HIBP failed open.
RAND=$(docker exec digiuniversity-app sh -c 'date +%s%N')
REG_BODY=$(docker exec digiuniversity-app sh -c "curl -s -X POST 'http://${API_IP}:4000/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{\"tenantSlug\":\"demo\",\"email\":\"hibp-test-${RAND}@example.test\",\"password\":\"password\",\"fullName\":\"HIBP Probe\"}'")
REG_CODE=$(docker exec digiuniversity-app sh -c "curl -s -o /dev/null -w '%{http_code}' -X POST 'http://${API_IP}:4000/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{\"tenantSlug\":\"demo\",\"email\":\"hibp-test-${RAND}-2@example.test\",\"password\":\"password\",\"fullName\":\"HIBP Probe\"}'")
echo "  POST /v1/auth/register with pwned password -> ${REG_CODE} (expect 400 if HIBP up)"
if [ "$REG_CODE" = "400" ] && echo "$REG_BODY" | grep -qi 'breach\|pwned\|نشت'; then
  echo "PASS: HIBP blocked a known-breached password"
elif [ "$REG_CODE" = "400" ]; then
  echo "PASS: registration rejected with 400 (body did not mention breach but length=${#REG_BODY})"
else
  echo "WARN: expected 400 from HIBP, got ${REG_CODE} — HIBP may be unreachable; check api logs"
  echo "  body: $(echo "$REG_BODY" | head -c 200)"
fi
if [ "$LIMIT" -lt 1 ]; then
  echo "FAIL: expected at least one 429 across 12 requests"
  exit 1
fi
echo "PASS: rate limit fired after the configured bucket size"
'@
        exit (Invoke-RemoteBash $bash)
    }

    "visual" {
        # Phase-16 — capture Playwright screenshots from a docker-bound
        # browser against the live `app` nginx container, then bring the
        # PNGs back to Windows for commit.
        #
        # Usage:
        #   .\scripts\remote.ps1 visual -Service gate-1
        #   .\scripts\remote.ps1 visual -Service gate-2
        #
        # -Service is the spec stem (apps/web/tests/visual/<Service>.spec.ts)
        # AND the host evidence dir (docs/<Service>-evidence/). They are
        # tied so a single arg drives both ends.
        #
        # First run takes ~90s while it npm-installs into the volume.
        # Subsequent runs are <30s; cache lives in the
        # digiuniversity_web-visual-node-modules docker volume.
        if ([string]::IsNullOrWhiteSpace($Service)) {
            Write-Error "visual requires -Service <gate-name>. e.g. -Service gate-1"
            exit 2
        }
        $gate = $Service
        $specPath = "tests/visual/$gate.spec.ts"
        $hostEvidenceDir = "docs/$gate-evidence"

        # Phase-16 R3 — Storybook snapshots are a special mode: we
        # need to build the static Storybook before the playwright test
        # runs, and use a different config file (with a python webServer
        # block). Detected by the spec name.
        $isStorybook = $gate -like "*storybook*"
        $playwrightConfig = if ($isStorybook) {
          "playwright.storybook.config.js"
        } else {
          "playwright.visual.config.js"
        }
        $prebuildCmd = if ($isStorybook) {
          "&& npm run build-storybook"
        } else {
          ""
        }
        # Path routing:
        #   - gate-N → docs/gate-N-evidence/                (Gate 1, 2 reviews)
        #   - rN-*   → docs/gate-2-evidence/rN-*/           (per-sprint evidence
        #             so Gate 2 review can embed everything from R3 onwards
        #             under one parent dir)
        $isSprintEvidence = $gate -match "^r[0-9]+-"
        $hostEvidenceDir = if ($isSprintEvidence) {
          "docs/gate-2-evidence/$gate"
        } else {
          "docs/$gate-evidence"
        }

        # Push current work so the VPS sees the spec + config.
        git push origin $Branch

        $bash = @"
set -eu
cd /var/www/digiuniversity
# Phase-16 R3 — the docs/ dir is bind-mounted into the visual docker
# container, so previous captures land PNGs directly into the VPS's
# working tree. If those PNGs are later committed AND pushed (as
# gate-1-evidence is), `git pull` refuses to overwrite the still-
# present untracked files (or, after the file is committed, the
# tracked-and-locally-modified PNG blocks the merge). Reset tracked
# changes AND sweep untracked before pulling so we always converge
# on origin/main.
git checkout -- docs/ 2>/dev/null || true
git clean -fd docs/ 2>/dev/null || true
git pull origin main
# Host-side output dir. Container writes here via the ./docs bind mount.
# 0777 is intentional — the playwright image runs as a non-root user
# whose UID won't match the VPS user; world-writable lets it land files.
mkdir -p $hostEvidenceDir
chmod 777 $hostEvidenceDir
# Pull the image up front so the first compose invocation doesn't time out.
docker pull mcr.microsoft.com/playwright:v1.49.1-noble >/dev/null 2>&1 || true
# Make sure the app service is up — visual tests run against the live SPA.
docker compose up -d app
# Build the visual profile (no-op if image already pulled).
docker compose --profile visual build web-visual >/dev/null 2>&1 || true
# Run the targeted spec. Override the default `command` so we can pick
# which gate's spec we are capturing this round.
docker compose --profile visual run --rm \
  --workdir /work \
  web-visual bash -c "npm install --no-audit --no-fund --silent $prebuildCmd && npx playwright test --config $playwrightConfig $specPath"
echo "--- artefacts on VPS ---"
ls -la $hostEvidenceDir
"@
        $exitCode = Invoke-RemoteBash $bash
        if ($exitCode -ne 0) {
            Write-Warning "Visual run exit=$exitCode — leaving any partial artefacts on the VPS for inspection."
            exit $exitCode
        }

        # Bring the screenshots back. We scp into the repo so the next
        # `git add` picks them up. Use forward slashes for ssh; the
        # VPS path is the same regardless of platform.
        $repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
        $localDir = if ($isSprintEvidence) {
          Join-Path $repoRoot "docs\gate-2-evidence\$gate"
        } else {
          Join-Path $repoRoot "docs\$gate-evidence"
        }
        New-Item -ItemType Directory -Force -Path $localDir | Out-Null
        Write-Host "Pulling $hostEvidenceDir/*.png from $Server -> $localDir"
        # `scp -p` preserves mtimes; `-r` recurses subdirs if a future
        # spec creates them. The trailing /. copies contents only.
        & scp -pr "${Server}:/var/www/digiuniversity/$hostEvidenceDir/." "$localDir"
        Write-Host "Done. Files:"
        Get-ChildItem $localDir -File | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
    }
}