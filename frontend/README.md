# Shrodinger — React frontend

Active-learning study agent. The student reads a document; Shrodinger inserts checkpoints; answers are decomposed into atomic claims; mistakes are preserved as fossils; everything is auditable in the right sidebar.

> Open the box of understanding.

---

## Quick start

```bash
npm install
npm run dev   # http://127.0.0.1:5173
```

Backend expected at `http://127.0.0.1:8000` (see `src/lib/api.ts`). Override with:

```bash
VITE_API_BASE=https://your-host npm run dev
```

If the backend is down and `DEMO_MODE` is `true` in `src/config.ts`, `/check-claim` falls back transparently to `src/data/claimReviewReaderMcp.json` so the hackathon demo never breaks.

---

## Repo structure

```
react-app/
  index.html
  vite.config.ts
  tailwind.config.ts
  tsconfig.json
  src/
    main.tsx
    App.tsx                 ← top-level shell + state machine glue
    config.ts               ← DEMO_MODE flag
    types/index.ts          ← ClaimReview, Claim, Verdict, SourceSpan,
                              StudySession, LearningTraceState,
                              CheckpointState, MistakeFossil, RecallItem
    lib/
      api.ts                ← fetch client (healthCheck, generateQuestion, checkClaim)
      checkClaimWithFallback.ts
      sessionReducer.ts     ← single useReducer drives the demo loop
    data/
      documentContent.ts    ← document nodes (h1/h2/p/blocks/checkpoints)
      initialTrace.ts
      demoSession.ts        ← starting StudySession
      claimReviewReaderMcp.json   ← canned ClaimReview for the Reader/MCP demo
    components/
      Mascot.tsx            ← Shrodinger SVG (head + collar + box charm)
      TopBar.tsx
      SetupOverlay.tsx
      DemoControls.tsx
      document/
        StudyDocument.tsx
        inline.tsx          ← tiny **bold**/*em*/`code` renderer
      blocks/
        PhaseHead.tsx
        BeforeReadingBlock.tsx
        ConceptLinkBlock.tsx
        FormulaAnchorBlock.tsx
        OpenTheBoxBlock.tsx
        ClaimMeasurementBlock.tsx
        RevisionBox.tsx
        MistakeRepairedBlock.tsx
        RecallScheduledBlock.tsx
        CheckpointSlot.tsx
      trace/
        LearningTraceSidebar.tsx
        _section.tsx
        ClaimCard.tsx
        TraceNowReading.tsx
        TraceWhyIntervened.tsx
        TraceActiveClaims.tsx
        TraceMistakeFossils.tsx
        TraceRecallQueue.tsx
        TraceFeed.tsx
    styles/globals.css
```

---

## Component tree

```
<App>
 ├ <TopBar>                                ← brand · doc meta · status pill · actions
 ├ <SetupOverlay open=…>                   ← modal; chooses doc / goal / depth
 ├ <DemoControls phase=… …>                ← bottom rail; ←/→ keys also work
 ├ <div class="grid …">
 │   ├ <StudyDocument session dispatch …>
 │   │   ├ <BeforeReadingBlock/>
 │   │   ├ paragraph
 │   │   ├ <ConceptLinkBlock/>
 │   │   ├ paragraph(s)
 │   │   ├ <FormulaAnchorBlock/>
 │   │   ├ <CheckpointSlot id="reader-mcp">
 │   │   │   ├ <OpenTheBoxBlock/>          (phase = open)
 │   │   │   ├ <ClaimMeasurementBlock>     (phase = measuring | revising)
 │   │   │   │   ├ <ClaimCard …>           ← data-driven from ClaimReview.claims
 │   │   │   │   └ <RevisionBox/>          (phase = revising)
 │   │   │   └ <MistakeRepairedBlock/>     (phase = repaired)
 │   │   │     +<RecallScheduledBlock/>
 │   │   └ paragraph(s)
 │   └ <LearningTraceSidebar trace=…>
 │       ├ <TraceNowReading/>
 │       ├ <TraceWhyIntervened/>
 │       ├ <TraceActiveClaims/>            ← claims drive cards in real time
 │       ├ <TraceMistakeFossils/>          ← preserved, not erased
 │       ├ <TraceRecallQueue/>
 │       └ <TraceFeed/>                    ← chronological event log
```

---

## State machine

```
SETUP ──[onStart]────────► READING
READING ──[next]──┐
                 ▼
                OPEN ──[submit-start]──► (loading)
                       │
                       ├──[submit-success]──► MEASURING
                       └──[submit-error]──► OPEN (with error banner)
MEASURING ──[accept]────► REPAIRED
MEASURING ──[revise]────► REVISING ──[apply-revision → mark-repaired]──► REPAIRED
REPAIRED  (terminal — fossil + recall persisted in trace)
```

- `useReducer(sessionReducer, demoSession)` is the single source of truth.
- The reducer also writes `TraceEvent`s, `MistakeFossil`s, and `RecallItem`s as side effects of state transitions, so the right sidebar updates reactively without separate plumbing.

---

## API client

```ts
import { healthCheck, generateQuestion, checkClaim } from '@/lib/api';

await healthCheck();                        // { ok: true }
await generateQuestion({ topic, context }); // { question }
await checkClaim({ question, answer, context, demo_mode: true }); // ClaimReview
```

`checkClaimWithFallback()` wraps `checkClaim` and falls back to the JSON fixture when `DEMO_MODE` is on, so the demo never crashes if the backend is offline.

---

## Visual design system (tokens)

| Token       | Value (oklch)                 | Use                              |
| ----------- | ----------------------------- | -------------------------------- |
| paper       | `0.985 0.005 85`              | document background              |
| paper.2     | `0.965 0.006 85`              | app background                   |
| ink         | `0.20 0.01 270`               | body text                        |
| indigo      | `0.42 0.13 280`               | observation accent (checkpoint)  |
| amber       | `0.62 0.13 70`                | recall / formula anchor          |
| correct     | `0.52 0.10 155`               | verdict: correct                 |
| partial     | `0.58 0.13 70`                | verdict: partial                 |
| wrong       | `0.52 0.16 27`                | verdict: incorrect               |
| unsupported | `0.50 0.10 295`               | verdict: unsupported             |

| Type      | Family               | Use                          |
| --------- | -------------------- | ---------------------------- |
| Source Serif 4 | document body, headings, claim text | reading register |
| IBM Plex Sans  | UI chrome, buttons, sidebar headers | functional register |
| IBM Plex Mono  | phase labels, code, metadata        | machine register   |

Verdicts are **always** signalled with both color and a typographic mark (✓ ~ ✕ ?) so they remain accessible on monochrome / colour-blind contexts.

---

## Acceptance checklist

- [x] `npm install && npm run dev` launches the app on `127.0.0.1:5173`.
- [x] Central document renders; right sidebar renders; no left sidebar.
- [x] User can type into the Open-the-box textarea.
- [x] Submit calls `checkClaim` (and falls back to fixture in demo mode).
- [x] Claim cards render from the returned `ClaimReview`.
- [x] Revise opens an editable `RevisionBox` pre-filled with `suggested_revision`.
- [x] Accepting the revision → `MistakeRepairedBlock` appears, fossil + recall queued.
- [x] Sidebar shows the fossil and the three recall prompts.

---

## What was removed from the v0 prototype

- Tweaks panel, scripted edit-mode, and global `window.*` component registry.
- All hardcoded claim-card HTML — claims are now rendered from `ClaimReview.claims`.
- The single big `index.html` script bundle, replaced by a real Vite/TS module graph.
- Implicit "next button populates the wrong answer" magic is now in `App.next()` only as a demo affordance, gated behind the bottom rail; the real flow is user-typed.

---

## What's intentionally NOT in scope

No auth, no persistence, no Tiptap, no PDF editor, no embeddings, no agent orchestration. The demo is one document, one checkpoint, one repair loop — done well.
