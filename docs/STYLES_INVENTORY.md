# `styles.css` Token Inventory — Phase 16 R3a

Snapshot of all custom CSS variables defined in
`apps/web/styles.css`, cross-referenced with their `var(--…)` usage
across the codebase (`.css`, `.tsx`, `.ts`, `.jsx`, `.js`).

The Phase-16 R3 primitive layer (`apps/web/src/ui/`) only consumes
**live** tokens. Orphan tokens are removed in the same commit that
introduces this file so future contributors don't accidentally re-use a
name that no rule reads.

## Live tokens (kept)

| Token | Theme override? | First defined at | Notes |
|---|---|---|---|
| `--bg`           | light + dark + classroom shell | L14 | Page background. |
| `--bg-deep`      | light + dark + classroom shell | L15 | Off-edge / classroom backdrop. |
| `--surface`      | light + dark + classroom shell | L16 | Card surface. |
| `--surface-2`    | light + dark + classroom shell | L17 | Card hover / muted surface. |
| `--surface-3`    | light + dark + classroom shell | L18 | Sunken surface (sidenav rail, etc.). |
| `--line`         | light + dark + classroom shell | L19 | 1-px hairline border. |
| `--line-2`       | light + dark + classroom shell | L20 | Stronger hairline (hovered, focused). |
| `--fg`           | light + dark + classroom shell | L23 | Primary ink. |
| `--fg-mute`      | light + dark + classroom shell | L24 | Body text, secondary labels. |
| `--fg-dim`       | light + dark + classroom shell | L25 | Tertiary metadata. |
| `--accent`       | light + dark | L28 | Primary oxford-blue (light) / cyan (dark). |
| `--accent-2`     | light + dark | L29 | Stronger accent for hovers / overlays. |
| `--accent-soft`  | light + dark | L30 | Soft accent fill for chips, pills. |
| `--accent-dim`   | light + dark | L31 | Muted accent for inactive states. |
| `--accent-on`    | light + dark | L32 | Ink colour to use *on* accent fills. |
| `--navy`         | light + dark | L35 | "Muted gold" warm accent (legacy name). |
| `--navy-2`       | light + dark | L36 | Stronger navy/warm accent. |
| `--navy-soft`    | light + dark | L37 | Soft warm-accent fill. |
| `--sage`         | light + dark | L40 | Deep forest, rare success accent. |
| `--sage-soft`    | light + dark | L41 | Soft sage fill. |
| `--gold`         | light + dark | L44 | Muted brick alert. |
| `--gold-soft`    | light + dark | L45 | Soft alert fill. |
| `--cyan`         | light + dark | L48 | Back-compat → `var(--accent)`. |
| `--cyan-dim`     | light + dark | L50 | Back-compat → `var(--accent-dim)`. |
| `--amber`        | light + dark | L51 | Back-compat → `var(--navy)`. |
| `--violet`       | light + dark | L53 | Back-compat → `var(--sage)`. |
| `--rose`         | light + dark | L54 | Back-compat → `var(--gold)`. |
| `--f-sans`       | light only | L57 | Vazirmatn stack. |
| `--f-mono`       | light only | L58 | JetBrains Mono. |
| `--f-display`    | light only | L59 | Bricolage Grotesque headline stack. |
| `--r`            | light only | L63 | Default radius (6 px). |
| `--r-lg`         | light only | L64 | 10 px (cards). |
| `--r-xl`         | light only | L65 | 14 px (modals, sheets). |
| `--shadow-1`     | light + dark | L68 | 1-px paper shadow. |
| `--shadow-2`     | light + dark | L69 | Card lift. |
| `--shadow-paper` | light + dark | L70 | Strong paper drop. |
| `--glow-cyan`    | light + dark | L71 | Accent glow for focus / hover. |

> Classroom shell (`.classroom-shell, .exam-shell` block at L2207+) **locally
> redefines** `--bg, --bg-deep, --surface, --surface-2, --surface-3, --line,
> --line-2, --fg, --fg-mute, --fg-dim` so live-class workflows always render
> on dark navy regardless of the global theme. These are not duplicate
> definitions — they are a local scope override, on purpose.

## Orphan tokens (removed in this commit)

These were defined but **never referenced** by any `var(--…)` site in
the codebase. Verified via:

```
rg -o 'var\(--[a-z][a-z0-9-]*\)' --type css --type ts --type tsx --type js --type jsx \
  | sed 's/.*var(--/--/' | sed 's/).*//' | sort -u
```

| Token | Defined at | Why orphan |
|---|---|---|
| `--cyan-2` | L49 (light), L107 (dark) | Back-compat alias for `--accent-2`. Nothing reads it; `--accent-2` is used directly where needed. |
| `--amber-2` | L52 (light), L110 (dark) | Back-compat alias for `--navy-2`. Nothing reads it; `--navy-2` is used directly. |
| `--r-sm` | L62 | 3-px radius. No rule reads it. Tailwind's `rounded-sm` is a static `3px` in `tailwind.config.js`, not a CSS-var reference. |

Removing these is reversible — git history keeps them — and prevents
"why are there two names for the same colour" cognitive load in R3+
when the new primitives consume tokens directly.

## Outside-`styles.css` token sites

- `apps/web/tailwind.config.js` maps Tailwind utility colours to
  `var(--…)` references (e.g., `bg-accent` → `var(--accent)`). This is
  how `<div className="bg-accent text-fg">` works without writing CSS.
- `apps/web/tests/breakpoints.test.js` asserts the token wiring stays
  intact (`bg → var(--bg)`, `accent → var(--accent)`, `surface →
  var(--surface)`).

## When to add a new token

1. The value would otherwise be duplicated in more than 3 rules / JSX
   sites.
2. The value should swap with `data-theme="dark"`.
3. A primitive in `apps/web/src/ui/` needs a stable hook for theming.

Anything else stays as an inline literal in the rule that needs it. We
do **not** add `--foo: 8px` for "the gap between two icons" — that's
just `gap: 8px;` at the call site.
