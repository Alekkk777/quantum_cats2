import { checkClaim } from './api';
import type { ClaimReview } from '../types';
import quantumFixture from '../data/claimReviewQuantum.json';
import { DEMO_MODE } from '../config';

export async function checkClaimWithFallback(input: {
  question: string;
  answer: string;
  context: string;
  demoMode?: boolean;
  answerContext?: string | null;
}): Promise<{ review: ClaimReview; usedFallback: boolean }> {
  try {
    const review = await checkClaim({
      question: input.question,
      answer: input.answer,
      context: input.context,
      demoMode: input.demoMode ?? DEMO_MODE,
      answerContext: input.answerContext,
    });
    return { review, usedFallback: false };
  } catch (err) {
    console.warn('[Shrodinger] /check-claim failed; using fixture fallback.', err);
    return { review: quantumFixture as ClaimReview, usedFallback: true };
  }
}
