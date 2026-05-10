import { useState } from 'react';

interface ClozeWordProps {
  target: string;
  contenuto: string;
  onAnswer: (esito: 'superato' | 'fallito') => void;
}

export function ClozeWord({ target, contenuto, onAnswer }: ClozeWordProps) {
  const [revealed, setRevealed] = useState(false);
  const [answered, setAnswered] = useState(false);

  const reveal = (esito: 'superato' | 'fallito') => {
    if (answered) return;
    setRevealed(true);
    setAnswered(true);
    onAnswer(esito);
  };

  if (revealed) {
    return (
      <mark className="bg-correct-soft text-correct font-semibold px-1 rounded-sm border border-correct-edge">
        {target}
      </mark>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        onClick={() => reveal('superato')}
        className="inline-block px-2 py-0.5 rounded border border-indigo bg-indigo-soft text-indigo font-mono text-[0.82em] tracking-widest hover:bg-indigo hover:text-paper transition-colors"
        title={contenuto}
      >
        ___
      </button>
      <button
        onClick={() => reveal('fallito')}
        className="inline-block text-[10px] text-ink-4 hover:text-ink-2 transition-colors"
        title="Mostra risposta"
      >
        mostra
      </button>
    </span>
  );
}
