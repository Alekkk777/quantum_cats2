import type { LearningTraceState } from '../types';

export const initialTrace: LearningTraceState = {
  concept: {
    id: 'reader-mcp',
    title: 'Reader tier and MCP access',
    sectionLabel: '§4.2',
    fragility: 'fragile',
    strength: 8,
    rationale:
      'Students confuse Reader and Resolver in 41% of explanations of this paragraph. You also dwelled on §4.2 for less than the model expected (12s) — a signal of fluent reading, shallow encoding.',
    signals: [
      'fragile-concept registry · §4.2 flagged',
      'dwell time below threshold',
      'no prior retrieval on this concept',
    ],
    heuristic: 'role-inversion',
  },
  claims: [],
  fossils: [],
  recall: [],
  events: [
    { id: 'e1', glyph: '·', tone: 'neutral', text: 'Session opened.', meta: '14:02 · agent-arch.pdf', at: new Date().toISOString() },
  ],
};
