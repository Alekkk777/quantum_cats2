import type { ClaimReview, TextAnchor, ConceptLink, ChallengeClaimResponse, DebateEntry } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const detail = body ? `: ${body.slice(0, 180)}` : '';
    throw new ApiError(`${path} failed with ${res.status}${detail}`, res.status);
  }

  return (await res.json()) as T;
}

export async function healthCheck(): Promise<{ ok: boolean }> {
  return request('/health');
}

export async function generateQuestion(input: {
  topic: string;
  context: string;
}): Promise<{ question: string }> {
  return request('/generate-question', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function checkClaim(input: {
  question: string;
  answer: string;
  context: string;
  demoMode?: boolean;
  answerContext?: string | null;
}): Promise<ClaimReview> {
  return request('/check-claim', {
    method: 'POST',
    body: JSON.stringify({
      question: input.question,
      answer: input.answer,
      context: input.context,
      demo_mode: input.demoMode ?? false,
      answer_context: input.answerContext ?? null,
    }),
  });
}

export async function transcribeAudio(file: Blob): Promise<{
  text: string;
  language_code: string | null;
}> {
  const form = new FormData();
  form.append('file', file, 'voice-explanation.webm');

  const res = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const detail = body ? `: ${body.slice(0, 180)}` : '';
    throw new ApiError(`/transcribe failed with ${res.status}${detail}`, res.status);
  }

  return (await res.json()) as { text: string; language_code: string | null };
}

export interface PlanningQuestion {
  id: string;
  testo: string;
  opzioni: string[];
}

export interface PlanningResponse {
  fase: string;
  titolo_ui: string;
  domande: PlanningQuestion[];
}

const fallbackPlanning: PlanningResponse = {
  fase: 'Planning',
  titolo_ui: 'Set up your study session',
  domande: [
    {
      id: 'q1_goal',
      testo: 'What is your goal with this document?',
      opzioni: ['Review for an exam', 'First exploratory read', 'Look up specific concepts'],
    },
    {
      id: 'q2_time',
      testo: 'How much time do you have today?',
      opzioni: ['Short - I am in a hurry', 'Enough - 30 to 60 minutes', 'Plenty - I want to go deep'],
    },
    {
      id: 'q3_background',
      testo: 'How much background do you already have?',
      opzioni: ['Starting from scratch', 'I have some background', 'I am confident - challenge me'],
    },
  ],
};

function normalizePlanningResponse(raw: unknown): PlanningResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const rawQuestions = Array.isArray(data.domande)
    ? data.domande
    : Array.isArray(data.questions)
      ? data.questions
      : [];

  const domande = rawQuestions.map((item, index) => {
    const q = (item ?? {}) as Record<string, unknown>;
    const options = Array.isArray(q.opzioni)
      ? q.opzioni
      : Array.isArray(q.options)
        ? q.options
        : [];

    return {
      id: String(q.id ?? `q${index + 1}`),
      testo: String(q.testo ?? q.text ?? q.label ?? fallbackPlanning.domande[index]?.testo ?? 'Choose one option'),
      opzioni: options.map(String).filter(Boolean),
    };
  }).filter((q) => q.opzioni.length > 0);

  return {
    fase: String(data.fase ?? data.phase ?? fallbackPlanning.fase),
    titolo_ui: String(data.titolo_ui ?? data.title ?? fallbackPlanning.titolo_ui),
    domande: domande.length > 0 ? domande : fallbackPlanning.domande,
  };
}

export interface Mutazione {
  fase_pacrar: string;
  tipo_ui: 'cloze' | 'insight' | 'domanda_inline' | 'confronto';
  target: string;
  contenuto: string;
}

export interface StudyModeResponse {
  testo_originale: string;
  mutazioni_attive: Mutazione[];
  stato_grafo: {
    acquisiti: string[];
    in_corso: string[];
    lacune: string[];
  };
}

export interface UserBrainState {
  acquisiti: string[];
  in_corso: string[];
  lacune: string[];
}

export async function uploadDocument(file: File): Promise<{ status: string; message: string; sezioni: string[] }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new ApiError(`/api/upload failed with ${res.status}`, res.status);
  return res.json();
}

export async function getPlanningQuestions(): Promise<PlanningResponse> {
  try {
    return normalizePlanningResponse(await request<unknown>('/api/planning'));
  } catch (err) {
    console.warn('[Shrodinger] /api/planning failed; using local planning fallback.', err);
    return fallbackPlanning;
  }
}

export async function initPersona(data: {
  obiettivo: string;
  velocita: string;
  self_assessment: string;
}): Promise<{ status: string; profilo: unknown }> {
  return request('/api/init-persona', { method: 'POST', body: JSON.stringify(data) });
}

export async function getSections(): Promise<{ sezioni: string[] }> {
  return request('/api/sections');
}

export async function getStudyMode(sezione_id: string): Promise<StudyModeResponse> {
  return request('/api/study-mode', { method: 'POST', body: JSON.stringify({ sezione_id }) });
}

export async function recordInteraction(data: {
  concetto_target: string;
  esito: 'superato' | 'fallito';
  sezione_attuale_id: string;
}): Promise<{ status: string; nuovo_stato: UserBrainState; mutazioni_conseguenti: Mutazione[] }> {
  return request('/api/interact', { method: 'POST', body: JSON.stringify(data) });
}

export async function challengeClaim(input: {
  claimText: string;
  claimVerdict: string;
  studentChallenge: string;
  originalQuestion: string;
  context: string;
  history: DebateEntry[];
  demoMode?: boolean;
}): Promise<ChallengeClaimResponse> {
  return request('/challenge-claim', {
    method: 'POST',
    body: JSON.stringify({
      claim_text: input.claimText,
      claim_verdict: input.claimVerdict,
      student_challenge: input.studentChallenge,
      original_question: input.originalQuestion,
      context: input.context,
      history: input.history,
      demo_mode: input.demoMode ?? false,
    }),
  });
}

export async function generateTextAnchors(input: {
  documentId: string;
  selectedTopics?: string[];
  documentExcerpt: string;
  demoMode?: boolean;
}): Promise<{ anchors: TextAnchor[] }> {
  return request('/generate-text-anchors', {
    method: 'POST',
    body: JSON.stringify({
      document_id: input.documentId,
      selected_topics: input.selectedTopics ?? [],
      document_excerpt: input.documentExcerpt,
      demo_mode: input.demoMode ?? false,
    }),
  });
}

export async function generateConceptLinks(input: {
  documentId: string;
  selectedTopics?: string[];
  documentExcerpt: string;
  learnerTraceSummary?: string | null;
  demoMode?: boolean;
}): Promise<{ links: ConceptLink[] }> {
  return request('/generate-concept-links', {
    method: 'POST',
    body: JSON.stringify({
      document_id: input.documentId,
      selected_topics: input.selectedTopics ?? [],
      document_excerpt: input.documentExcerpt,
      learner_trace_summary: input.learnerTraceSummary ?? null,
      demo_mode: input.demoMode ?? false,
    }),
  });
}

export { ApiError };
