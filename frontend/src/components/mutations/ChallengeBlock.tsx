import { useState } from 'react';
import { checkClaimWithFallback } from '../../lib/checkClaimWithFallback';
import type { Mutazione } from '../../lib/api';
import type { Claim, ClaimReview } from '../../types';
import { ClaimMeasurementBlock } from '../blocks/ClaimMeasurementBlock';
import { OpenTheBoxBlock } from '../blocks/OpenTheBoxBlock';

const TRANSCRIBED_ANSWER_CONTEXT =
  'This answer includes speech-to-text transcription. Treat odd wording, homophones, punctuation, and small word substitutions as possible transcription artifacts. Judge the student conceptually against the source, and do not over-penalize wording unless it changes the meaning.';

interface ChallengeBlockProps {
  mutazione: Mutazione;
  context: string;
  onAnswer: (esito: 'superato' | 'fallito') => void;
  onClaimReview: (review: ClaimReview, usedFallback: boolean) => void;
  onClaimRepair: (review: ClaimReview, revisedAnswer: string) => void;
  onChallengeRecorded: (claim: Claim, note: string) => void;
}

export function ChallengeBlock({
  mutazione,
  context,
  onAnswer,
  onClaimReview,
  onClaimRepair,
  onChallengeRecorded,
}: ChallengeBlockProps) {
  const [answer, setAnswer] = useState('');
  const [answerContext, setAnswerContext] = useState<string | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ClaimReview | null>(null);
  const [isRevising, setIsRevising] = useState(false);
  const [repaired, setRepaired] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const submit = async () => {
    if (!answer.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await checkClaimWithFallback({
        question: mutazione.contenuto,
        answer,
        context,
        answerContext,
      });
      setReview(result.review);
      setUsedFallback(result.usedFallback);
      onClaimReview(result.review, result.usedFallback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim measurement failed.');
    } finally {
      setLoading(false);
    }
  };

  const weakClaimCount =
    review?.claims.filter((claim) =>
      claim.verdict === 'incorrect' ||
      claim.verdict === 'unsupported' ||
      claim.verdict === 'partial',
    ).length ?? 0;

  const finish = (esito: 'superato' | 'fallito') => {
    setRepaired(true);
    onAnswer(esito);
  };

  if (repaired) {
    return (
      <div className="my-4 p-3 rounded border border-rule bg-paper-2 font-serif text-[14px] text-ink-2">
        Measurement recorded. The answer stays available for revision and recall.
      </div>
    );
  }

  if (review) {
    return (
      <div className="my-4">
        <ClaimMeasurementBlock
          review={review}
          studentAnswer={answer}
          isRevising={isRevising}
          onAccept={() => finish(weakClaimCount > 0 ? 'fallito' : 'superato')}
          onChallenge={onChallengeRecorded}
          onBeginRevision={() => setIsRevising(true)}
          onSubmitRevision={(revisedAnswer) => {
            setAnswer(revisedAnswer);
            onClaimRepair(review, revisedAnswer);
            finish('superato');
          }}
        />
        {usedFallback && (
          <div className="mt-2 font-mono text-[10.5px] text-ink-3 tracking-[0.04em]">
            demo fallback
          </div>
        )}
      </div>
    );
  }

  return (
    <OpenTheBoxBlock
      question={mutazione.contenuto}
      answer={answer}
      hintShown={hintShown}
      loading={loading}
      error={error}
      onAnswerChange={setAnswer}
      onVoiceTranscript={(transcript) => {
        setAnswer((current) => current.trim() ? `${current.trimEnd()}\n\n${transcript}` : transcript);
        setAnswerContext(TRANSCRIBED_ANSWER_CONTEXT);
      }}
      onSubmit={submit}
      onHint={() => setHintShown(true)}
      onSkip={() => finish('fallito')}
    />
  );
}
