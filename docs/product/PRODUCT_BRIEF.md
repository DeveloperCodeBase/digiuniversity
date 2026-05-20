# AI-Native Online University — Product Brief

We are building an **AI-Native Online University Platform**, not a simple LMS.

## Core idea

AI is not an add-on. AI is the learning infrastructure, cognitive support
layer, decision-support engine, and adaptive learning coordinator.

## Primary goals

- Full online university experience
- LMS
- Live classroom
- Recording
- Transcription-ready architecture
- AI Tutor
- Instructor AI Copilot
- RAG-based answers
- Dynamic learner cognitive profile
- Multi-agent education model
- Learning analytics
- Assessment and grading workflows
- Certificates
- Multi-tenant SaaS
- Persian-first RTL UI
- Standards-ready architecture (LTI 1.3, xAPI, QTI 3.0, Caliper, OneRoster,
  Open Badges, Verifiable Credentials, WCAG 2.2 AA)

## Important constraint

The current server **has no GPU**. Do not implement local heavy ML. Implement
all heavy AI as **external API adapters with mocks and OpenAPI contracts**.
The system must be ready to connect to a future dedicated GPU server simply by
flipping `AI_MODE=external_api` and pointing `AI_SERVICES_BASE_URL` at it.

## MVP definition

MVP must be:

- production-quality
- Docker-based
- documented
- testable
- deployable on Ubuntu via `scripts/remote.ps1`

## Current implementation

The repository today contains a Vite + React + Tailwind Persian/RTL frontend
(see `README.md` and `src/`). The backend, AI Gateway, and persistence layers
are tracked under the implementation phases listed in `AGENTS.md` and will
land as separate apps under `apps/` in a monorepo refactor.

The production deployment, including domain wiring at
**https://digiuniversity.ir**, is documented in
`docs/DEPLOYMENT_UBUNTU.md`.
