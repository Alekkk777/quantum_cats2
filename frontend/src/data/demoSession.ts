import type { StudySession } from '../types';
import { initialTrace } from './initialTrace';
import { READER_MCP_QUESTION } from './documentContent';

export const STUDENT_WRONG_ANSWER =
  'The Reader must not have MCP access because it writes the final output, so it could leak data.';

export const demoSession: StudySession = {
  id: 'sess-001',
  documentId: 'agent-arch-ch4',
  documentTitle: 'Agent Architectures, Ch. 4',
  goal: 'exam',
  depth: 'rigorous',
  startedAt: new Date().toISOString(),
  trace: initialTrace,
  checkpoints: {
    'reader-mcp': {
      id: 'reader-mcp',
      sectionId: '4.2',
      question: READER_MCP_QUESTION,
      answer: '',
      hintShown: false,
      review: null,
      revisedAnswer: null,
      phase: 'reading',
      loading: false,
      error: null,
    },
  },
  activeCheckpointId: 'reader-mcp',
};
