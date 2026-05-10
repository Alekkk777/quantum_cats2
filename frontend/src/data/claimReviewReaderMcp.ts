// Demo fixture — the exact shape returned by POST /check-claim for the
// Reader/MCP example in the brief. Used when the backend is unavailable
// (DEMO_MODE) so the hackathon demo always renders.

import type { ClaimReview } from '../types';

export const claimReviewReaderMcp: ClaimReview = {
  review_title: 'Reader tier and MCP access',
  summary:
    '3 claims extracted. Two are consistent with §4.2; one inverts the role of Reader and Resolver.',
  original_answer:
    'The Reader must not have MCP access because it writes the final output, so it could leak data.',
  claims: [
    {
      id: 'c1',
      text: 'The Reader must not have MCP access.',
      verdict: 'correct',
      label: 'Reader denied MCP access',
      rationale:
        'Matches §4.2: the Reader tier is explicitly denied tool access at the policy boundary because its inputs are untrusted.',
      improvement: null,
      source_span: { section_id: '4.2', quote: 'The Reader is intentionally denied MCP tool access.' },
      severity: 'minor',
    },
    {
      id: 'c2',
      text: 'The Reader writes the final output.',
      verdict: 'incorrect',
      label: 'Role inverted: Reader vs. Resolver',
      rationale:
        'The Resolver writes final outputs. The Reader only ingests and structures untrusted documents — it has no write surface to the user.',
      improvement:
        'The Resolver, not the Reader, writes final outputs. The Reader is read-only against untrusted input.',
      source_span: { section_id: '4.4', quote: 'The user-visible answer is always written by the Resolver.' },
      severity: 'major',
    },
    {
      id: 'c3',
      text: 'The Reader could leak data if it had MCP access.',
      verdict: 'partial',
      label: 'Mechanism vague',
      rationale:
        'True in spirit, vague in mechanism. The risk is specific: if the Reader had MCP access, prompt injection inside an untrusted document could make it call external tools or exfiltrate data.',
      improvement:
        'If the Reader held MCP access, prompt-injection payloads in untrusted documents could trigger tool calls and exfiltrate data — that is the exfiltration channel §4.2 closes.',
      source_span: { section_id: '4.2', quote: 'an injected instruction could become an external action' },
      severity: 'minor',
    },
  ],
  missing_ideas: [
    'Splitting capabilities beats hardening a single model.',
    'The trust boundary lives between Reader and Planner, not inside the Reader.',
  ],
  suggested_revision:
    'The Reader is denied MCP access because it reads untrusted documents. If it had MCP access, prompt injection could make it call external systems or exfiltrate data. The Resolver, not the Reader, writes final outputs.',
  next_retrieval_prompt:
    'In two days: which tier writes the user-visible output, and why is that tier kept away from untrusted input?',
};
