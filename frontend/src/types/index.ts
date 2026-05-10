// ── Domain types ──────────────────────────────────────────────────────────
export type Verdict = 'correct' | 'partial' | 'incorrect' | 'unsupported';
export type Severity = 'minor' | 'major';

export interface SourceSpan {
  section_id: string;
  quote: string;
}

export interface Claim {
  id: string;
  text: string;
  verdict: Verdict;
  label: string;
  rationale: string;
  improvement: string | null;
  source_span: SourceSpan | null;
  severity: Severity;
}

export interface ClaimReview {
  review_title: string;
  summary: string;
  original_answer: string;
  claims: Claim[];
  missing_ideas: string[];
  suggested_revision: string;
  next_retrieval_prompt: string;
}

// ── Session / UI state ────────────────────────────────────────────────────
export type CheckpointPhase =
  | 'setup'
  | 'reading'
  | 'open'
  | 'measuring'
  | 'revising'
  | 'repaired';

export interface CheckpointState {
  id: string;
  sectionId: string;
  question: string;
  answer: string;
  answerContext: string | null;
  hintShown: boolean;
  review: ClaimReview | null;
  revisedAnswer: string | null;
  phase: CheckpointPhase;
  loading: boolean;
  error: string | null;
  usedFallback: boolean;
}

export interface MistakeFossil {
  id: string;
  claimId: string;
  before: string;
  after: string;
  rationale: string;
  capturedAt: string; // ISO
  sectionId: string;
}

export interface RecallItem {
  id: string;
  prompt: string;
  conceptId: string;
  scheduledFor: string; // ISO or "+2d"
  source: string;
}

export interface TraceEvent {
  id: string;
  glyph: string;       // typographic marker
  tone: 'neutral' | 'indigo' | 'amber' | 'green' | 'red';
  text: string;
  meta: string;
  at: string;          // ISO
  now?: boolean;
}

export interface ConceptSnapshot {
  id: string;
  title: string;
  sectionLabel: string;       // e.g. "§4.2"
  fragility: 'fragile' | 'stable';
  strength: number;            // 0-100; "unobserved → observed"
  rationale: string;           // why intervened
  signals: string[];           // bullet signals
  heuristic: string;           // e.g. "role-inversion"
}

export interface LearningTraceState {
  concept: ConceptSnapshot;
  claims: Claim[];
  fossils: MistakeFossil[];
  recall: RecallItem[];
  events: TraceEvent[];
}

export interface StudySession {
  id: string;
  documentId: string;
  documentTitle: string;
  goal: 'exam' | 'build' | 'teach' | 'curio';
  depth: 'light' | 'rigorous' | 'oral';
  startedAt: string;
  trace: LearningTraceState;
  checkpoints: Record<string, CheckpointState>;
  activeCheckpointId: string | null;
}

// ── Augmentation types ────────────────────────────────────────────────────
export type AnchorKind =
  | 'definition'
  | 'formula'
  | 'warning'
  | 'context'
  | 'assumption'
  | 'example';

export type AugmentationPriority = 'low' | 'medium' | 'high';

export type ConceptRelation =
  | 'prerequisite'
  | 'contrast'
  | 'causes'
  | 'supports'
  | 'example_of'
  | 'often_confused_with'
  | 'applies_to';

export interface TextAnchor {
  id: string;
  anchor_id: string;       // matches sectionId in DocNode
  topic: string;
  kind: AnchorKind;
  label: string;
  body: string;
  source_quote: string;
  priority: AugmentationPriority;
  collapsed_by_default: boolean;
}

export interface ConceptLink {
  id: string;
  from_concept: string;
  to_concept: string;
  relation: ConceptRelation;
  anchor_id: string;       // matches sectionId in DocNode
  label: string;
  explanation: string;
  source_quote: string;
  priority: AugmentationPriority;
  collapsed_by_default: boolean;
}

// ── Challenge debate ──────────────────────────────────────────────────────
export interface DebateEntry {
  role: 'student' | 'shrodinger';
  text: string;
}

export interface ChallengeClaimResponse {
  response: string;
  stance: 'affirm' | 'concede' | 'partial_concede';
}
