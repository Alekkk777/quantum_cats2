import { challengeClaim } from './api';
import type { ChallengeClaimResponse, DebateEntry } from '../types';
import { DEMO_MODE } from '../config';

const DEMO_RESPONSE: ChallengeClaimResponse = {
  response:
    "I understand your challenge, but consider: Bell's inequality establishes a mathematical bound that locality and realism together require — neither alone. The experimental violations exceed this bound by a factor that rules out all local realistic models. Which specific step of Bell's derivation do you think fails?",
  stance: 'affirm',
};

export async function challengeClaimWithFallback(input: {
  claimText: string;
  claimVerdict: string;
  studentChallenge: string;
  originalQuestion: string;
  context: string;
  history: DebateEntry[];
}): Promise<ChallengeClaimResponse> {
  try {
    return await challengeClaim({
      ...input,
      demoMode: DEMO_MODE,
    });
  } catch (err) {
    console.warn('[Shrodinger] /challenge-claim failed; using fixture fallback.', err);
    return DEMO_RESPONSE;
  }
}
