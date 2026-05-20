# ADR 0001: Record architecture decisions

Date: 2026-05-20

## Status

Accepted.

## Context

The project is taking shape across several services (web, api, ai-gateway),
a shared VPS, and a Persian-first product surface. Decisions made early
(no local GPU, AI behind a gateway, multi-tenant from day one, monorepo
layout) are easy to forget the *why* of once they're routine. We want
those decisions discoverable in the repo, not in a chat history.

## Decision

We will keep architecture decision records in `docs/ADRs/` using
Michael Nygard's lightweight format (one Markdown file per decision:
Status, Context, Decision, Consequences). Filenames are
`NNNN-short-title.md`, numbered monotonically. ADRs are append-only
— if a decision is reversed, write a new ADR that supersedes the old
one rather than editing it.

## Consequences

- New contributors can `ls docs/ADRs/` and read the trail of *why* the
  system looks the way it does.
- Reviewers can require an ADR for cross-cutting changes.
- We pay a small documentation cost on each architectural change in
  exchange for keeping institutional memory in the repo.
