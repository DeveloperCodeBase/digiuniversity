param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("push","pull","build","up","down","restart","logs","logs-live","test","status","shell","domain-probe","caddy-install","caddy-reload")]
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
    # 1. Strip any previously appended (unmarked) digiuniversity block. We
    #    look for a line that starts a site block whose key contains
    #    `digiuniversity.ir` and remove from there to the matching closing
    #    brace at the start of a line.
    sudo awk '
        BEGIN { skip=0; depth=0 }
        skip==0 && /^[[:space:]]*(#.*)?$/ { print; next }
        skip==0 && /digiuniversity\.ir[[:space:]]*[,{]/ {
            skip=1; depth=1
            # If the line itself contains a closing brace, decrement
            n=gsub(/\}/, "}")
            depth -= n
            n=gsub(/\{/, "{")
            depth += n - 1   # subtract the one we already counted as opener
            if (depth<=0) { skip=0 }
            next
        }
        skip==1 {
            n=gsub(/\{/, "{")
            depth += n
            n=gsub(/\}/, "}")
            depth -= n
            if (depth<=0) { skip=0 }
            next
        }
        { print }
    ' "$target_file" | sudo tee "$target_file.tmp" > /dev/null
    sudo mv "$target_file.tmp" "$target_file"

    # 2. Append the managed block.
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

    "caddy-cat" {
        # Dump the host Caddyfile so we can debug what Caddy is actually loading.
        Remote "HOST_CADDYFILE=`$(docker inspect -f '{{range .Mounts}}{{if eq .Destination \"/etc/caddy/Caddyfile\"}}{{.Source}}{{end}}{{end}}' hooshgate_caddy) && echo Caddyfile: `$HOST_CADDYFILE && echo '---' && sudo cat `$HOST_CADDYFILE && echo '---' && echo 'Containers on digiuniversity_web:' && docker network inspect digiuniversity_web --format '{{range .Containers}}{{.Name}} {{end}}'"
    }
}