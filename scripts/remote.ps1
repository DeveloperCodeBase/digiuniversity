param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("push","pull","build","up","down","restart","logs","logs-live","test","status","shell","domain-probe","caddy-install","caddy-reload","caddy-verify","caddy-logs")]
    [string]$Action
)

$Server = "my-vps"
$ProjectPath = "/var/www/digiuniversity"
$Branch = "main"

function Remote($cmd) {
    ssh $Server "cd $ProjectPath && $cmd"
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
        git push origin $Branch
        Remote "git pull origin $Branch && docker compose run --rm app npm test"
    }

    "status" {
        Remote "git status && docker compose ps && docker ps"
    }

    "shell" {
        ssh $Server
    }

    "domain-probe" {
        # Run from the VPS itself so we bypass any Windows TLS quirks.
        Remote "echo '--- DNS ---' && (getent hosts digiuniversity.ir || echo 'no DNS resolution from VPS') ; echo '--- direct container (host port 8090) ---' && curl -sSI -H 'Host: digiuniversity.ir' http://127.0.0.1:8090/ ; echo '--- via host Caddy on :80 ---' && curl -sSI -H 'Host: digiuniversity.ir' http://127.0.0.1/ ; echo '--- via host Caddy on :443 with Host hdr ---' && curl -k -sSI --resolve digiuniversity.ir:443:127.0.0.1 https://digiuniversity.ir/ ; echo '--- /healthz via local :443 ---' && curl -k -sS --resolve digiuniversity.ir:443:127.0.0.1 https://digiuniversity.ir/healthz"
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
    # 1. Drop any prior managed block (between markers).
    sudo sed -i "/^# >>> digiuniversity site block/,/^# <<< digiuniversity site block/d" "$target_file"
    # 2. Drop any prior unmanaged block: from a column-0 line that starts
    #    with `digiuniversity.ir` (the site key, not a commented example)
    #    through the next column-0 `}` (site block close).
    sudo sed -i "/^digiuniversity\.ir/,/^}/d" "$target_file"
    # 3. Drop any commented Option A/B headers we may have left behind.
    sudo sed -i "/^# Option [AB] —.*$/d" "$target_file"
    sudo sed -i "/^# We use container-to-container traffic.*$/d" "$target_file"
    # 4. Trim trailing blank lines.
    sudo sed -i -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$target_file"

    # 5. Append the managed block.
    printf "%s" "$SNIPPET" | sudo tee -a "$target_file" > /dev/null
    echo "Wrote managed block to $target_file"
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

docker exec "$CADDY_CONTAINER" caddy validate --config /etc/caddy/Caddyfile
docker exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile
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
}