# ADR 0008: Explainable rule-based risk first; ML risk behind a flag

Date: 2026-05-20

## Status

Accepted.

## Context

Phase 8 ships a "learning risk" score that surfaces on the student
dashboard and (for staff) on rosters. We have two candidate
implementations:

1. **Rule-based** — read recent enrolments, grades, attendance, and
   event-recency rows and assign weighted contributions per factor.
2. **ML-backed** — call the `ai-gateway` `/v1/learning-risk/predict`
   endpoint already wired since Phase 1, which currently returns a
   mock and will eventually call out to a real model.

`AGENTS.md` (the AI governance rules) is explicit:

> Every AI response must include source/context, confidence, model /
> provider, humanReviewRequired. Do not make final grading or
> disciplinary decisions automatically.

The risk score directly influences who instructors flag for outreach,
so the bar for it is high.

## Decision

Phase 8 ships the **rule-based** implementation as the default. The
ML endpoint stays available behind the same `/v1/learning-risk/predict`
path on `ai-gateway` and we'll wire a "show ML alternative" button on
the SPA in Phase 9.

The rule-based response is shaped exactly like an `AiResponseEnvelope`
in spirit:

```jsonc
{
  "score": 0.42,
  "band": "medium",
  "source": "rule-based-v1",
  "humanReviewRequired": true,
  "factors": [
    { "key": "low_grade_average", "label": "...",
      "contribution": 0.4, "detail": "..." }
  ]
}
```

- `humanReviewRequired` is **always true**, regardless of band.
- `factors[]` carries Persian-language explanations the UI renders
  verbatim. Reviewers can see why the score is what it is without
  reading code.
- `source` carries the rule version (`rule-based-v1`); future versions
  bump the suffix so historical scores stay self-describing.

## What this gives us

- Reproducibility: the same input rows produce the same score, today
  and a year from now.
- Auditability: there is no black box — every contribution is named.
- A useful baseline: the ML model has something concrete to beat
  before we replace the default.

## What we deliberately don't do

- We do not blend rule-based + ML scores into one number. Mixing them
  silently is the worst of both worlds.
- We do not surface the score outside the tenant (this is staff +
  owner only).
- We do not act on the score automatically. Email outreach, course
  changes, escalations all require human intent.

## Consequences

- The analytics service is the single place where the rules live;
  changing thresholds is a one-file edit.
- When the ML endpoint produces real values, we add a sibling
  `/v1/analytics/risk-ml/me` route that returns the AI envelope
  alongside the rule-based one. The UI then shows both, with the
  rule-based score still authoritative until a human flips the default.
- A future Phase 9.5 retention job can compute risk scores on a
  schedule and persist them so dashboards stay fast.
