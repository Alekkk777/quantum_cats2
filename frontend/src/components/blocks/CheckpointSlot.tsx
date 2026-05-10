import { OpenTheBoxBlock } from './OpenTheBoxBlock';
import { ClaimMeasurementBlock } from './ClaimMeasurementBlock';
import { MistakeRepairedBlock } from './MistakeRepairedBlock';
import { RecallScheduledBlock } from './RecallScheduledBlock';
import type { StudySession } from '../../types';
import type { SessionAction } from '../../lib/sessionReducer';

interface CheckpointSlotProps {
  checkpointId: string;
  session: StudySession;
  dispatch: (a: SessionAction) => void;
  onSubmitAnswer: (id: string) => void;
  onApplyRevision: (id: string) => void;
}

export function CheckpointSlot({ checkpointId, session, dispatch, onSubmitAnswer, onApplyRevision }: CheckpointSlotProps) {
  const cp = session.checkpoints[checkpointId];
  if (!cp || cp.phase === 'reading') return null;

  if (cp.phase === 'open') {
    return (
      <OpenTheBoxBlock
        question={cp.question}
        answer={cp.answer}
        hintShown={cp.hintShown}
        loading={cp.loading}
        error={cp.error}
        onAnswerChange={(s) => dispatch({ type: 'set-answer', checkpointId, answer: s })}
        onSubmit={() => onSubmitAnswer(checkpointId)}
        onHint={() => dispatch({ type: 'show-hint', checkpointId })}
        onSkip={() => dispatch({ type: 'open-checkpoint', checkpointId })}
      />
    );
  }

  if ((cp.phase === 'measuring' || cp.phase === 'revising') && cp.review) {
    return (
      <ClaimMeasurementBlock
        review={cp.review}
        studentAnswer={cp.answer}
        isRevising={cp.phase === 'revising'}
        onAccept={() => dispatch({ type: 'mark-repaired', checkpointId })}
        onChallenge={() => { /* logged in component */ }}
        onBeginRevision={() => dispatch({ type: 'begin-revision', checkpointId })}
        onSubmitRevision={(revisedAnswer) => {
          dispatch({ type: 'apply-revision', checkpointId, revisedAnswer });
          onApplyRevision(checkpointId);
        }}
      />
    );
  }

  if (cp.phase === 'repaired' && cp.review) {
    const incorrect = cp.review.claims.find((c) => c.verdict === 'incorrect');
    return (
      <>
        <MistakeRepairedBlock
          before={incorrect?.text ?? cp.answer}
          after={cp.revisedAnswer ?? cp.review.suggested_revision}
        />
        <RecallScheduledBlock
          recall={session.trace.recall}
          prompt={cp.review.next_retrieval_prompt}
          onContinue={() => { /* end of demo path */ }}
        />
      </>
    );
  }

  return null;
}
