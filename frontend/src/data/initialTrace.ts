import type { LearningTraceState } from '../types';

export const initialTrace: LearningTraceState = {
  concept: {
    id: 'reader-mcp',
    title: 'Reader tier and MCP access',
    sectionLabel: '4.2',
    fragility: 'fragile',
    strength: 8,
    rationale:
      'Students confuse Reader and Resolver in 41% of explanations of this paragraph. You also moved through section 4.2 quickly, which can signal fluent reading with shallow encoding.',
    signals: [
      'fragile-concept registry / section 4.2 flagged',
      'dwell time below threshold',
      'no prior retrieval on this concept',
    ],
    heuristic: 'role-inversion',
  },
  claims: [],
  fossils: [],
  recall: [],
  events: [
    { id: 'e1', glyph: '-', tone: 'neutral', text: 'Session opened.', meta: 'agent-arch.pdf', at: new Date().toISOString() },
  ],
};
