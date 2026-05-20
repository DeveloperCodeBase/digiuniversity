# Agent Runbook

This project is edited locally on Windows using Claude Code, but **all runtime
behavior — Docker, builds, tests, logs, and deployment — happens on the Ubuntu
VPS** via `scripts/remote.ps1`.

## Hard rules

- **Do not** run production Docker commands directly on Windows.
- **Do not** use Remote-SSH agent execution into the VPS. The VPS CPU does not
  support the AES instructions the Claude Code language server needs, so Claude
  Code itself must always run on Windows.
- **Do not** execute arbitrary `ssh my-vps "..."` commands outside the runbook —
  use the script.
- **Do not** commit secrets. Real `.env` files never enter git. `.env.example`
  is the only env file that may be committed.
- **Do not** edit files directly on the VPS. Workflow is always: edit on
  Windows → commit → push → run a remote action.

## The only commands you should run for the VPS

From the project root, in PowerShell:

| Command                            | Purpose                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `.\scripts\remote.ps1 push`        | `git add -A`, commit, push to `origin/main`             |
| `.\scripts\remote.ps1 up`          | Push, pull on VPS, `docker compose up -d --build`       |
| `.\scripts\remote.ps1 restart`     | Push, pull, `docker compose down && up -d --build`      |
| `.\scripts\remote.ps1 logs`        | Tail last 200 lines from all services                   |
| `.\scripts\remote.ps1 logs-live`   | Follow live logs (Ctrl+C to exit)                       |
| `.\scripts\remote.ps1 test`        | Push, pull, `docker compose run --rm app npm test`      |
| `.\scripts\remote.ps1 status`      | `git status && docker compose ps && docker ps` on VPS   |
| `.\scripts\remote.ps1 shell`       | Open interactive SSH (humans only — never from an agent) |

## Workflow

1. Edit files locally on Windows.
2. Commit and push the changes (or rely on `up` / `restart` / `test`, which
   push first).
3. Run the required remote action through `scripts/remote.ps1`.
4. Inspect logs with `logs` / `logs-live`.
5. If something fails, fix locally and repeat.

## Domain & TLS

- Production domain: **https://digiuniversity.ir** (CDN is configured by the
  owner — see `docs/DEPLOYMENT_UBUNTU.md`).
- TLS termination happens on the host Caddy. The app container is plain HTTP
  inside the docker network; the host Caddy reverse-proxies to it.

## Source of truth

- `docs/product/PRODUCT_BRIEF.md` — product vision and constraints (no GPU
  on the current VPS; heavy AI must be external API only).
- `AGENTS.md` — engineering rules for any agent contributing to this repo.
- `docs/DEPLOYMENT_UBUNTU.md` — end-to-end VPS prep, deploy, and domain wiring.

If a request conflicts with these documents, surface the conflict instead of
silently doing the wrong thing.
