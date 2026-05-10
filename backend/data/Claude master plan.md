# Shrodinger — UI/UX Proposal & 20-Hour Build Plan
**Team: Quantum Cats · GDG AI HACK 2026 Milan · Braynr EdTech Track**

---

## TL;DR

- **Build a single-screen "document-as-interface" reading app in React + Tiptap, with a planning-time agent that emits a JSON `InterventionPlan` and a right-side `LearningTrace` ledger.** Five inline block types — Context, Anchor, Checkpoint, ClaimReview, ConceptDiff — render as ProseMirror node views. The Schrödinger metaphor ("the box opens at the checkpoint") is the spine of the pitch and is research-backed by the testing/generation/desirable-difficulties literature (Roediger & Karpicke 2006; Slamecka & Graf 1978; Bjork & Bjork 2011; Dunlosky et al. 2013).
- **Pre-bake aggressively. The only live LLM call during the demo is claim decomposition on the student's typed answer**, using OpenAI Structured Outputs (`gpt-4o-2024-08-06`, `strict: true`) with a fixed Zod schema and a 6-second timeout that falls back to a hard-coded `ClaimReview` object. Everything else — persona load, intervention placement, concept diff, recall scheduling — is computed once at "planning time" by a prompt run **before** the live demo and committed to `intervention-plan.json` in the repo.
- **Demo content is the Reader / Orchestrator / Resolver tier passage from Anthropic's "Structuring Agents, Skills, and MCPs"**, with a scripted wrong answer ("The Reader must not have MCP access because it writes the final output, so it could leak data") that produces three deterministic verdicts: ✅ Reader writes the final output, ❌ "no MCP access" (Reader is the tier with MCP read tools), ⚠️ data-leak rationale unsupported. This single moment is the entire pitch.

---

## Key Findings

1. **The judges' rubric weights cognitive design (35%) and frame interpretation (30%) at 65% combined** — i.e. the *thesis* matters more than the code. The team's edge is being the only project that argues "AI should not produce content for the student; AI should produce friction for the student," grounded in the testing effect, the generation effect, and Bjork's desirable difficulties.
2. **The product's defensibility comes from the inversion, not from any single block type.** Inline flashcards exist (Andy Matuschak's mnemonic medium, Orbit), inline chat exists (Notion AI, NotebookLM), and inline checkpoints exist in iSTART/AutoTutor. What does not exist is a system where a planner agent reads the student's prior cognitive trace, decides *where* in a fresh document to insert which intervention, and treats the document as the only canvas. That is the original move.
3. **Live LLM calls are the #1 demo-killer.** Network jitter at a Milanese venue under 160 simultaneous hackers will kill streaming responses. The architecture must collapse to "one structured-output call, one fallback JSON" or it will fail in front of judges. Pre-computing the intervention plan is not a shortcut — it is *also the right product behavior* (the "planning phase" maps directly to PACRAR's first P).
4. **Tiptap + ProseMirror with React node views is the right editor.** Markdown is parsed server-side once, the agent emits `{anchorId, blockType, payload}` placements, and the frontend simply maps each anchor to a custom inline node. This avoids both raw `dangerouslySetInnerHTML` and a heavy CMS. MDXEditor is an alternative but ships at ~850 KB and has known issues with inline component rendering; Tiptap's React `NodeViewRenderer` is the clean path.
5. **PACRAR is a real, well-known Italian study method (Alessandro de Concini's "Sistema ADC")**. Italian judges from Braynr will recognize it instantly; the move is to not lecture them about it. Use it as a hidden engine — phase-pill labels only — and let them notice the 1-to-1 mapping themselves.

---

## Details

# PART 1 — UI/UX PROPOSAL

## 1.1 Main Study Screen — Layout

**Two columns, no top nav, no left sidebar.**

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◐ Shrodinger    Chapter 7 · Structuring Agents       ⏱ 14:32 ▸ ⋯   │  ← 48px hairline header
├────────────────────────────────────────────┬─────────────────────────┤
│                                            │                         │
│         DOCUMENT CANVAS                    │   LEARNING TRACE        │
│         max-width: 720px                   │   width: 320px          │
│         centered with 96px gutters         │   sticky, scrolls indep │
│                                            │                         │
│   # The Three-Tier Architecture            │   ▸ Now reading         │
│                                            │     Reader / MCP tier   │
│   The Reader is the tier that…             │                         │
│                                            │   ▾ Why this checkpoint │
│   ┌──────────────────────────────────┐    │     • Prior flashcard   │
│   │ ◐ Open the box                   │    │       on tool access    │
│   │ Before you continue, explain in  │    │       failed twice      │
│   │ your own words…                  │    │     • Prereq for §7.4   │
│   │ [_________________________]      │    │                         │
│   │ [Submit understanding] [hint]    │    │   ▸ Active claims (3)   │
│   └──────────────────────────────────┘    │   ▸ Mistake fossils (2) │
│                                            │   ▸ Recall queue (5)    │
│   …Resolvers, by contrast, hold…           │                         │
│                                            │                         │
└────────────────────────────────────────────┴─────────────────────────┘
```

**Proportions and spacing**

| Element | Value |
|---|---|
| Page background | `#FAFAF7` (warm paper) |
| Document column | 720 px max-width, centered, 96 px L/R gutter on ≥1280 px screens |
| Document type | Source Serif 4, 18 px / 1.7 line-height, body color `#1B1B1F` |
| Headings | Source Serif 4 SemiBold; H1 32/40, H2 24/32, H3 20/28, all with `letter-spacing: -0.01em` |
| Inline UI / pills / buttons | Inter, 13 px / 16 px |
| Code / formula | JetBrains Mono, 14 px |
| Trace column | 320 px fixed, `border-left: 1px solid #E6E4DC`, `bg #F5F3EC` |
| Block vertical rhythm | 24 px above & below each intervention block |
| Block internal padding | 16/20 px |
| Corner radius | 6 px on all blocks (not 12+, never pill-rounded) |

**Why these choices.** Source Serif 4 + warm paper signals *book*, not *app*. 720 px is the standard reading measure (≈70 chars). Inter only inside intervention chrome creates a clean visual contract: serif = source, sans = system. No drop shadows, no gradients, no emoji except the four claim verdict glyphs.

## 1.2 The Five Inline Block Types — Visual Treatment

All blocks share: 6 px radius, 1 px solid left border in the type's accent color (4 px wide), a 13 px Inter **phase pill** in the top-left corner, and a single 8 px–high `data-block-type` ribbon line. Body text inside blocks uses the Inter UI font, not the document serif — this is what makes them *feel* like an overlay rather than part of the prose.

### A. Context block — "Before reading"
- **Phase pill:** `BEFORE READING` · pill bg `#1B3A4B`, white text
- **Border-left:** 4 px `#1B3A4B` (deep navy)
- **Body bg:** `#F2F4F7`
- **Layout:** Heading "Before you read this section" 14 px bold + 2-3 line orientation paragraph + bulleted "Watch for:" list (max 3 items)
- **Buttons:** none. It's read-only. Single right-aligned link `Mark as ready ↵` (mutes the block to 60% opacity).
- **Microcopy template:** *"This section introduces {concept}. It builds on {prereq from trace}. Watch for the distinction between {A} and {B} — that's what the next checkpoint will test."*

### B. Formula / Example anchor
- **Phase pill:** `FORMULA ANCHOR` · pill bg `#3D2C5E`, white text
- **Border-left:** 4 px `#3D2C5E` (aubergine)
- **Body bg:** `#F8F5FB`
- **Layout:** Two-column inside the block — left 40% the formula or table in JetBrains Mono, right 60% a worked one-line example with a *visible derivation*. (Sweller's worked-example effect.)
- **Buttons:** `Worked through it ✓` (single, right-aligned, ghost button).
- **Use:** Inserted only at dense passages flagged by the planner (`density.symbolDensity > 0.4`).

### C. Inline Checkpoint — "Open the box" *(the hero block)*
- **Phase pill:** `◐ OPEN THE BOX` · pill bg `#0F3D2E`, white text
- **Border-left:** 4 px `#0F3D2E` (forest)
- **Body bg:** `#FFFFFF`, with a 1 px full border `#0F3D2E` at 30% opacity (gives the box subtle "weight")
- **Layout:**
  - Top: `◐` glyph (12 px) + the prompt question, 15 px Inter Medium, max 2 lines
  - Middle: a multiline `<textarea>`, min-height 96 px, 14 px JetBrains Mono (signals "your turn to write"), placeholder `Explain in your own words…`
  - Bottom row, left-aligned three buttons:
    - **`Submit understanding`** (primary, filled `#0F3D2E`)
    - **`Tiny hint`** (ghost, opens a 1-line hint inline below)
    - **`Skip — mark fragile`** (ghost, gray text `#6B6B6B`)
  - Bottom row, right-aligned: a 12 px live char counter, muted
- **State after submit:** the textarea locks (read-only, 80% opacity), the buttons collapse to a single muted `Submitted ✓ 14:32`, and a `ClaimReview` block animates in directly below it (see §1.5).

### D. Claim Review block
- **Phase pill:** `CLAIM MEASUREMENT` · pill bg `#5A3A1B`, white text
- **Border-left:** 4 px `#5A3A1B` (umber)
- **Body bg:** `#FBF8F3`
- **Layout:** A vertical stack of **claim cards**, one per atomic claim extracted from the student's answer. Each claim card:
  ```
  ┌───────────────────────────────────────────────┐
  │ ✅  "The Reader writes the final output."     │
  │     Verdict: correct                          │
  │     Source: §7.2, paragraph 3                 │
  └───────────────────────────────────────────────┘
  ```
  - Verdict glyphs (left, 16 px, baseline aligned with first text line):
    - `✅` correct — `#1F7A3A`
    - `⚠️` partial — `#B8860B`
    - `❌` incorrect — `#A8321F`
    - `◌` unsupported — `#6B6B6B` (hollow circle)
  - Each card has subtle separator `1px solid #EFE8DA`, no shadow.
- **Bottom row of the block:**
  - **`Revise my answer`** (primary)
  - **`Challenge Shrodinger`** (ghost — opens an inline 1-line "explain why you think this verdict is wrong" mini-textarea; this is critical for the "AI judgment on faith" objection)
- **Microcopy header above cards:** *"I read your answer as {N} claims. Here's how each holds up against the source."*

### E. Concept Diff — "Mistake repaired"
- **Phase pill:** `MISTAKE REPAIRED` · pill bg `#2B2B2B`, white text
- **Border-left:** 4 px `#2B2B2B` (graphite)
- **Body bg:** `#F4F4F2`
- **Layout:** Two-row diff:
  - Row 1 — `Before` label + the wrong claim, struck-through, 14 px
  - Row 2 — `After` label + the corrected understanding, 14 px Medium
  - Below, in 12 px muted: `→ Will resurface in 2 days` (FSRS-style)
- **Buttons:** none. Read-only fossil.
- **Microcopy:** *"Saved as a mistake fossil — never overwritten."*

**Visual scan logic.** A user glancing at the document sees five distinct left-border colors — navy, aubergine, forest, umber, graphite — each tied to a single phase pill. After 30 seconds they can name the block by color. None of the colors are "primary blue," none are pastel, none are the standard Material/Tailwind defaults — this is intentional, the palette signals "academic publication," not "SaaS dashboard."

## 1.3 The Right Sidebar — Learning Trace

**Not a chat panel. A ledger.** Looks like a thin academic margin annotation column.

Four collapsible sections, top-to-bottom, in this order. Default-open: 1, 2. Default-collapsed: 3, 4.

1. **Now reading** (always visible, never collapses)
   - Concept name (16 px Medium)
   - One-line breadcrumb of the parent section (12 px muted)
2. **Why Shrodinger intervened** (open by default)
   - 2–3 bullets max, 12 px each, e.g.:
     - *"Previous flashcard on tool access difficulty: 0.78 (high)"*
     - *"Prerequisite for §7.4 (Resolver tier)"*
     - *"Last chat with tutor on 5 May ended with unresolved question"*
   - Each bullet has a tiny `[trace ↗]` link that, on click, scrolls a hidden raw-trace drawer open (stretch goal — for demo, hardcode 3 bullets).
3. **Active claims** (collapsed by default; chip count shown next to header e.g. "Active claims · 3")
   - List of claims still being tested. Each: glyph + 1-line claim + verdict.
4. **Mistake fossils** (collapsed; "2")
   - Same as Concept Diff blocks but in compressed list form.
5. **Recall queue** (collapsed; "5")
   - List ordered by next-review date: `· Reader tier responsibilities — in 2d`. Calendar-style.

**Visual treatment.** Each section header is 13 px Inter SemiBold uppercase tracking +0.04em, gray `#6B6B6B`. Section dividers are 1 px `#E6E4DC` lines. No icons in headers (icons make it feel like a dashboard). The whole column has `font-feature-settings: "tnum"` so numbers align.

## 1.4 The "Before Study Mode" — Planning Screen

This is the **5–7 second wow moment** before the document loads. It must look like an agent thinking, not a generic spinner.

**Layout.** Full-screen `#FAFAF7` background, content centered in a 560 px column.

```
                    ◐
       Shrodinger is opening Chapter 7

  ┌─────────────────────────────────────────┐
  │ ✓ Loaded your cognitive trace            │   <- check appears at 600ms
  │   42 flashcards · 3 chats · 2 mind maps  │
  │                                          │
  │ ✓ Read Chapter 7 — 8,412 words           │   <- 1400ms
  │   12 sections · 4 formulas · 1 table     │
  │                                          │
  │ ⏵ Placing interventions…                  │   <- spinner, 2200ms-4500ms
  │   ◐ Open-the-box checkpoints: 3          │   <- counts tick up
  │   ▤ Formula anchors:           1          │
  │   ⌗ Before-reading blocks:     2          │
  │                                          │
  │ ✓ Ready                                  │   <- 4800ms
  └─────────────────────────────────────────┘

       [ Start reading → ]   <- appears at 5000ms
```

**Mechanics.** This screen runs on a fixed `setTimeout` schedule — **the agent has already finished**. The numbers shown are read from the pre-baked `intervention-plan.json`. The planner *can* run live in development, but on demo day this is a 5-second scripted reveal. It is honest because the plan really was computed by an agent — just earlier that morning.

**Audio cue (optional, only if ElevenLabs side-challenge is in play):** a single quiet typewriter-style tick on each row reveal. No music.

## 1.5 Submit-Answer Animation — The Box Opening

This is the second wow moment. Total duration **~1.4 s**, all CSS transitions, no Framer Motion required (but use it if available — it's free).

1. **0 ms** — User clicks `Submit understanding`. The textarea locks (cursor disappears, opacity → 0.7, transition 200 ms).
2. **150 ms** — Buttons fade out and collapse to height 0, replaced by the `Submitted ✓ 14:32` muted line.
3. **300 ms** — Below the checkpoint block, a 1 px horizontal line draws from left to right (300 ms ease-out) — the "lid opening" stroke.
4. **600 ms** — A `ClaimReview` block expands from height 0 to natural height (400 ms cubic-bezier(0.2, 0.8, 0.2, 1)). The first claim card is already visible at expand-end.
5. **1000 ms** — Subsequent claim cards stagger in, 120 ms apart (opacity 0→1, translateY 4 px→0).
6. **1400 ms** — The right sidebar's "Active claims" section pulses once (background `#F5F3EC` → `#EAE6DA` → back, 600 ms total) and updates its count.

If claim review is the live LLM call (it is — see §2.6), the animation through step 3 plays *while* the API request is in flight (typically 1.5–4 s). When the response lands, steps 4–6 execute. If the response takes longer than 6 s, the deterministic fallback `ClaimReview` (see §2.7) is rendered — the user sees no difference.

## 1.6 Microcopy Library

| Surface | String |
|---|---|
| App name in header | `Shrodinger` (no diacritic — intentional, more searchable, references the metaphor not the man) |
| Tagline beneath logo on splash | *"The document is the interface."* |
| Planning screen title | `Shrodinger is opening Chapter {N}` |
| Planning rows (in order) | `Loaded your cognitive trace` · `Read Chapter {N} — {wordCount} words` · `Placing interventions…` · `Ready` |
| Start CTA | `Start reading →` |
| Context block heading | `Before you read this section` |
| Context block CTA | `Mark as ready ↵` |
| Anchor block CTA | `Worked through it ✓` |
| Checkpoint heading | `Open the box` |
| Checkpoint placeholder | `Explain in your own words…` |
| Checkpoint hint preface | `Hint: ` (then 1 sentence, italic) |
| Checkpoint primary | `Submit understanding` |
| Checkpoint secondary | `Tiny hint` |
| Checkpoint tertiary | `Skip — mark fragile` |
| ClaimReview header | `I read your answer as {N} claims. Here's how each holds up against the source.` |
| Verdict labels | `correct` · `partial` · `incorrect` · `unsupported` |
| ClaimReview primary | `Revise my answer` |
| ClaimReview secondary | `Challenge Shrodinger` |
| Challenge placeholder | `Why do you think this verdict is wrong?` |
| ConceptDiff heading | `Mistake repaired` |
| ConceptDiff before label | `You said` |
| ConceptDiff after label | `What the source supports` |
| ConceptDiff schedule line | `→ Will resurface in {N} {days/hours}` |
| ConceptDiff fossil tagline | `Saved as a mistake fossil — never overwritten.` |
| Trace section 1 | `Now reading` |
| Trace section 2 | `Why Shrodinger intervened` |
| Trace section 3 | `Active claims` |
| Trace section 4 | `Mistake fossils` |
| Trace section 5 | `Recall queue` |
| Trace empty state (claims) | `No open claims. Keep reading.` |
| Error toast (claim review fails) | `Couldn't measure that one. Try again?` (with retry) |
| End-of-session screen | `Session closed. {N} concepts studied · {M} mistakes repaired · next recall {date}.` |

**Voice rules.** Second person ("you"). Present tense. No exclamation marks. No "Great job!" or "Awesome!" Never call the student "the user." Never say "AI" — say "Shrodinger" or omit the subject. Never apologize for being wrong; ask for the challenge.

## 1.7 Color Palette and Design Tokens

```css
/* Surfaces */
--paper:          #FAFAF7;   /* page bg */
--margin:         #F5F3EC;   /* trace column bg */
--ink:            #1B1B1F;   /* body text */
--ink-muted:      #6B6B6B;
--rule:           #E6E4DC;   /* hairlines */

/* Block accents — one per phase */
--block-context:  #1B3A4B;   /* before reading */
--block-anchor:   #3D2C5E;   /* formula */
--block-check:    #0F3D2E;   /* open the box */
--block-claim:    #5A3A1B;   /* claim measurement */
--block-diff:     #2B2B2B;   /* mistake repaired */

/* Verdicts */
--verdict-ok:     #1F7A3A;
--verdict-partial:#B8860B;
--verdict-bad:    #A8321F;
--verdict-none:   #6B6B6B;

/* Type */
--font-serif:    'Source Serif 4', 'Iowan Old Style', Georgia, serif;
--font-sans:     'Inter', -apple-system, system-ui, sans-serif;
--font-mono:     'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace;

/* Radii / motion */
--radius-block:  6px;
--ease-box:      cubic-bezier(0.2, 0.8, 0.2, 1);
--dur-open:      400ms;
```

**Quantum/cat identity.** A single 12 px `◐` glyph (Unicode "circle with left half black") is the only logo. It appears once in the header, once on the planning screen, and once in the checkpoint phase pill. It looks like a half-open box. Never use a cat emoji, never use 🐱, never an animated cat, never the word "purr." The only cat reference is the closing pitch line.

## 1.8 React Component Names — Scaffold-Ready

```
<App>
  <PlanningScreen />              // 1.4
  <StudySession>                  // root after planning
    <SessionHeader />
    <DocumentCanvas>              // Tiptap editor wrapper
      <ContextBlockNode />        // node view A
      <AnchorBlockNode />         // node view B
      <CheckpointBlockNode />     // node view C
      <ClaimReviewBlockNode />    // node view D
      <ConceptDiffBlockNode />    // node view E
    </DocumentCanvas>
    <LearningTrace>               // right column
      <TraceNowReading />
      <TraceWhyIntervened />
      <TraceActiveClaims />
      <TraceMistakeFossils />
      <TraceRecallQueue />
    </LearningTrace>
  </StudySession>
</App>
```

Inside each node view, sub-components: `<PhasePill />`, `<BlockShell />`, `<ClaimCard />`, `<RevisePrompt />`, `<TinyHintPopover />`. Total ~14 components. All in TypeScript.

## 1.9 Explicit "Do NOT" List

The UI must not look like:

- **A chatbot.** No bubble alignment, no sender avatars, no typing indicator, no `Send ↵` button styled like Discord/iMessage.
- **A dashboard.** No KPI cards, no charts, no "Today's progress 67%" rings, no streak counters, no badges.
- **A gamified app.** No XP, no levels, no confetti, no `+10 points!` toasts, no leaderboards.
- **A generic LMS** (Moodle/Canvas). No left-rail course tree, no breadcrumbs longer than one level, no tabbed nav like "Lessons / Quizzes / Forum."
- **A note-taking app.** No `+ New page` button, no slash menu, no `/`, no draggable blocks for the user.
- **An AI playground.** No model selector, no temperature slider, no system-prompt textarea, no "Regenerate" button.
- **A document editor.** Text is **selectable but not editable** (Tiptap `editable: false`). The only typing happens inside checkpoint textareas.
- **Childish.** No round avatars, no emojis in microcopy, no Comic Sans, no rainbow gradients, no Lottie animations of cute mascots.

If the screen looks like any of those at hour 14, **stop and remove decoration**.

---

# PART 2 — 20-HOUR BUILD PLAN

## 2.1 Team Roles

- **A — Agent dev** (the strong one): planner prompt, claim-decomposition prompt, OpenAI Structured Outputs wiring, persona-from-trace parser, fallback ledgers.
- **B — Frontend lead**: Tiptap setup, all five node-view components, state plumbing.
- **C — Frontend / design**: Layout, typography, planning screen, trace sidebar, motion, microcopy QA.
- **D — Demo / data / pitch**: Pre-bakes the demo content (markdown source + intervention plan + canned claim review), records the 2-min video, drives rehearsal, owns Replit deployment.

## 2.2 Hour-by-Hour Plan (with parallel streams)

| Hour | A — Agent | B — FE Lead | C — FE/Design | D — Demo/Pitch |
|---|---|---|---|---|
| 0 | Read brief, agree on `InterventionPlan` schema (this doc §2.4) | Bootstrap Vite + React + TS + Tiptap + Tailwind | Set up design tokens (§1.7), build `<BlockShell>` + `<PhasePill>` | Pull the Anthropic agents PDF, pick exact 600-word excerpt |
| 1 | Sketch planner prompt against pre-extracted markdown | First Tiptap `editable: false` view of plain markdown | Typography pass; verify Source Serif 4 loads, page hits 720 px column | Convert excerpt to clean markdown; commit `chapter7.md` |
| 2 | Run planner against demo content; iterate prompt; commit `intervention-plan.v1.json` | Implement custom Tiptap node `contextBlock` | Build ContextBlock visual (§1.2A) | Draft pitch outline; bookmark sources for citations |
| 3 | Persona file: parse Braynr trace metadata.json + cognitive markdown into `LearnerModel` (§2.5) | Implement `checkpointBlock` node + textarea wiring | Build CheckpointBlock visual (§1.2C) | Storyboard 2-min video on paper |
| 4 | Claim-decomposition prompt v1; Zod schema; mock client | Implement `claimReviewBlock` node | Build ClaimReviewBlock + ClaimCard visuals (§1.2D) | Lock the wrong-answer text; pre-write the 3 verdicts |
| 5 | Wire OpenAI Structured Outputs call from Node sidecar (Express, single endpoint `/decompose`) | Implement `anchorBlock` + `conceptDiffBlock` nodes | Build AnchorBlock + ConceptDiffBlock visuals (§1.2B,E) | Write 3-min pitch script v1 (§3) |
| 6 | Test `/decompose` end-to-end with the canned wrong answer; tune temperature 0.2 | Build `<DocumentCanvas>` that loads `chapter7.md` and `intervention-plan.json` and inserts node placements at anchors | Build `<LearningTrace>` skeleton (5 sections, mocked content) | Rehearse pitch v1; cut to 3:00 |
| 7 | Build deterministic **fallback** ClaimReview JSON; add 6-second timeout to client | Wire submit-answer flow: textarea → POST `/decompose` → render ClaimReviewBlock inline | Build "Why Shrodinger intervened" subsection (real content from persona) | Record rough video v1 on Loom |
| 8 | **Checkpoint review (all 4):** does the demo loop run end-to-end with mocks? Fix the worst broken thing. | (continued) | (continued) | (continued) |
| 9 | Implement "Challenge Shrodinger" — second LLM call template (or pre-canned response) | Submit-animation (§1.5) | "Mistake fossils" + "Recall queue" sidebar sections (mocked from plan) | Pitch rehearsal v2 |
| 10 | Wire planning-screen "agent thinking" reveal to the pre-baked plan with scripted timings | Build `<PlanningScreen />` (§1.4) | Polish all block visuals; verify scan-by-color works | Record demo video v2 with real screen |
| 11 | Concept-diff generator: pre-bake a concept diff for the canned wrong answer | Wire ConceptDiffBlock to render on revise-and-resubmit | Trace sidebar pulse animation (§1.5 step 6) | Pitch rehearsal v3, time it |
| 12 | **HARD CUTOFF for any new agent code.** From here, only fixes. | Fix any state bugs in checkpoint→claim→diff chain | Final typography & spacing pass | Lock the canned demo path: a written, second-by-second runbook |
| 13 | Add a "demo mode" feature flag that bypasses the live API and uses canned responses | Add a keyboard shortcut `Cmd+Shift+D` to toggle demo mode | Build the end-of-session "Session closed" screen | Final video v3 |
| 14 | **SCOPE CLIFF (§2.10) — apply if behind** | Buffer / bug-fix | Buffer / bug-fix | Stage timing; runbook v2 |
| 15 | Smoke test: full happy path 5 times in a row, no errors | (assist) | (assist) | Memorize pitch beats |
| 16 | Smoke test on hotel/venue Wi-Fi if possible; verify fallback fires on offline | (assist) | (assist) | Final pitch dry-run with fake judges (other team) |
| 17 | Deploy to Replit / Vercel, lock environment variables | Final UI polish: hover states, focus rings | Verify accessibility basics: keyboard tab order, contrast | Q&A prep — write answers to §6 |
| 18 | Write 5-minute README on repo for judges | Final polish | Final polish | Final pitch run |
| 19 | **Freeze.** No commits except critical bug. | Freeze | Freeze | Sleep / mental rest |
| 20 | Buffer / contingency / final demo dry-run on stage Wi-Fi | | | |

**Crit moments:** hour 8 (does it work end-to-end?), hour 12 (no new code), hour 14 (scope cliff), hour 19 (freeze).

## 2.3 Component Tree, Props, and State Shape

```tsx
// App.tsx
type AppState =
  | { phase: 'landing' }
  | { phase: 'planning'; chapterId: string }
  | { phase: 'studying'; session: Session };

// Session is the heart
interface Session {
  chapter: Chapter;             // markdown + parsed AST
  plan: InterventionPlan;       // §2.4 — the agent's output
  learner: LearnerModel;        // §2.5
  trace: LiveTrace;             // grows during the session
}

// LiveTrace is the only thing that mutates during reading
interface LiveTrace {
  activeClaims: Claim[];
  fossils: ConceptDiff[];
  recallQueue: RecallItem[];
  submissions: Record<string /*checkpointId*/, Submission>;
}

interface Submission {
  text: string;
  submittedAt: number;
  review?: ClaimReview;          // §2.6 — populated after API
  revisedText?: string;
  diff?: ConceptDiff;
}
```

**Where state lives.**

- `Session` (top-level reading state, including `plan`, `learner`, `trace`) → **Zustand** store, `useSessionStore`. One store, three slices: `plan`, `trace`, `ui`. Zustand is the right pick because the team has one strong dev and three generalists; Zustand has the shallowest learning curve of the modern options and 1.16 KB bundle (Jotai's atomic model is more elegant but adds reasoning overhead the team can't afford in 20 hours).
- Tiptap editor instance → React ref inside `<DocumentCanvas>`, not in store (Tiptap manages its own ProseMirror state).
- Per-block ephemeral UI state (textarea text before submit, hint open/closed) → local `useState` inside each node-view component.
- The pre-baked plan and chapter markdown → **static JSON files** in `src/demo/`, imported synchronously. Do not put them in store; they don't change.

```ts
// store.ts
import { create } from 'zustand';

interface SessionStore {
  plan: InterventionPlan | null;
  trace: LiveTrace;
  setPlan: (p: InterventionPlan) => void;
  recordSubmission: (cpId: string, s: Submission) => void;
  recordReview: (cpId: string, r: ClaimReview) => void;
  recordDiff: (cpId: string, d: ConceptDiff) => void;
}
export const useSessionStore = create<SessionStore>((set) => ({
  plan: null,
  trace: { activeClaims: [], fossils: [], recallQueue: [], submissions: {} },
  setPlan: (p) => set({ plan: p }),
  recordSubmission: (cpId, s) => set((st) => ({
    trace: { ...st.trace, submissions: { ...st.trace.submissions, [cpId]: s } }
  })),
  recordReview: (cpId, r) => set((st) => ({
    trace: {
      ...st.trace,
      submissions: {
        ...st.trace.submissions,
        [cpId]: { ...st.trace.submissions[cpId], review: r }
      },
      activeClaims: [...st.trace.activeClaims, ...r.claims]
    }
  })),
  recordDiff: (cpId, d) => set((st) => ({
    trace: {
      ...st.trace,
      fossils: [...st.trace.fossils, d],
      submissions: {
        ...st.trace.submissions,
        [cpId]: { ...st.trace.submissions[cpId], diff: d }
      }
    }
  })),
}));
```

## 2.4 The `InterventionPlan` Contract (Agent → Frontend)

This is the **single most important interface in the project**. The agent writes this; the frontend reads it. Lock it at hour 0.

```ts
type BlockType = 'context' | 'anchor' | 'checkpoint' | 'claimReview' | 'conceptDiff';
type Phase =
  | 'before_reading'
  | 'formula_anchor'
  | 'open_the_box'
  | 'claim_measurement'
  | 'mistake_repaired'
  | 'recall_scheduled';

interface InterventionPlan {
  planId: string;
  chapterId: string;
  generatedAt: string;             // ISO
  modelVersion: string;            // e.g. "planner-v1.2"
  learnerSnapshot: {
    learnerId: string;
    snapshotAt: string;
  };
  placements: Placement[];          // ordered top→bottom in document
}

interface Placement {
  id: string;                       // e.g. "cp-7-2-001"
  anchorId: string;                 // matches a `data-anchor-id` in the markdown,
                                    // inserted by a pre-pass that wraps every <p> with one
  blockType: BlockType;
  phase: Phase;
  rationale: string;                // 1–2 sentences for the trace sidebar
  rationaleEvidence: TraceEvidence[]; // see §2.5
  payload: PlacementPayload;        // type narrows on blockType
}

type PlacementPayload =
  | ContextPayload
  | AnchorPayload
  | CheckpointPayload
  | ClaimReviewSeedPayload     // for the *expected* review (used as fallback)
  | ConceptDiffSeedPayload;

interface ContextPayload {
  blockType: 'context';
  heading: string;               // "Before you read this section"
  body: string;                  // 2–3 sentences
  watchFor: string[];            // ≤3 bullets
}

interface AnchorPayload {
  blockType: 'anchor';
  formulaOrCode: string;         // rendered in mono
  workedExample: string;         // 1–2 lines
}

interface CheckpointPayload {
  blockType: 'checkpoint';
  prompt: string;                // the question
  expectedClaims: ExpectedClaim[]; // ground truth, used for fallback verdicts
  hint: string;                  // shown on "Tiny hint"
  difficulty: 'low' | 'medium' | 'high';
}

interface ExpectedClaim {
  text: string;
  sourceSpan: { sectionId: string; quote: string };
  isRequired: boolean;
}

interface ClaimReviewSeedPayload { /* baked fallback, see §2.7 */ }
interface ConceptDiffSeedPayload { /* baked fallback */ }
```

**Pre-pass.** Before the agent runs, a 30-line script (`prepareChapter.ts`) walks the markdown AST and assigns a stable `anchorId` to every paragraph and heading. The agent receives the **annotated markdown** and emits placements that reference these `anchorId`s. This makes placement deterministic and trivial to render.

## 2.5 The `LearnerModel` (Persona) Contract

Derived once from the Braynr cognitive trace + `metadata.json`. This is the input to the planner.

```ts
interface LearnerModel {
  learnerId: string;
  derivedFrom: { traceFiles: string[]; metadataVersion: string };

  priorConcepts: PriorConcept[];        // what they've studied
  weakConcepts: WeakConcept[];          // FSRS difficulty > 0.7 OR repeated chat questions
  strongConcepts: string[];

  studyChats: ChatExcerpt[];            // last N=10 timestamped tutor exchanges
  recentMistakes: PriorMistake[];

  pacing: {
    avgWordsPerMinute: number;
    typicalSessionMinutes: number;
  };
}

interface PriorConcept {
  conceptId: string;
  label: string;
  flashcardCount: number;
  fsrs: { difficulty: number; stability: number; lastReviewed: string };
  source: 'flashcard' | 'note' | 'mindmap' | 'chat';
}

interface WeakConcept extends PriorConcept {
  failedRetrievals: number;
  lastFailureAt: string;
}

interface TraceEvidence {     // referenced from each Placement.rationaleEvidence
  kind: 'flashcard' | 'chat' | 'note' | 'mindmap';
  excerpt: string;            // ≤120 chars
  pointer: string;            // e.g. "flashcards/c7-tools.md#L42"
  weight: number;             // 0..1, how strongly this drove the placement
}
```

The planner's job is, given a `LearnerModel` + an annotated chapter markdown, to emit an `InterventionPlan`. It does this **once**, before the session.

## 2.6 The `ClaimReview` Contract (the live LLM output)

```ts
interface ClaimReview {
  reviewId: string;
  checkpointId: string;
  claims: Claim[];
  overallSummary: string;       // 1 sentence, used as ConceptDiff input later
  modelLatencyMs: number;
  source: 'live' | 'fallback';  // for telemetry only, never shown
}

interface Claim {
  id: string;
  text: string;                                // the atomic claim
  verdict: 'correct' | 'partial' | 'incorrect' | 'unsupported';
  rationale: string;                           // 1 sentence
  sourceSpan?: { sectionId: string; quote: string };  // null for unsupported
  severity: 'minor' | 'major';                 // major = becomes a fossil
}

interface ConceptDiff {
  id: string;
  checkpointId: string;
  before: string;       // wrong claim, struck-through in UI
  after: string;        // corrected
  scheduledRecall: { dueAt: string; intervalDays: number };  // mock-FSRS, see §2.7
}
```

## 2.7 LIVE vs PRE-COMPUTED vs HARDCODED — Be Ruthless

| Surface | Strategy | Why |
|---|---|---|
| Persona load on planning screen | **HARDCODED** (read static `persona.json`) | The "I read your trace" moment doesn't gain anything from being live. |
| Chapter analysis on planning screen | **PRE-COMPUTED** | Numbers (`8412 words · 12 sections · 4 formulas`) are computed at build time. |
| Intervention placement | **PRE-COMPUTED** | The agent runs *once*, the morning of the demo, against the canned chapter + persona. The output is committed to git. |
| Context-block bodies | **PRE-COMPUTED** (in plan) | Same. |
| Checkpoint prompts | **PRE-COMPUTED** (in plan) | Same. |
| Tiny hint text | **PRE-COMPUTED** (in plan) | Same. |
| Claim decomposition (the wow moment) | **LIVE LLM CALL** with deterministic fallback | This is the only moment where typing → AI feedback feels magical. Worth the risk; protected by fallback. |
| Claim verdicts | **LIVE** (from claim review) | Same call. |
| "Challenge Shrodinger" reply | **HARDCODED** (1 canned response per claim) | Edge case for judge questions, not for the main demo path. |
| Concept diff generation | **PRE-COMPUTED** (in plan, keyed on the expected wrong answer) | The student types one of two pre-known answers; the diff is selected, not generated. |
| FSRS scheduling | **HARDCODED** ("Will resurface in 2 days") | Real FSRS is a stretch goal; the *scheduling concept* matters more than the math. |
| Recall queue contents | **HARDCODED** (from plan) | |
| End-of-session summary | **HARDCODED** | |

**Specific recommendation on claim decomposition.** Make it the live call. Reason: judges have seen 50 demos by Sunday; a screen that says "watch me type a wrong answer, watch the AI find three flaws" is worth the network risk *if and only if* the fallback is invisible. The fallback is the same JSON the live call would have produced for the canned wrong answer — committed to git. With a 6-second timeout and `AbortController`, the user never sees a spinner past 6 s; if the call hasn't returned, the fallback fires and the animation plays as if it were live. Tradeoff cost: one extra Zod schema and ~30 lines of fallback code; tradeoff benefit: a defensible "this is a real agent" claim and a much stronger pitch moment.

## 2.8 Agent Framework Recommendation

**Use OpenAI's Responses API with Structured Outputs (`strict: true`) and Zod schemas. No LangGraph, no LangChain, no CrewAI, no Claude SDK.**

Reasons, ordered by importance:

1. **One-shot reliability.** The team has 20 hours and the planner is one prompt with one structured-output schema. LangGraph buys you nothing here; it costs setup time you don't have.
2. **Schema enforcement is the entire ballgame.** OpenAI's `strict: true` mode guarantees JSON schema adherence (100% on their internal evals for `gpt-4o-2024-08-06`). The frontend can `JSON.parse` and trust the shape — no defensive code, no retry loops.
3. **Vercel AI SDK** (`generateObject` from `ai` package, with `@ai-sdk/openai` provider) wraps this in 8 lines and gives you a Zod-typed response. This is the right wrapper — even if the team deploys on Replit, not Vercel.
4. The agent specialist can spend 4 of their 20 hours on **prompt quality** instead of plumbing.

```ts
// server/decompose.ts (Express handler — also runs on Replit)
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const ClaimSchema = z.object({
  id: z.string(),
  text: z.string(),
  verdict: z.enum(['correct', 'partial', 'incorrect', 'unsupported']),
  rationale: z.string(),
  sourceSpan: z.object({ sectionId: z.string(), quote: z.string() }).nullable(),
  severity: z.enum(['minor', 'major']),
});
const ReviewSchema = z.object({
  claims: z.array(ClaimSchema).min(1).max(6),
  overallSummary: z.string(),
});

export async function decompose(studentAnswer: string, checkpoint: CheckpointPayload, sectionMarkdown: string) {
  const { object } = await generateObject({
    model: openai('gpt-4o-2024-08-06', { structuredOutputs: true }),
    schema: ReviewSchema,
    temperature: 0.2,
    system: PLANNER_SYSTEM_PROMPT,
    prompt: buildPrompt(studentAnswer, checkpoint, sectionMarkdown),
    abortSignal: AbortSignal.timeout(6000),
  });
  return object;
}
```

**Why not Claude / Anthropic?** The team has access. Claude is excellent for this kind of decomposition. But Anthropic's Structured Outputs story is younger; OpenAI's `strict: true` has the cleanest dev ergonomics for a 20-hour build. If the agent dev is more comfortable with Claude, the swap is one line in the AI SDK. Pick what they've used before.

**Why not Gemini?** The Vercel AI SDK supports it, but Gemini's structured-output reliability for nested schemas has been inconsistent in our experience. For 20 hours, optimize for "won't surprise you," not "newest."

**Replit/Express vs Vercel.** Deploy the agent endpoint on **Replit** (sponsor side-challenge bonus + persistent process + simple env vars). Frontend can be on Replit too, or on Vercel as a static deploy. **Do not run the LLM call from the browser** — your API key would leak.

## 2.9 The Pre-Baked Demo Content — Verbatim

### Source passage (lightly edited from the Anthropic agents PDF)

> ## §7.2 The Reader / Orchestrator / Resolver Tier
>
> A robust agent architecture separates concerns across three tiers. The **Reader** holds read-only MCP tools and is responsible for retrieving context — search, file reads, database queries — and producing structured observations. It is deliberately given no write tools.
>
> The **Orchestrator** receives the Reader's observations and plans next actions. It does not call tools directly; it only decides which tool the Resolver should call.
>
> The **Resolver** holds the write tools — sending emails, creating issues, mutating state. It executes the Orchestrator's plan and reports back. The Reader's final job is to synthesize a human-facing summary of what happened, drawing on its earlier observations and the Resolver's report.

### The pre-baked Placement

```json
{
  "id": "cp-7-2-001",
  "anchorId": "p-7-2-3",
  "blockType": "checkpoint",
  "phase": "open_the_box",
  "rationale": "Tool-access boundaries was a flashcard you struggled with twice (FSRS difficulty 0.78). This concept is a prerequisite for §7.4 on Resolver guardrails.",
  "rationaleEvidence": [
    { "kind": "flashcard", "excerpt": "Which tier holds write tools?", "pointer": "flashcards/c7-tools.md#L42", "weight": 0.9 },
    { "kind": "chat", "excerpt": "I'm still confused about why the Reader can't just write its own outputs", "pointer": "chats/2026-05-04.md#L12", "weight": 0.7 }
  ],
  "payload": {
    "blockType": "checkpoint",
    "prompt": "In your own words, what tools does the Reader have, and why?",
    "expectedClaims": [
      { "text": "The Reader has read-only MCP tools.", "sourceSpan": { "sectionId": "7.2", "quote": "holds read-only MCP tools" }, "isRequired": true },
      { "text": "The Reader produces structured observations from those tools.", "sourceSpan": { "sectionId": "7.2", "quote": "producing structured observations" }, "isRequired": true },
      { "text": "The Reader synthesizes the final human-facing summary.", "sourceSpan": { "sectionId": "7.2", "quote": "synthesize a human-facing summary" }, "isRequired": false }
    ],
    "hint": "Look at the verbs: which tier *retrieves*, which *plans*, which *executes*?",
    "difficulty": "high"
  }
}
```

### The scripted wrong answer (typed live in the demo)

> "The Reader must not have MCP access because it writes the final output, so it could leak data."

### The deterministic ClaimReview (live target — and fallback)

```json
{
  "reviewId": "rv-cp-7-2-001",
  "checkpointId": "cp-7-2-001",
  "claims": [
    {
      "id": "c1", "text": "The Reader writes the final output.",
      "verdict": "correct", "severity": "minor",
      "rationale": "The passage says the Reader synthesizes a human-facing summary at the end.",
      "sourceSpan": { "sectionId": "7.2", "quote": "synthesize a human-facing summary of what happened" }
    },
    {
      "id": "c2", "text": "The Reader has no MCP access.",
      "verdict": "incorrect", "severity": "major",
      "rationale": "The Reader is the tier that holds the read-only MCP tools.",
      "sourceSpan": { "sectionId": "7.2", "quote": "holds read-only MCP tools" }
    },
    {
      "id": "c3", "text": "Giving the Reader MCP access would risk data leaks.",
      "verdict": "unsupported", "severity": "minor",
      "rationale": "The passage doesn't make any claim about data leakage. The architectural reason given is separation of read and write concerns, not data security.",
      "sourceSpan": null
    }
  ],
  "overallSummary": "You inverted which tier is read-only. Reader = read-only tools; Resolver = write tools.",
  "modelLatencyMs": 0, "source": "fallback"
}
```

### The pre-baked ConceptDiff (after revise)

```json
{
  "id": "diff-cp-7-2-001",
  "checkpointId": "cp-7-2-001",
  "before": "Reader has no MCP access; it only writes the final summary.",
  "after": "Reader holds the read-only MCP tools (search, file reads, database queries), produces structured observations, and at the end synthesizes the human-facing summary.",
  "scheduledRecall": { "dueAt": "2026-05-11T09:00:00Z", "intervalDays": 2 }
}
```

The student types the wrong answer, sees the three verdicts, clicks `Revise my answer`, types the corrected version (or pastes from a teleprompter — the team practices it), and the ConceptDiff block fades in. Total time on this loop: 65 seconds in the live demo, fits cleanly inside the 2-min video.

## 2.10 Risk Register & Scope Cliff

### Top 3 demo risks

1. **Live LLM call hangs or fails (network, API key, rate limit).**
   *Contingency:* `AbortSignal.timeout(6000)`. On timeout/error, render the deterministic fallback ClaimReview from `intervention-plan.json`. The user sees no difference. Test this **with WiFi disabled** during rehearsal — it must work offline.
2. **Tiptap node-view rendering glitch (block appears in wrong place / disappears).**
   *Contingency:* If at hour 14 there is any flicker bug in node-view rendering, fall back to a non-Tiptap implementation: render the markdown as static React components (`react-markdown` with `components` map) and place blocks by anchor ID via array splicing. You lose nothing visually; you lose only the (unused-anyway) editability.
3. **The browser running the live demo crashes / forgot to plug in / projector aspect ratio breaks layout.**
   *Contingency:* The 2-min recorded video is the demo. Pitcher says "in case the live demo doesn't render on this projector, I've got a recording" and plays it. The live demo can be a backup to the video, not the other way around. **Decide which one is primary at hour 18 based on rehearsal stability.**

### Other risks to watch
- **Source Serif 4 doesn't load on the venue WiFi.** Self-host the WOFF2 in `/public/fonts/`. Don't rely on Google Fonts.
- **Right sidebar overflows on 13" screen.** Use `min-width: 1280px` warning + an "open in another window" fallback. Ideally bring your own external monitor or laptop with ≥14" screen.
- **OpenAI key burned by the venue's curious other team.** Use a Replit secret, never commit `.env`, and set a $5 spend cap on the key for the day.

### Scope cliff (apply at hour 14 if behind, in this order)

1. **CUT FIRST: Anchor blocks (formula).** Remove from plan. The Reader/Resolver passage doesn't have formulas anyway — you can drop this without changing the demo.
2. **CUT SECOND: "Challenge Shrodinger" button.** Hide the button. The judge-question answer for "what if the AI is wrong?" doesn't require it to actually work in the demo.
3. **CUT THIRD: Mistake fossils & Recall queue sidebar sections.** Show empty states with "0" counts. The Active Claims section alone is enough to telegraph the ledger concept.
4. **CUT FOURTH: Submit-animation step 3 (the lid-opening line).** Replace with a 200 ms fade-in. Less elegant; same loop.
5. **CUT FIFTH: Live LLM call.** Force demo mode = always fallback. The pitch becomes "we pre-compute all the agent work" which is *defensible and consistent with the planning-phase thesis* — not a loss.
6. **DO NOT CUT, EVER:** the Checkpoint → ClaimReview → Revise → ConceptDiff loop. **Without that loop there is no demo.**

---

# PART 3 — THE 3-MINUTE PITCH SCRIPT

Speaker: one person (likely D). English. Time-marked. Read it like a paper, not a sales deck.

> **[0:00–0:30 · The problem]**
>
> Most students using AI today read what the AI wrote. They open ChatGPT, ask for a summary of chapter seven, and read the summary. They feel productive. They are not learning.
>
> Cognitive science has been clear about this since 2006. Roediger and Karpicke showed that retrieval — pulling knowledge out of your own head — is what builds durable memory. Slamecka and Graf showed in 1978 that words you generate are remembered better than words you read. Bjork calls this "desirable difficulty," and Dunlosky's 2013 meta-analysis ranks practice testing as one of the two most effective study techniques in the entire literature.
>
> But every AI study tool today does the opposite. It generates the content. The student consumes it. We call this eduslop.
>
> **[0:30–1:00 · The inversion]**
>
> Shrodinger inverts that. Before the student opens the box of their understanding, that understanding is unobserved — both there and not there, like Schrödinger's cat. The student reads the source document, and Shrodinger inserts small contextual interventions directly into the document at the right moments. The document is the interface. There is no chatbot. There is no dashboard.
>
> The AI doesn't adapt the user to itself. The AI adapts to the user. *Non è l'utente che si adatta all'AI, ma è l'AI che si adatta all'utente.*
>
> **[1:00–1:30 · How it works]**
>
> Shrodinger maps one-to-one to the PACRAR study method, but the method is the engine, not a sidebar.
>
> When you say "I want to study chapter seven," Shrodinger first reads your cognitive trace from Braynr — your flashcards, your chat history, your mistakes. It analyzes the chapter. And in a planning phase, *before* you read a single word, it decides where in the document to place orientation blocks, formula anchors, and checkpoints. Each placement has a reason — and that reason is visible, in the trace ledger, on the right.
>
> When you hit a checkpoint, you write a free-text answer. Shrodinger decomposes it into atomic claims, marks each one against the source — correct, partial, incorrect, unsupported. You revise. The mistake is preserved as a "fossil," scheduled to resurface, and never overwritten.
>
> **[1:30 · Cue the demo]**
>
> Let me show you 60 seconds of the loop. *[Plays 2-min video.]*
>
> **[3:30 — actually 2:30 after video, plan for 30 seconds of close]**
>
> **[2:30–3:00 · Close]**
>
> Three things to remember.
>
> One: every other AI study tool produces content. Shrodinger produces friction — the right friction, in the right place.
>
> Two: the trace ledger isn't a feature. It's the contract. Every intervention has a reason the student can audit. When the AI is wrong, the student can challenge it, and the challenge becomes part of the trace.
>
> Three: the mistakes are fossils. Not erased. We don't pretend the student got it right the first time. That's how memory actually works.
>
> Shrodinger opens the box. Thank you.

**Pitch rehearsal notes for the speaker.**
- Pause for one full beat after "eduslop" (it's the only memorable word in the first minute).
- Read the Italian phrase slightly slower than the English. Italian judges will recognize it.
- The video must start with no preamble — just cue it and let it play.
- The closing three points are numbered out loud (`one`, `two`, `three`) for retention.
- Do not say "AI agent." Say "Shrodinger" or "the planner."

---

# PART 4 — THE 2-MINUTE VIDEO STORYBOARD

Recorded at 1920×1080, screen capture only, voiceover in English, no music. Total: 120 seconds, 9 shots.

| # | t (mm:ss) | Dur | What's on screen | What's narrated | What's clicked / typed |
|---|---|---|---|---|---|
| 1 | 0:00 | 6 s | Splash: paper bg, `◐` glyph, "Shrodinger". Cursor moves to a hidden "Study Chapter 7" button. | "I tell Shrodinger I want to study chapter seven." | Click `Study Chapter 7`. |
| 2 | 0:06 | 12 s | Planning screen reveals the four rows in sequence (§1.4). | "First, it loads my cognitive trace from Braynr — 42 flashcards, 3 tutor chats, 2 mind maps. It reads the chapter. And then, before I read a word, it places its interventions: 3 checkpoints, 1 formula anchor, 2 orientation blocks. This is the planning phase. The agent runs once, here, not while I read." | None — runs on its scripted timeline. Click `Start reading →` at the end. |
| 3 | 0:18 | 10 s | Document canvas appears. Camera scrolls slowly down past a heading and into the first orientation block (`Before reading`). Trace sidebar visible on right. | "The document is the interface. As I read, Shrodinger appears inline. Here it's orienting me before a hard section." | Smooth scroll. |
| 4 | 0:28 | 8 s | Scroll continues, lands on the §7.2 Reader/Orchestrator/Resolver passage. Hover over the right-sidebar's "Why Shrodinger intervened" box, which is already open. | "I keep scrolling — and here's a checkpoint. The right margin tells me why: I struggled with this concept on a flashcard last week, and it's a prerequisite for section seven-four." | Hover briefly on rationale bullets. |
| 5 | 0:36 | 18 s | Camera lands on the Checkpoint block. Cursor enters the textarea. Text types out at ~60 WPM (typed in advance, replayed): *"The Reader must not have MCP access because it writes the final output, so it could leak data."* | "It asks me, in my own words, what tools the Reader has and why. I think I know this — let me try." *(beat)* "I'm wrong. Watch what happens." | Type the wrong answer, click `Submit understanding`. |
| 6 | 0:54 | 22 s | Submit animation plays (lid-line, ClaimReview block expands, three claim cards stagger in). Camera holds steady. | "Shrodinger reads my answer as three atomic claims. Claim one — that the Reader writes the final output — is correct. The passage says exactly that. Claim two — that the Reader has no MCP access — is wrong. The Reader is the tier that holds the read-only MCP tools. And claim three — about data leaks — is unsupported. The passage never mentions security." | None. Pure animation. |
| 7 | 1:16 | 14 s | Click `Revise my answer`. The textarea unlocks; pre-typed correction appears. Click submit again. ConceptDiff block fades in below. | "I revise. Shrodinger doesn't erase my mistake — it saves it as a fossil. Before, after, and a recall date. In two days, this concept resurfaces." | Click `Revise`, paste correction, click `Submit`. |
| 8 | 1:30 | 18 s | Right sidebar pulses. Camera pans to the trace column. The "Active claims" count goes from 0 to 3, "Mistake fossils" from 0 to 1, "Recall queue" gets a new item. | "Everything I just did is in the ledger. Three open claims being tracked, one repaired mistake, one new recall scheduled. This is the accountability surface — every AI judgment is visible, and I can challenge it. I can disagree with Shrodinger." | Hover the "Challenge Shrodinger" ghost button without clicking. |
| 9 | 1:48 | 12 s | Cut back to the document, scroll one more time, fade to black with a final card: `◐ Shrodinger — the document is the interface.` | "The AI doesn't write the answers. It opens the box of my understanding. That's the difference." | Fade. |

**Recording instructions.**
- Use OBS or QuickTime, 60 fps, 1920×1080, app at 100% zoom.
- Record voiceover separately in a quiet room with the iPhone Voice Memos app + AirPods, then sync. (Don't use ElevenLabs unless they want to claim that side-prize — judges *can tell*.)
- Final export H.264 ≤ 80 MB, also keep a 1080p MP4 on a USB stick as projector backup.

---

# PART 5 — EVALUATION CHECKLIST AGAINST THE RUBRIC

### A. Cognitive Design & UX (35%)

**Strongest answer to a hard judge question:**
> *"What's the desirable difficulty here?"* — "Free-text checkpoints with claim-level verdicts. The student must produce — Slamecka & Graf 1978's generation effect — and is then forced to confront which of their claims fail to ground in the source. This is desirable difficulty in the precise sense Bjork defines: short-term performance is worse than re-reading, long-term retention is better. We deliberately reject multiple-choice because Roediger & Karpicke 2006 found production tests produce greater benefits than recognition tests."

**Weakest spot to preempt:**
> Risk: a judge asks "but isn't AI doing the thinking *for* the student during claim review?" Preempt this in the pitch: the student writes the answer (generation), the AI only *checks* it against the source (and even that, the student can challenge). The AI never produces the answer. State this explicitly.

### B. Innovation in Frame Adherence (30%)

**Strongest answer:**
> "The brief asks for active learning. Every other team will build a chatbot or a flashcard generator and call it active. We argue that putting the AI's output *in front of the student* is fundamentally passive consumption, regardless of the wrapper. Active learning means the student produces, retrieves, and self-explains — the AI's role is to choose the right friction at the right moment and audit the student's claims. The document-as-interface, with planning-phase intervention placement, is the structural commitment that makes this possible. PACRAR maps onto our six block phases one-to-one, but the student never sees PACRAR — the method is the engine, not the surface."

**Weakest spot:**
> Risk: "this is just a fancy embedded quiz." Preempt with the trace ledger. A quiz doesn't have audit trails. A quiz doesn't have per-intervention rationales sourced from prior cognitive history. A quiz doesn't preserve mistake fossils. The ledger is what changes the genre.

### C. Technical Feasibility & Architecture (20%)

**Strongest answer:**
> "We separated planning from reading. The agent runs once — at planning time — and emits a deterministic JSON intervention plan. The frontend is a Tiptap document with five custom node views; rendering the plan is a pure function. The only live LLM call is claim decomposition, with OpenAI Structured Outputs guaranteeing schema compliance and a 6-second timeout falling back to the pre-computed expected verdicts. This is why the demo doesn't depend on the network. It's also why the architecture would actually scale — you can re-run the planner per chapter, cache the plan, and the read-time path is mostly static."

**Weakest spot:**
> "Did you actually build the Braynr trace ingestion?" — Honest answer: we built a parser that reads `metadata.json` and a directory of markdown files into our `LearnerModel` interface for the demo persona. We did not build a Braynr plugin. We chose this scope deliberately so the cognitive thesis was demonstrable in 20 hours.

### D. Demo & Communication (15%)

**Strongest answer:**
> "We set ourselves a constraint: in 60 seconds of demo, show the entire learning loop end-to-end — planning, intervention placement, generation, claim review, revision, fossil, recall scheduling. We picked one passage from a real document the audience knows — Anthropic's agents PDF — and one wrong answer that yields exactly three verdicts of three different types. That's the demo. Every other moment in the pitch defends a single thesis: AI should produce friction, not content."

**Weakest spot:**
> If the speaker rushes the Italian phrase or the closing three points, the pitch flattens. Rehearse with a stopwatch. Cut anything that doesn't make the verdict moment land harder.

---

# PART 6 — ANTICIPATED JUDGE QUESTIONS

**Q1. "How is this different from inline flashcards (Andy Matuschak's mnemonic medium, Orbit, RemNote)?"**
> Mnemonic medium inserts pre-authored prompts. We insert *learner-conditioned* interventions: the placements depend on the specific student's cognitive trace — which flashcards they failed, which chat questions they left open. And we don't just test recall; we decompose free-text into claims with source-grounded verdicts, which neither Orbit nor RemNote does.

**Q2. "Doesn't claim review just become another AI judgment the student takes on faith?"**
> Two things. First, every verdict is grounded in a `sourceSpan` quote from the document — the student can verify it directly. Second, the "Challenge Shrodinger" button surfaces disagreement as a first-class action, and the challenge becomes part of the ledger. The system is designed to expect to be wrong sometimes, not to pretend it isn't.

**Q3. "What's the actual learner model — is it just FSRS difficulty?"**
> No. FSRS difficulty is one input. The model also consumes recent tutor-chat excerpts (timestamped per-message), notes, mind-map nodes, and prior mistakes — Braynr's full cognitive trace. Each placement carries `rationaleEvidence` that points back to the specific trace artifact (a flashcard, a chat line) that drove it, with weights. Planning isn't FSRS; it's a structured-output prompt that consumes the whole trace.

**Q4. "Does the document-as-interface scale beyond a 2-page demo?"**
> The architecture is per-section. A 200-page chapter is just 200 sections each with their own placements. Rendering cost is constant per section because the plan is pre-computed. The harder question is *cognitive* scale: do students actually want this much friction? Our answer is the planner — the planner decides density. A student with strong prior knowledge of section X gets fewer interventions there. The trace ledger is what tells us we're not over-intervening.

**Q5. "What happens when the AI's claim review is itself wrong?"**
> Three layers. First, structured outputs against a Zod schema mean the *shape* is always valid. Second, every verdict carries a quote from the source the student can read in two seconds. Third, "Challenge Shrodinger" — disagreement is a first-class action in the ledger, not a bug report. Long term, those challenges become eval data for the planner. The system is built to be wrong, audited, and corrected, not built to be infallible.

---

## Recommendations

**Stage 0 — before hour 0 (today, before kickoff).**
- Lock the architecture in this doc. No "what if we used Next.js App Router instead" debates.
- Have the agent dev write the planner prompt against the canned passage on a laptop *now*. If they've never used OpenAI Structured Outputs, do a 30-minute hello-world before the hackathon starts. **Threshold to escalate: if at hour 4 the planner can't produce a valid `InterventionPlan` against the canned chapter, fall back to a hand-written `intervention-plan.json` and reframe the agent contribution as just claim decomposition.**

**Stage 1 — hours 0–8 (build the spine).**
- Goal: a clickable end-to-end path with mocked agent responses. By hour 8, you should be able to: load planning screen → see document → click checkpoint → submit any text → see hardcoded ClaimReview → click revise → see hardcoded ConceptDiff → see trace sidebar update.
- **Threshold to escalate to scope cliff: if at hour 8 the submit→ClaimReview render isn't working, drop the live LLM call entirely (cliff item 5) and lock in canned fallback as the official demo.**

**Stage 2 — hours 8–14 (wire the live call + polish).**
- Connect the live `/decompose` endpoint behind a feature flag. Test offline. Polish typography until the screen looks like a published academic page.
- **Threshold to escalate: if at hour 14 there is any flicker, race condition, or visible "loading…" longer than 1 second on the happy path, stop adding code and start cutting per §2.10.**

**Stage 3 — hours 14–20 (rehearse).**
- One person codes only on critical bugs; the other three rehearse, record, and prepare Q&A. Run the live pitch + demo at least 6 times end-to-end. Record video v3 by hour 13, lock by hour 18.

---

## Caveats

- **The "AI tutoring beats active learning" 2024 Harvard RCT (Kestin et al., *Scientific Reports* 2025) is real and worth knowing**, but cite it carefully — it concerns a Socratic chatbot, not the document-as-interface. Do not lean on it in the pitch; it works against your "chatbots are passive" framing if a judge knows the paper. If asked, the honest reply is: "That study showed pedagogically-designed AI tutors outperform unguided active learning. We agree. We're arguing about *form* — the inline document is a different surface than a chatbot, designed to leverage the same cognitive principles."
- **Effect sizes cited (Roediger & Karpicke retrieval-practice effect, Slamecka & Graf generation effect d ≈ 0.40, Bjork desirable difficulties, Dunlosky's "high utility" rating for practice testing and distributed practice, Freeman 2014 active-learning meta-analysis 0.47 SD)** are all real and citable. Do not invent specific percentages; the cited literature already does the work.
- **PACRAR is not in the English-language cognitive-science canon.** It's an Italian study-method synthesis (Alessandro de Concini's "Sistema ADC") that maps cleanly onto well-known cognitive principles. In English-speaking contexts, frame it as a "study-method scaffold," not as a research finding.
- **The Anthropic "Structuring Agents, Skills, and MCPs" passage** is paraphrased from publicly available Anthropic engineering posts on Skills and MCP code execution. If the team has the actual sponsor PDF, use the verbatim wording instead — it'll be more credible to the Braynr judges who likely have it too.
- **One stretch goal not in the plan**: real FSRS scheduling using `py-fsrs` or a JS port. Worth ~3 hours if and only if everything else is done by hour 16. Otherwise the hardcoded "in 2 days" is fine.
- **Schema strictness with OpenAI's `strict: true` requires `additionalProperties: false` and all fields marked required**; use Zod's `.nullable()` for optional fields rather than `.optional()`. This bit us in similar projects; flag it to the agent dev on day 0.
- **The "Challenge Shrodinger" feature** is the strongest preempt against judge question 2 but is the second item on the scope cliff. Decide at hour 12: if it's flaky, cut it and answer the question verbally instead. The verbal answer is strong on its own.