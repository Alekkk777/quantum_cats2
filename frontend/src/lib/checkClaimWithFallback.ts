import { checkClaim } from './api';
import type { ClaimReview } from '../types';
import readerMcpFixture from '../data/claimReviewReaderMcp.json';
import { DEMO_MODE } from '../config';

/**
 * Production-safe wrapper. In DEMO_MODE we still attempt the live call (so the
 * judge can see the network), but on any failure we transparently fall back
 * to the canned ClaimReview fixture so the demo never breaks. Outside demo
 * mode, errors propagate.
 */
export async function checkClaimWithFallback(input: {
  question: string;
  answer: string;
  context: string;
}): Promise<{ review: ClaimReview; usedFallback: boolean }> {
  try {
    const review = await checkClaim({ ...input, demo_mode: DEMO_MODE });
    return { review, usedFallback: false };
  } catch (err) {
    if (DEMO_MODE) {
      console.warn('[Schrodinger] /check-claim failed, using fixture.', err);
      return { review: readerMcpFixture as ClaimReview, usedFallback: true };
    }
    throw err;
  }
}
