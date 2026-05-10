import type { ClaimReview } from '../types';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://127.0.0.1:8000';

class ApiError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new ApiError(`${path} → ${res.status}`, res.status);
  return (await res.json()) as T;
}

// ── Quantum Cats / Schrodinger demo endpoints ──────────────────────────────

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
  demo_mode?: boolean;
}): Promise<ClaimReview> {
  return request('/check-claim', {
    method: 'POST',
    body: JSON.stringify({ demo_mode: false, ...input }),
  });
}

// ── Braynr PACRAR endpoints ────────────────────────────────────────────────

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
  const res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new ApiError(`/api/upload → ${res.status}`, res.status);
  return res.json();
}

export async function getPlanningQuestions(): Promise<PlanningResponse> {
  return request('/api/planning');
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

export { ApiError };
