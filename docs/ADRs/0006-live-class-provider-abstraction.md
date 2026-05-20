# ADR 0006: LiveClassProvider abstraction (no real video in Phase 6)

Date: 2026-05-20

## Status

Accepted.

## Context

Phase 6 of `project-run.docx` brings live classes online: a course needs
a schedule of meetings, students need to "join", and the platform needs
to capture attendance + recording metadata + AI analyses of what
happened.

Two practical constraints shape the design:

1. **No GPU and no live-video infrastructure on this VPS.** We can run
   the *control plane* (scheduling, attendance, AI bridge), but the
   actual WebRTC/SFU work has to live elsewhere later (LiveKit Cloud
   or a dedicated BigBlueButton box).
2. **The product surface (frontend SPA + instructor flows) must already
   *act* as if live classes work**, so we can demo Phase 4's UX with the
   real API and so Phase 7+ (assessments, learning events) can wire to
   the same identifiers we'll keep when real video lands.

## Decision

We introduce a single seam — `LiveClassProvider` — and ship exactly one
implementation in Phase 6: `MockLiveClassProvider`.

```ts
interface LiveClassProvider {
  readonly key: string;
  createMeeting(args): Promise<{ providerMeetingId; joinUrl }>;
  getJoinUrl(args):   Promise<{ joinUrl; expiresAt? }>;
  endMeeting(id):     Promise<void>;
}
```

- The provider is the **only** code that ever calls a real
  meeting/SFU service. Controllers, services, and the SPA know
  *nothing* about LiveKit/BBB — they just know how to call the
  provider through DI.
- The DI token `LIVE_CLASS_PROVIDER` is bound to `MockLiveClassProvider`
  today. When a real provider lands it's a one-line change:
  ```ts
  { provide: LIVE_CLASS_PROVIDER, useClass: LiveKitProvider }
  ```
- The `ClassSession.provider` column stores the key (`mock` / `livekit`
  / `bbb`), so historical rows are correctly self-describing even after
  the swap.
- The mock provider returns a deterministic deep link
  (`https://digiuniversity.ir/#classroom/mock_<id>`) so demos work end
  to end without WebRTC.

## What this is NOT

- It is **not** a "switch providers at runtime" knob. Phase 6 picks one
  provider at boot via DI. Multi-provider routing (tenant-A on LiveKit,
  tenant-B on BBB) is out of scope until at least two real providers
  exist and we have a reason to mix.
- It is **not** a hand-rolled WebRTC layer. We will never own that code.
  The interface deliberately does not surface participant JWTs,
  ICE servers, or media tracks.

## Consequences

- All Phase 6 controllers are testable without network (mock provider
  returns deterministic values).
- The path to LiveKit is "write one class, change one line, deploy".
- Until a real provider is wired up, the demo's "join class" is a deep
  link back into the existing `Classroom.jsx` mocked page — which keeps
  the click-through plausible without lying about infrastructure.
