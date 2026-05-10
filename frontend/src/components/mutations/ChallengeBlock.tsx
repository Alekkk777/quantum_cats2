import { useState } from 'react';
import type { Mutazione } from '../../lib/api';

interface ChallengeBlockProps {
  mutazione: Mutazione;
  onAnswer: (esito: 'superato' | 'fallito') => void;
}

export function ChallengeBlock({ mutazione, onAnswer }: ChallengeBlockProps) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [selfGrade, setSelfGrade] = useState<'superato' | 'fallito' | null>(null);

  const submit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
  };

  const grade = (esito: 'superato' | 'fallito') => {
    setSelfGrade(esito);
    onAnswer(esito);
  };

  return (
    <div
      className="my-4 p-4 rounded-lg border border-amber-edge bg-amber-soft"
      style={{ animation: 'blockIn 220ms cubic-bezier(.2,.7,.2,1) both' }}
    >
      <div className="label-mono text-amber mb-2">⚡ Domanda di applicazione</div>
      <p className="font-serif text-[15px] text-ink mb-3">{mutazione.contenuto}</p>

      {!submitted ? (
        <div className="flex flex-col gap-2">
          <textarea
            className="answer-box min-h-[72px]"
            placeholder="Scrivi la tua risposta..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
          />
          <div className="flex justify-end">
            <button className="btn btn-indigo" onClick={submit} disabled={!answer.trim()}>
              Verifica →
            </button>
          </div>
        </div>
      ) : selfGrade === null ? (
        <div>
          <div className="p-3 rounded border border-rule bg-paper text-[14px] font-serif text-ink mb-3 whitespace-pre-wrap">
            {answer}
          </div>
          <p className="text-[13px] text-ink-3 mb-2">Come ti sei trovato?</p>
          <div className="flex gap-2">
            <button className="btn border-correct text-correct hover:bg-correct-soft" onClick={() => grade('superato')}>
              ✓ Corretto
            </button>
            <button className="btn border-wrong text-wrong hover:bg-wrong-soft" onClick={() => grade('fallito')}>
              ✗ Da rivedere
            </button>
          </div>
        </div>
      ) : (
        <div className={`p-3 rounded border text-[14px] font-serif ${selfGrade === 'superato' ? 'border-correct-edge bg-correct-soft text-correct' : 'border-wrong-edge bg-wrong-soft text-wrong'}`}>
          {selfGrade === 'superato' ? '✓ Ottimo! Concetto acquisito.' : '✗ Aggiunto alle lacune — ripasseremo.'}
        </div>
      )}
    </div>
  );
}
