import type { LearningTraceState } from '../types';

export const initialTrace: LearningTraceState = {
  concept: {
    id: 'bell-inequality',
    title: "Bell's theorem and the three assumptions",
    sectionLabel: '2.3',
    fragility: 'fragile',
    strength: 8,
    rationale:
      "Students confuse 'local hidden variables solve entanglement' with the actual conclusion in 54% of explanations of this section. Bell's theorem is frequently misread as allowing local realism.",
    signals: [
      'fragile-concept registry / section 2.3 flagged',
      'dwell time below threshold',
      'no prior retrieval on this concept',
    ],
    heuristic: 'role-inversion',
  },
  claims: [],
  fossils: [],
  recall: [],
  events: [
    { id: 'e1', glyph: '-', tone: 'neutral', text: 'Session opened.', meta: 'quantum-mechanics.pdf', at: new Date().toISOString() },
  ],
};
