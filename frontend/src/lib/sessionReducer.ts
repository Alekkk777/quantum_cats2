import type { StudySession, CheckpointState, ClaimReview, MistakeFossil, RecallItem, TraceEvent } from '../types';

export type SessionAction =
  | { type: 'start-session'; goal: StudySession['goal']; depth: StudySession['depth']; doc: string }
  | { type: 'set-answer'; checkpointId: string; answer: string }
  | { type: 'show-hint'; checkpointId: string }
  | { type: 'open-checkpoint'; checkpointId: string }
  | { type: 'submit-start'; checkpointId: string }
  | { type: 'submit-success'; checkpointId: string; review: ClaimReview }
  | { type: 'submit-error'; checkpointId: string; error: string }
  | { type: 'begin-revision'; checkpointId: string }
  | { type: 'apply-revision'; checkpointId: string; revisedAnswer: string }
  | { type: 'mark-repaired'; checkpointId: string }
  | { type: 'reset' };

const now = () => new Date().toISOString();
const nid = () => Math.random().toString(36).slice(2, 9);

function evt(partial: Omit<TraceEvent, 'id' | 'at'>): TraceEvent {
  return { id: nid(), at: now(), ...partial };
}

function patchCheckpoint(s: StudySession, id: string, patch: Partial<CheckpointState>): StudySession {
  const cp = s.checkpoints[id];
  if (!cp) return s;
  return { ...s, checkpoints: { ...s.checkpoints, [id]: { ...cp, ...patch } } };
}

function pushEvent(s: StudySession, e: TraceEvent): StudySession {
  // clear any existing `now` flag and append the new event
  const events = s.trace.events.map((x) => (x.now ? { ...x, now: false } : x)).concat(e);
  return { ...s, trace: { ...s.trace, events } };
}

export function sessionReducer(s: StudySession, a: SessionAction): StudySession {
  switch (a.type) {
    case 'start-session': {
      let next = { ...s, goal: a.goal, depth: a.depth };
      next = patchCheckpoint(next, 'reader-mcp', { phase: 'reading' });
      return pushEvent(next, evt({ glyph: '◇', tone: 'indigo', text: 'Route generated · 4 stops planned.', meta: '14:02', now: true }));
    }
    case 'set-answer':  return patchCheckpoint(s, a.checkpointId, { answer: a.answer });
    case 'show-hint':   return patchCheckpoint(s, a.checkpointId, { hintShown: true });
    case 'open-checkpoint': {
      const next = patchCheckpoint(s, a.checkpointId, { phase: 'open' });
      return pushEvent(next, evt({ glyph: '□', tone: 'indigo', text: 'Checkpoint inserted at §4.2 — fragile concept.', meta: '14:04', now: true }));
    }
    case 'submit-start':
      return patchCheckpoint(s, a.checkpointId, { loading: true, error: null });
    case 'submit-success': {
      let next = patchCheckpoint(s, a.checkpointId, {
        loading: false, error: null, phase: 'measuring', review: a.review,
      });
      next = { ...next, trace: { ...next.trace, claims: a.review.claims } };
      next = pushEvent(next, evt({ glyph: '◐', tone: 'indigo', text: `Answer submitted · ${a.review.claims.length} claims extracted.`, meta: '14:05', now: true }));
      const wrong = a.review.claims.find((c) => c.verdict === 'incorrect');
      if (wrong) next = pushEvent(next, evt({ glyph: '×', tone: 'red', text: `${wrong.label} detected: "${wrong.text}".`, meta: '14:05' }));
      return next;
    }
    case 'submit-error':
      return patchCheckpoint(s, a.checkpointId, { loading: false, error: a.error });
    case 'begin-revision': {
      const next = patchCheckpoint(s, a.checkpointId, { phase: 'revising' });
      return pushEvent(next, evt({ glyph: '✎', tone: 'indigo', text: 'Revising claim.', meta: '14:06', now: true }));
    }
    case 'apply-revision': {
      const next = patchCheckpoint(s, a.checkpointId, { revisedAnswer: a.revisedAnswer });
      return next; // mark-repaired follows immediately in the caller
    }
    case 'mark-repaired': {
      const cp = s.checkpoints[a.checkpointId];
      if (!cp || !cp.review) return s;
      const incorrect = cp.review.claims.find((c) => c.verdict === 'incorrect');
      const fossil: MistakeFossil | null = incorrect
        ? { id: nid(), claimId: incorrect.id, before: incorrect.text, after: cp.review.suggested_revision, rationale: incorrect.rationale, capturedAt: now(), sectionId: cp.sectionId }
        : null;
      const recall: RecallItem[] = [
        { id: nid(), prompt: 'Reader vs. Resolver — which one writes?', conceptId: cp.id, scheduledFor: '+ 2d', source: '§4.2' },
        { id: nid(), prompt: 'Why the Reader is denied MCP access.',    conceptId: cp.id, scheduledFor: '+ 6d', source: '§4.2' },
        { id: nid(), prompt: 'Prompt injection as exfiltration channel.', conceptId: cp.id, scheduledFor: '+14d', source: '§4.2' },
      ];
      const updatedClaims = cp.review.claims.map((c) =>
        c.verdict === 'incorrect' ? { ...c, verdict: 'correct' as const, text: 'Resolver writes final output (revised)', rationale: c.improvement ?? c.rationale, improvement: null }
                                  : c.verdict === 'partial' ? { ...c, verdict: 'correct' as const, text: 'Injection → exfiltration via tool call', improvement: null }
                                                            : c,
      );
      let next = patchCheckpoint(s, a.checkpointId, { phase: 'repaired' });
      next = {
        ...next,
        trace: {
          ...next.trace,
          concept: { ...next.trace.concept, strength: 78 },
          claims: updatedClaims,
          fossils: fossil ? [...next.trace.fossils, fossil] : next.trace.fossils,
          recall,
        },
      };
      next = pushEvent(next, evt({ glyph: '✓', tone: 'green', text: 'Mistake repaired — concept now observed.', meta: '14:06' }));
      next = pushEvent(next, evt({ glyph: '↻', tone: 'amber', text: 'Recall scheduled · 2d / 6d / 14d.', meta: '14:06', now: true }));
      return next;
    }
    case 'reset': return s; // App holds the original demoSession and re-seeds via useReducer init
    default: return s;
  }
}
