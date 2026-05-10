import type { StudySession } from '../types';
import { initialTrace } from './initialTrace';
import { QUANTUM_CHECKPOINT_QUESTION } from './documentContent';

export const STUDENT_WRONG_ANSWER =
  'If locality holds, hidden variables can explain entanglement — realism and freedom are safe. EPR was right that quantum mechanics is incomplete.';

export const demoSession: StudySession = {
  id: 'sess-001',
  documentId: 'quantum-ent-ch2',
  documentTitle: "Quantum Mechanics, Ch. 2 — Bell's theorem",
  goal: 'exam',
  depth: 'rigorous',
  startedAt: new Date().toISOString(),
  trace: initialTrace,
  checkpoints: {
    'bell-inequality': {
      id: 'bell-inequality',
      sectionId: '2.3',
      question: QUANTUM_CHECKPOINT_QUESTION,
      answer: '',
      answerContext: null,
      hintShown: false,
      review: null,
      revisedAnswer: null,
      phase: 'reading',
      loading: false,
      error: null,
      usedFallback: false,
    },
  },
  activeCheckpointId: 'bell-inequality',
};
