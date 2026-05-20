# Deployment on Ubuntu (digiuniversity.ir)

This document is the source of truth for getting the platform onto the VPS and
behind the production domain **https://digiuniversity.ir**.

The host is shared with other apps (caddy/postgres/redis stacks already
running), so the conventions matter — read this end-to-end before changing
anything.

---

## 1. Prerequisites on the VPS (one-time)

Run as a non-root user with sudo (the project agent must never run as root):

```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y \
  git curl wget unzip ca-certificates gnupg lsb-release \
  ufw htop nano build-essential

# Docker engine
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out / back in so the group takes effect

# Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

The VPS user that the agent SSHes in as is the `deployer` user (configured in
`~/.ssh/config` under `Host my-vps`). Never run the project as root.

---

## 2. First-time clone (one-time)

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/DeveloperCodeBase/digiuniversity.git
cd digiuniversity
cp .env.example .env
# edit .env with real values (JWT_SECRET, S3 creds, AI keys, etc.)
```

From this point on, all updates happen from Windows via `scripts/remote.ps1`.
Do not edit files on the VPS by hand.

---

## 3. Day-to-day workflow (from Windows)

```powershell
.\scripts\remote.ps1 up          # build + start
.\scripts\remote.ps1 restart     # full down/up cycle
.\scripts\remote.ps1 logs        # last 200 lines
.\scripts\remote.ps1 logs-live   # follow
.\scripts\remote.ps1 test        # run vitest in a one-off container
.\scripts\remote.ps1 status      # git + docker compose ps + docker ps
```

Hard rules (see `AGENT_RUNBOOK.md`):

- Never run production Docker commands directly on Windows.
- Never use Remote-SSH for agent execution on the VPS.
- Commit and push first when you change code, then run the remote command.

---

## 4. Domain wiring: https://digiuniversity.ir

The owner has already configured the CDN to point `digiuniversity.ir` at the
VPS. The remaining work on the VPS is the **reverse proxy + TLS** layer.

### The architecture

```
  client ─► CDN ─► VPS:443  ─►  host Caddy  ─►  127.0.0.1:8090
                                  (TLS)         (nginx in
                                                 digiuniversity-app
                                                 docker container)
```

- The CDN handles edge caching and the public certificate to the browser.
- The host Caddy (`hooshgate_caddy` container, already running and owning
  `0.0.0.0:80` + `0.0.0.0:443`) terminates TLS to the CDN and reverse-proxies
  to our app.
- Our app is a multi-stage nginx container exposing port 80 internally,
  published as `0.0.0.0:8090` on the host (configurable via `APP_PORT`).

### Adding the site to the host Caddy

The reverse-proxy block lives in `infra/Caddyfile.snippet`. Paste its
contents into the host Caddy's main `Caddyfile`, then reload:

```bash
# inside the VPS, as the deployer user
docker exec hooshgate_caddy caddy reload --config /etc/caddy/Caddyfile
```

Caddy will obtain and renew the Let's Encrypt certificate automatically as
long as DNS / CDN forwards :80 and :443 to this VPS.

### Verifying

```bash
# from any machine with working TLS:
curl -sSI https://digiuniversity.ir/
curl -sS  https://digiuniversity.ir/healthz   # should print "ok"
```

Inside the VPS you can also bypass the CDN and reach the container directly:

```bash
curl -sSI -H 'Host: digiuniversity.ir' http://127.0.0.1:8090/
curl -sS  http://127.0.0.1:8090/healthz
```

If the container is `Up (healthy)` but the domain still fails:

1. `docker exec hooshgate_caddy caddy validate --config /etc/caddy/Caddyfile`
2. `docker logs --tail=200 hooshgate_caddy` to look for ACME / proxy errors.
3. From the CDN dashboard, confirm origin is `http://<vps-ip>` on :80/:443
   (not :8090 — the host Caddy owns :443; :8090 is internal only).

---

## 5. Service inventory

| Service              | Image                                    | Host port | Notes                                  |
| -------------------- | ---------------------------------------- | --------- | -------------------------------------- |
| `app`                | `digiuniversity:latest` (built locally)  | `8090`    | nginx serving the built Vite SPA       |
| (future) `api`       | `digiuniversity/api:latest`              | internal  | NestJS core API, behind host Caddy     |
| (future) `ai-gateway`| `digiuniversity/ai-gateway:latest`       | internal  | FastAPI adapter, no GPU                |
| (future) `postgres`  | `postgres:16-alpine`                     | internal  | shared via docker network              |
| (future) `redis`     | `redis:7-alpine`                         | internal  | shared via docker network              |
| (future) `minio`     | `minio/minio:RELEASE.2023-08-31...`      | internal  | object storage                         |

Only `app` exists today. The rest land as the implementation phases listed in
`AGENTS.md` ship.

---

## 6. Troubleshooting

| Symptom                                       | First check                                                  |
| --------------------------------------------- | ------------------------------------------------------------ |
| `address already in use` on `up`              | another container holds `APP_PORT` — pick a free port        |
| `npm error Missing script: "build"`           | `package.json` not committed; run `remote.ps1 push` first    |
| `npm ci` fails for missing lockfile           | `package-lock.json` must be committed                        |
| `tlsv1 alert internal error` from the domain  | host Caddy has no site block for the domain yet — see §4     |
| `308 Permanent Redirect` loop                 | CDN is forcing HTTPS while origin redirects HTTP→HTTPS too — set CDN to talk HTTPS to origin |
