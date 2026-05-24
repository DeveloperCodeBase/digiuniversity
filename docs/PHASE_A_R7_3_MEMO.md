# Phase A R7.3 — Memo (Lighthouse a11y subset 88 → 95+)

## Header — approved decisions

- **D17** R7 sweep critical-path-first ordering.
- **D25** Performance track is sequential after the a11y track.
- **D30** R7.7 D13 PASS (combined a+b+c+d sweep closed).
- **D31** §2 verdict accepted as PASS with documented KEEPs.
- **Owner choice 2026-05-24** — R7.3 next, before R7.1+R7.2 Performance.
- **D29** — Pre-smoke automation via Chrome Extension required from R7.3 onwards; **first sub-R subject to D29**.

## Goal — single sentence

Lift the Lighthouse-mobile Accessibility category score on the three §1 sampled pages (`/`, `/login`, `/programs`) from **88 / 88 / 87** to **95+** by clearing the 13 audit failures that Lighthouse's a11y category catches *beyond* axe's wcag tag set.

After R7.3, §1's a11y subset moves from 🔴 to ✅; §1 verdict still 🔴 until R7.1+R7.2 lift Performance (currently 59/67/64).

## Source of truth for this memo

The per-page violation list below is extracted **verbatim** from the latest Lighthouse mobile reports under `docs/gate-a-evidence/lh-*.report.json` (re-run 2026-05-23 post-R7.7), via `scripts/r7-3-extract-violations.mjs`. Full trace lives at `docs/gate-a-evidence/r7-3-violation-trace.md`.

**The user's quoted bucket counts in the directive were from a previous measurement (pre-R7.7).** The numbers below are the post-R7.7 snapshot — slightly smaller because R7.7's per-page work already cleared several audits.

| Page | Lighthouse a11y score | Failing audits | Failing nodes total |
|---|---|---|---|
| `/` | 88/100 | 3 audits | 5 nodes |
| `/login` | 88/100 | 4 audits | 5 nodes |
| `/programs` | 87/100 | 4 audits | 10 nodes |

## Distinct-vs-R7.7e audit (the question the directive raises)

Owner asked: «color-contrast هنوز ×4 + ×1 + ×7 موجود ـه چون R7.7 axe-scope بود نه Lighthouse-scope. این‌ها مشترک هستن با R7.7 60 serious tail یا distinct؟»

**Result of the audit: distinct, with one small overlap.**

R7.7's documented KEEPs (per R7.7 review + D31):
1. `.eyebrow`-on-tinted-card-bg (`--fg-mute` #4a5a76 on cards with detected tint).
2. Accent-on-accent-soft "active pill" patterns (`.filter-pill.active`, `.cmdk-item:hover`, `.dash .side-nav li a.active`, `.nav-link.active`).

Lighthouse's color-contrast failures on `/`, `/login`, `/programs` (post-R7.7):
| Failing selector | Computed | Bucket |
|---|---|---|
| `footer .footer-grid > div > p` (inline `color: var(--fg-mute)`) | 2.77:1 on #0a0d1a | **R7.3 — distinct.** Inline style, not the `--fg-mute-on-dark` class rewire R7.7c added. R7.3 fix: drop the inline-color and rely on the `.footer p` rule that R7.7c set up. |
| `.org-attribution-copyright` (#4a5a76 on #0a0d1a) | 2.77:1 | **R7.3 — distinct.** Same footer-on-dark family, different selector than R7.7c touched. |
| `.org-attribution-compact span` (#768094 on white, /login) | 3.97:1 | **R7.3 — distinct.** A custom darker grey, not a theme token. Fix: swap to `--fg-mute` token (passes 6.86:1 on white) or `--fg` if it's an attribution byline. |
| `.prog-card .num` (#d8dce2 on white, /programs ×2) | 1.37:1 | **R7.3 — distinct.** Very pale grey decorative numbering. Fix: darken to `--fg-mute` or hide from a11y tree if purely decorative. |
| `.card-flat > div` with `color: var(--rose)` (/programs) | 1.62:1 on white | **R7.3 — distinct.** `var(--rose)` computes to #e7c87a (gold-ish, the eyebrow line on the program-card feature row). R7.7b targeted gold-as-text BUT only on workspace surfaces; the /programs marketing card's `--rose` text on white was missed. Fix: swap to `--fg` (matches R7.7b's pattern). |

**No overlap** with R7.7's `.eyebrow`-on-card-bg or accent-on-accent-soft KEEPs. R7.3 is a clean additive sweep — no risk of contradicting R7.7's audit.

**Minor overlap**: the `.card-flat` color-rose case is the same *class* of bug R7.7b targeted (gold-as-text-on-white). R7.7b's scope was workspace pages; /programs is a public marketing page that was outside R7.7b's beat. R7.3 closes the gap.

## Per-page fix plan

### Page A — `/` (landing) · 88 → ~95+

#### A.1 `button-name` ×1 — navbar `<button class="user-btn">`

- **Selector:** `div.nav-inner > div.nav-actions > div.user-wrap > button.user-btn`
- **Source:** `apps/web/src/shared.tsx` line 324.
- **Why it fails:** the button wraps an `<Icon name="user">` plus the user-initials avatar. Anonymous users (Lighthouse runs anonymously) see just the icon — no inner text. Screen reader announces "button" with no name.
- **Fix:** add `aria-label={auth.user ? "منوی کاربر" : "ورود به حساب"}` on the `<button>`. The label adapts to authed-vs-anonymous so the value matches what clicking the button actually does (open user menu vs. trigger sign-in flow).
- **Trade-offs considered:**
  - *Alternative 1:* render `<a href="/login">` instead of `<button>` for anonymous users. Cleaner semantics but changes the click handler that already routes to /login through the user menu. Avoided to keep the change tight.
  - *Alternative 2:* add visible "ورود" text label next to the icon for anonymous users. Touches visual design — out of R7.3 scope.

#### A.2 `color-contrast` ×2 — footer text on navy bg

- **Selectors:**
  - `div.shell > div.footer-grid > div > p` (the brand description paragraph, inline-style `color: var(--fg-mute)`).
  - `div.shell > div.org-attribution-full > div.org-attribution-text > div.org-attribution-copyright`.
- **Sources:**
  - `apps/web/src/shared.tsx` line 584 (the inline-style `<p>`).
  - The `.org-attribution-copyright` CSS rule in `apps/web/styles.css`.
- **Why they fail:** R7.7c added `--fg-mute-on-dark` (#aab0c4) and rewired `.footer h5 / .footer-bot / .footer .brand-sub` — but **not** the inline-style `<p>` brand description or the `.org-attribution-copyright` rule. Both still resolve `--fg-mute` (#4a5a76) on the navy bg.
- **Fix A.2.i (`<p>` inline):** drop the inline `color` from `shared.tsx:584`. The default text color inside `.footer` should be set by a `.footer p` rule that uses `--fg-mute-on-dark`. If no such rule exists yet, add it to `styles.css`.
- **Fix A.2.ii (`.org-attribution-copyright`):** in `apps/web/styles.css`, add `--fg-mute-on-dark` to the rule. Same darkening Δ as R7.7c.
- **Computed contrast post-fix:** #aab0c4 on #0a0d1a → ~8.95:1 (AAA). Same math R7.7c used.

#### A.3 `heading-order` ×2 — `<h4>` inside `.course-card` + `<h5>` in footer

- **Selectors:**
  - `div.stagger > button.course-card > div.course-body > h4` (landing's "Featured Courses" card cluster).
  - `div.shell > div.footer-grid > div > h5` (footer column headers).
- **Sources:** likely `apps/web/src/pages/Landing.tsx` (course-card) + `apps/web/src/shared.tsx` ~line 596 (footer).
- **Why they fail:** the landing page hierarchy is h1 (hero title) → h2 (section titles) → **h4** (course-card title) — skips h3. Footer columns are **h5** after a final-section h2 — skips h3 and h4.
- **Fix A.3.i (course-card):** rename `<h4>` → `<h3>` in the course-card body. Visual styling stays the same; only the heading level changes.
- **Fix A.3.ii (footer):** rename `<h5>` → `<h4>` (or `<h3>` if no h3 exists between the page's last main `<h2>` and the footer). Audit which level is the next-deeper available; default to `<h4>`.
- **Trade-off:** font size is currently set by the *element* (h4 / h5 = different default sizes). After the rename, we'll add a `font-size: 0.85rem; font-weight: 600;` (or equivalent) directly to the footer-column-header CSS rule so the visual size doesn't change. Same pattern for `.course-card h3` if needed.

### Page B — `/login` · 88 → ~95+

#### B.1 `aria-toggle-field-name` ×2 — `<span role="checkbox">` on the form

- **Selector:** `form > div > label > span` (both occurrences are the same render).
- **Source:** `apps/web/src/pages/Auth.tsx` LoginPage — the "remember me" + "trust this device" custom-checkbox spans.
- **Why it fails:** `<span role="checkbox" aria-checked="true">` is a span dressed as a checkbox; the accessible name comes from the wrapping `<label>` text, but Lighthouse can't trace the association reliably because of the span's missing `aria-labelledby` or `aria-label`.
- **Fix:** add `aria-label` to the span tied to the visible label text (e.g. `aria-label="مرا به خاطر بسپار"`). Alternatively, swap the custom span for a real `<input type="checkbox" id="..." />` + `<label htmlFor="...">` pair — semantically cleaner and self-labelling.
- **Recommendation:** the aria-label patch is one line per span; the native-input swap is bigger surgery (custom checkbox styling needs re-wiring). **Memo proposes the aria-label patch for R7.3**; the native-input swap can be a Phase B form-primitives sub-R.

#### B.2 `button-name` ×1 — navbar `.user-btn`

- Same fix as A.1. Single shared change in `shared.tsx`.

#### B.3 `color-contrast` ×1 — `.org-attribution-compact span` (#768094 on white)

- **Selector:** `body > div#root > div.org-attribution-compact > span`.
- **Source:** `apps/web/src/components/OrgAttribution.tsx` (or the inline CSS in styles.css for `.org-attribution-compact`).
- **Why it fails:** custom grey `#768094` on white = 3.97:1 — below the 4.5:1 normal-text bar (it's 11px text, well under the large-text threshold).
- **Fix:** swap the inline color to `var(--fg-mute)` (#4a5a76 → 6.86:1 on white) — same pattern R7.6 used for `--fg-mute` darkening.

#### B.4 `label-content-name-mismatch` ×1 — language toggle button

- **Selector:** `section.r5-form-panel > header > div > button` with `aria-label="تغییر زبان"`.
- **Source:** `apps/web/src/pages/Auth.tsx` LoginPage — the language switcher in the form header.
- **Why it fails:** the button's visible text is "EN" or "FA" (the current language code); the aria-label is "تغییر زبان" (change language). The rule requires that the aria-label include the visible text.
- **Fix:** change the `aria-label` to `aria-label={\`تغییر زبان: ${currentLang}\`}` so the visible text is part of the accessible name. Or rephrase as `aria-label={\`زبان ${currentLang} — برای تغییر کلیک کنید\`}`. **Memo proposes:** `aria-label={\`زبان فعلی: ${currentLang}، تغییر بدهید\`}`.

### Page C — `/programs` · 87 → ~95+

#### C.1 `button-name` ×1 — navbar `.user-btn`

- Same fix as A.1 / B.2.

#### C.2 `color-contrast` ×5

| # | Selector | Computed | Fix |
|---|---|---|---|
| C.2.i | `section.shell > div.stagger > button.prog-card > span.num` (the large numeral display per program card) ×2 | #d8dce2 on white → 1.37:1 | Either darken to `var(--fg-mute)` for legibility, OR add `aria-hidden="true"` if the number is purely decorative ornament (it's a CSS-style "01 / 02 / 03" sequence indicator). Memo proposes **`aria-hidden="true"`** plus a comment explaining the role — keeps the visual ornament but removes it from the a11y tree, so the rule no longer applies. |
| C.2.ii | `div.card > div.grid > div.card-flat > div` with `color: var(--rose)` | #e7c87a on white → 1.62:1 | Same pattern as R7.7b (gold-as-text demote). Swap `color: var(--rose)` → `color: var(--fg)` in the inline style on this row. The gold-on-white was the eyebrow-color on a feature-callout row inside the page; demoting to navy keeps the visual hierarchy via font-weight/eyebrow-style. |
| C.2.iii | `div.shell > div.footer-grid > div > p` | same as A.2.i | shared fix. |
| C.2.iv | `.org-attribution-copyright` | same as A.2.ii | shared fix. |

After A.2 + C.2.iii + C.2.iv land, all three pages' footer-text-on-dark issues clear in one CSS change.

#### C.3 `heading-order` ×2

- **Selectors:**
  - `section.shell > div.stagger > button.prog-card > h3` (the program card title) ×N.
  - `div.card > div.grid > div.card-flat > h4.mt-2` (the feature-callout title).
- **Why it fails:** the page's heading ladder probably reads h1 ("Programs") → **h3** (skips h2). And h2 → h4 (skips h3) for the feature-callout.
- **Fix C.3.i:** wrap the prog-card grid with `<h2>برنامه‌های ارائه شده</h2>` (or whatever the existing section title is) so the prog-card `<h3>` becomes valid. **Alternative:** rename each prog-card `<h3>` → `<h2>` and let each card be a top-level section — semantically defensible but changes the document structure significantly. **Memo proposes** the wrapping h2 path.
- **Fix C.3.ii:** rename the feature-callout `<h4>` → `<h3>`. Adjust CSS font-size if needed.

#### C.4 `label-content-name-mismatch` ×2 — prog-card `<button>`

- **Selectors:** `main > section.shell > div.stagger > button.prog-card` with `aria-label="برنامه ... — ... · ... · مشاهده دروس"`.
- **Why it fails:** the button has an `aria-label` that is a long structured summary ("برنامه مهندسی کامپیوتر — هوش مصنوعی · ارشد · مشاهده دروس") and the visible card text contains the program name + degree + "مشاهده دروس" but not in that exact order or formatting.
- **Fix:** **drop the explicit aria-label entirely** and let the button's text-content speak (the card already has `<h3>`/`<h2>` + meta spans + a "مشاهده دروس" indicator). The accessible name becomes the concatenation of visible text — automatically matches.
- **Trade-off considered:** keep the aria-label but make it match visible text exactly (string-template from the same source). Bigger refactor — chosen the simpler "drop aria-label" path because the visible content already conveys the same info.

## Predicted Lighthouse a11y delta per page

| Page | Pre-R7.3 | Audits cleared | Predicted post-R7.3 |
|---|---|---|---|
| `/` | 88 | button-name + color-contrast + heading-order (3 audits, 5 nodes) | **~95–98** |
| `/login` | 88 | aria-toggle-field-name + button-name + color-contrast + label-content-name-mismatch (4 audits, 5 nodes) | **~96–98** |
| `/programs` | 87 | button-name + color-contrast + heading-order + label-content-name-mismatch (4 audits, 10 nodes) | **~95–97** |

**Confidence:** medium. Lighthouse a11y category weights audits heterogeneously; the score formula is published but my mental math may be off by 2-3 points. **Backup plan if a page lands at 92-94:** identify the dominant remaining-deduction audit from the post-R7.3 report and either fix it in-scope or document as a follow-on (R7.3e). The 95+ goal is owner-set; if real number is 93 owner can re-set.

## Files touched (estimated scope)

| File | Sub-fixes | Approx lines |
|---|---|---|
| `apps/web/src/shared.tsx` | A.1 (user-btn aria-label) + A.2.i (drop inline `<p>` color) + A.3.ii (footer h5 → h4) | ~6-10 |
| `apps/web/src/pages/Auth.tsx` | B.1 (×2 aria-label on span-checkbox) + B.4 (lang toggle aria-label rewrite) | ~5-8 |
| `apps/web/src/pages/Landing.tsx` (or wherever course-card renders) | A.3.i (h4 → h3) | ~1-2 |
| `apps/web/src/pages/Programs.tsx` | C.2.i (prog-card .num aria-hidden) + C.3.i (wrap with h2) + C.3.ii (callout h4 → h3) + C.4 (drop prog-card aria-label) + C.2.ii (color-rose → --fg) | ~8-12 |
| `apps/web/styles.css` | A.2.ii (`.org-attribution-copyright` color → --fg-mute-on-dark) + B.3 (`.org-attribution-compact span` color → --fg-mute) + `.footer p` rule if missing + heading-rename CSS size adjustments | ~10-18 |
| `apps/web/src/components/OrgAttribution.tsx` (if applicable — TBD) | B.3 fallback if the color is set in component, not CSS | ~1-3 |

**Total estimate: ~30-55 lines across 5-6 files.** Comfortably under the 300-line target.

## New tests required

- **`apps/web/tests/visual/phase-a-r7-3-a11y-sweep.spec.ts`** (new). Per-fix focused assertions, same shape as R7.7's per-fix spec:
  - `/`: assert `.user-btn` has `aria-label`; assert footer `<p>` doesn't have inline color attr; assert h3 ladder validity (no h4 directly under h2 without an intermediate h3).
  - `/login`: assert both span-checkboxes have non-empty aria-label; assert language-toggle button's aria-label includes the visible text content.
  - `/programs`: assert `.prog-card .num` has `aria-hidden="true"`; assert `<h2>` exists before any `<h3>`; assert `.prog-card` does NOT have aria-label (or assert it matches visible text exactly); assert `.card-flat > div` color is not gold.
- The existing `gate-a-axe-scan.spec.ts` already exercises these surfaces too; R7.3's per-fix spec is the higher-resolution "did this specific selector change" check.

## Regression scope

Same shape as R7.7's regression directive: re-run **R1.1 + R3 + R5 + R6 + R6.6 + R7.7 + R7.12 + gate-a-role-routing** after R7.3 lands. R7.7 stays in the list because R7.3 touches `shared.tsx` (navbar) and `styles.css` (footer rules) — same files R7.7 modified.

## Pre-smoke plan per D29 (Chrome Extension)

R7.3 is the first sub-R subject to D29. Pre-smoke plan:

**Scope:** Chrome desktop view + (if viewport sim available) mobile-emulation 375×667.

**Routes navigated:** `/`, `/login`, `/programs`.

**Per-route actions:**
1. Navigate, wait for paint.
2. **`/`**: open the user menu (click the user-btn) — confirm dropdown opens and screen-reader-friendly attributes look right via the DevTools accessibility tab if accessible. Tab through the nav from logo to user-btn — confirm focus order. Screenshot the focused user-btn.
3. **`/login`**: tab through the form. Confirm both span-checkboxes receive focus and announce a name (via the extension's accessibility-tree inspector, if exposed; otherwise visual focus-ring check). Click the language-toggle button — confirm the language flips. Screenshot the form with focus on each checkbox.
4. **`/programs`**: tab through the prog-cards. Confirm card buttons announce the program name when focused. Visual check: the `<h2>` section title is visible above the cards. Screenshot.

**Pass criteria:**
- No console error in DevTools console for any route.
- No visible layout break (cards still grid as expected, navbar still horizontal).
- Focus-rings visible on every interactive element tabbed.
- User-btn click opens the menu (or routes to /login for anonymous).

**Fail handling (per D29):**
- Silent fix + re-run, max 3 attempts.
- After 3 fails: ping owner with screenshots + diagnosis.

**Pass handling:** ping owner for the formal D13 (real mobile + incognito + hard reload).

## D13 owner manual smoke plan (~8-12 min)

1. **Navbar user-btn (anonymous + authed).** Open `/` in incognito mobile. Tap the avatar/icon in the navbar — should open the user menu OR route to /login. Same with `/login` open. Then log in and confirm the user-btn opens the user menu with the right initials.
2. **Footer text legibility.** Scroll to footer on `/`, `/about`, `/programs`. Read the brand description paragraph + the copyright line. Both should be clearly legible on the navy bg. The R7.7c rewire was for the column headers + brand-sub; this is the descriptive paragraph + copyright which R7.3 finishes the job for.
3. **Login form checkboxes (TalkBack/VoiceOver if available).** Focus the "remember me" checkbox. Screen reader should announce the label text, not "checkbox".
4. **Login language toggle.** Tap the EN/FA toggle. Confirm the form labels switch language. Screen reader announcement before-and-after should be coherent.
5. **Programs page heading structure.** Scroll through `/programs`. The page should feel structurally clean — large title, then card grid. Screen reader's heading-navigation (rotor in VoiceOver, swipe in TalkBack) should list: Page title (h1), Programs section (h2), each program (h3), feature callouts (h3).
6. **Programs card decoration.** The big "01 / 02 / 03" numerals on each program card should still be visible visually. With screen reader, the card should be announced as the program name + degree level, **without** mentioning the decorative number.

## Risks + open questions

### R1 — heading-order rename might break visual hierarchy

Renaming `<h4>` to `<h3>` or wrapping prog-cards in an `<h2>` changes the *element*, but tailwind/CSS rules that target the old element (`.course-card h4 { ... }` or `.prog-card h3 { ... }`) won't apply to the new element automatically. Need to audit per file whether the styles target the element or a class.

**Mitigation:** read each affected component first; if styles target the element name, add the new element to the rule selector (or convert to class-based selector). All edits captured in the per-file changes above.

### R2 — `.user-btn` aria-label might collide with existing accessible name on authed users

When authed, the button contains visible initials text ("ن ر" for نسرین رضوی). If I add `aria-label="منوی کاربر"`, the aria-label REPLACES the visible text as the accessible name. Screen reader will say "منوی کاربر" instead of "ن ر". For some assistive setups that announce author-supplied labels over text content, this is preferred; for setups that prefer the content, this loses information.

**Mitigation:** use `aria-label` rather than `aria-labelledby`. If the owner prefers content-takes-precedence, we can swap to `aria-describedby` on the button + an off-screen description div. **Default proposed:** `aria-label="منوی کاربر"` (simpler, single-string semantic).

### R3 — `.prog-card` dropping aria-label might leak too much visible text

The current aria-label is a curated summary. Dropping it means the screen reader announces every span inside the button — name, meta, "مشاهده دروس", maybe the decorative number (depending on aria-hidden). For 8 prog-cards × ~6 spans each = a lot of text per swipe.

**Mitigation:** make sure `aria-hidden="true"` lands on `.prog-card .num` so the decorative number is excluded. Audit the inner text once visually with VO/TalkBack before the D13 ping.

### R4 — R7.3 vs R7.7e overlap on the `.card-flat` gold-on-white

R7.7b targeted gold-as-text demote on workspace pages. /programs is public — R7.7b skipped it. R7.3 includes C.2.ii. **No conflict**, but worth noting in the review doc that R7.3 finishes a job R7.7b started.

### Q1 — `.user-btn` content-conditional aria-label

Option A: `aria-label={auth.user ? "منوی کاربر" : "ورود به حساب"}` (memo's proposal — adapts to context).
Option B: always `aria-label="منوی کاربر"` (simpler; less context-aware).

**Memo proposes Option A.** Owner can override to Option B if they prefer simplicity.

### Q2 — drop `.prog-card` aria-label vs make it match visible text

Option A: drop the aria-label, let visible text speak (memo's proposal).
Option B: keep the aria-label, rewrite to match visible text exactly.

Option A is simpler + the content already has enough structure. Option B preserves the curated summary semantics. **Memo proposes Option A.**

## Verification flow (post-code, before D13)

1. Commit + push the R7.3 code + spec.
2. `.\scripts\remote.ps1 up` then `.\scripts\remote.ps1 logs` clean boot.
3. `.\scripts\remote.ps1 visual -Service phase-a-r7-3-a11y-sweep` — new spec must pass (target 10/10).
4. Re-run Lighthouse on `/`, `/login`, `/programs` — verify a11y score 95+ on each.
5. Re-run axe-scan — verify no regression (critical stays 0; serious tail same or smaller).
6. Run the regression sweep via `scripts/r7-7-regression.ps1` (extended with `phase-a-r7-3-a11y-sweep` and re-run on touched specs — `R1.1 + R3 + R5 + R6 + R6.6 + R7.7 + R7.12 + gate-a-role-routing`).
7. **Pre-smoke per D29.** Chrome Extension on owner laptop runs the per-route checks above. Silent-fix any obvious break (max 3 attempts).
8. **Ping owner for D13.**
9. After D13 ack: write `docs/PHASE_A_R7_3_REVIEW.md` with the same shape as R7.7's (per-fix table + score deltas + KEEP justifications + decisions awaited).
10. Update `docs/PHASE_A_DECISIONS.md` with **D32** entry (R7.3 D13 ack).
11. If §1 a11y verdict flips to ✅, update Gate A dossier §1 partial-a11y row.

## What's NOT in R7.3 scope

- **Performance** track (R7.1 Vite chunks + R7.2 Vazirmatn self-host). Per D25 + owner choice, R7.3 first, then Perf.
- **R7.4** (authed-route Lighthouse runner). The §1 measurement still runs on anonymous routes only. R7.4 is its own sub-R, gated on owner.
- **Workspace-route a11y audits.** Lighthouse only sampled the 3 anonymous pages. Workspace pages will need a separate `R7.x-workspace-lighthouse` later if §1 expands to authed routes.
- **R7.7 KEEPs touched.** R7.3 will not contradict D31's documented KEEPs (.eyebrow-on-card-bg + accent-on-accent-soft). If the post-R7.3 axe-scan shows the same 60 serious tail, that's by design.

## Standing instruction per owner directive

«**memo نوشتی، stop + owner memo review. هیچ code تا owner ack.**»

This memo is committed. No code, no spec, no CSS edits, no `.\scripts\remote.ps1` actions until the owner reviews this memo and acks.

Awaiting:
- Q1: `.user-btn` aria-label — Option A (context-aware) or Option B (always "منوی کاربر")?
- Q2: `.prog-card` aria-label — Option A (drop, let visible text speak) or Option B (rewrite to match)?
- Any per-fix override (e.g. "use a different heading-order fix for the footer", "leave `.prog-card .num` visible to a11y tree").
- Pre-smoke + D13 plan acceptable as drafted?
- Memo green-light to start code?

— Phase A author, 2026-05-24. R7.3 memo locked, awaiting owner ack per standard workflow.
