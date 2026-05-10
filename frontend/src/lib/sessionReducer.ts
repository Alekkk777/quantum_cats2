import type { StudySession, CheckpointState, ClaimReview, MistakeFossil, RecallItem, TraceEvent } from '../types';

export type SessionAction =
  | { type: 'start-session'; goal: StudySession['goal']; depth: StudySession['depth']; doc: string }
  | { type: 'set-answer'; checkpointId: string; answer: string; answerContext?: string | null }
  | { type: 'show-hint'; checkpointId: string }
  | { type: 'open-checkpoint'; checkpointId: string }
  | { type: 'submit-start'; checkpointId: string }
  | { type: 'submit-success'; checkpointId: string; review: ClaimReview; usedFallback?: boolean }
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
  const events = s.trace.events.map((x) => (x.now ? { ...x, now: false } : x)).concat(e);
  return { ...s, trace: { ...s.trace, events } };
}

const isRepairable = (verdict: string) => verdict === 'incorrect' || verdict === 'partial';

export function sessionReducer(s: StudySession, a: SessionAction): StudySession {
  switch (a.type) {
    case 'start-session': {
      let next = { ...s, goal: a.goal, depth: a.depth };
      next = patchCheckpoint(next, 'bell-inequality', { phase: 'reading' });
      return pushEvent(next, evt({ glyph: '*', tone: 'indigo', text: 'Route generated - 4 stops planned.', meta: '14:02', now: true }));
    }
    case 'set-answer':
      return patchCheckpoint(s, a.checkpointId, {
        answer: a.answer,
        ...(a.answerContext !== undefined ? { answerContext: a.answerContext } : {}),
      });
    case 'show-hint':
      return patchCheckpoint(s, a.checkpointId, { hintShown: true });
    case 'open-checkpoint': {
      const next = patchCheckpoint(s, a.checkpointId, { phase: 'open' });
      return pushEvent(next, evt({ glyph: '[]', tone: 'indigo', text: 'Checkpoint inserted at section 2.3 - fragile concept.', meta: '14:04', now: true }));
    }
    case 'submit-start':
      return patchCheckpoint(s, a.checkpointId, { loading: true, error: null, usedFallback: false });
    case 'submit-success': {
      let next = patchCheckpoint(s, a.checkpointId, {
        loading: false,
        error: null,
        phase: 'measuring',
        review: a.review,
        usedFallback: Boolean(a.usedFallback),
      });
      next = { ...next, trace: { ...next.trace, claims: a.review.claims } };
      next = pushEvent(next, evt({
        glyph: 'o',
        tone: 'indigo',
        text: `Answer submitted - ${a.review.claims.length} claims extracted.`,
        meta: a.usedFallback ? 'demo fallback' : '14:05',
        now: true,
      }));
      const weakClaim = a.review.claims.find((c) => c.verdict === 'incorrect' || (c.verdict === 'partial' && c.severity === 'major'));
      if (weakClaim) {
        next = pushEvent(next, evt({ glyph: 'x', tone: 'red', text: `${weakClaim.label} detected: "${weakClaim.text}".`, meta: '14:05' }));
      }
      return next;
    }
    case 'submit-error':
      return patchCheckpoint(s, a.checkpointId, { loading: false, error: a.error });
    case 'begin-revision': {
      const next = patchCheckpoint(s, a.checkpointId, { phase: 'revising' });
      return pushEvent(next, evt({ glyph: 'edit', tone: 'indigo', text: 'Revising claim.', meta: '14:06', now: true }));
    }
    case 'apply-revision':
      return patchCheckpoint(s, a.checkpointId, { revisedAnswer: a.revisedAnswer });
    case 'mark-repaired': {
      const cp = s.checkpoints[a.checkpointId];
      if (!cp || !cp.review) return s;

      const repairableClaims = cp.review.claims.filter((c) => isRepairable(c.verdict));
      const fossilClaims = repairableClaims.filter((c) => c.severity === 'major');
      const claimsToFossil = fossilClaims.length > 0 ? fossilClaims : repairableClaims.slice(0, 1);
      const fossils: MistakeFossil[] = claimsToFossil.map((claim) => ({
        id: nid(),
        claimId: claim.id,
        before: claim.text,
        after: cp.revisedAnswer ?? claim.improvement ?? cp.review!.suggested_revision,
        rationale: claim.rationale,
        capturedAt: now(),
        sectionId: cp.sectionId,
      }));

      const recall: RecallItem[] = [
        { id: nid(), prompt: cp.review.next_retrieval_prompt, conceptId: cp.id, scheduledFor: '+2d', source: cp.sectionId },
        { id: nid(), prompt: "Which of the three assumptions must be abandoned if locality is confirmed?", conceptId: cp.id, scheduledFor: '+6d', source: cp.sectionId },
        { id: nid(), prompt: "What does Bell's inequality bound, and what do loophole-free experiments show?", conceptId: cp.id, scheduledFor: '+14d', source: cp.sectionId },
      ];

      const updatedClaims = cp.review.claims.map((c) =>
        isRepairable(c.verdict)
          ? { ...c, verdict: 'correct' as const, text: c.improvement ?? c.text, rationale: c.improvement ?? c.rationale, improvement: null }
          : c,
      );

      let next = patchCheckpoint(s, a.checkpointId, { phase: 'repaired' });
      next = {
        ...next,
        trace: {
          ...next.trace,
          concept: { ...next.trace.concept, strength: 78 },
          claims: updatedClaims,
          fossils: fossils.length > 0 ? [...next.trace.fossils, ...fossils] : next.trace.fossils,
          recall,
        },
      };
      next = pushEvent(next, evt({ glyph: 'ok', tone: 'green', text: 'Mistake repaired - concept now observed.', meta: '14:06' }));
      next = pushEvent(next, evt({ glyph: 'r', tone: 'amber', text: 'Recall scheduled from the measured answer.', meta: '14:06', now: true }));
      return next;
    }
    case 'reset':
      return s;
    default:
      return s;
  }
}
