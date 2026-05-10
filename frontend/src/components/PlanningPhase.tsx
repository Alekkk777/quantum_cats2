import { useEffect, useState } from 'react';
import { getPlanningQuestions, initPersona } from '../lib/api';
import type { PlanningQuestion } from '../lib/api';
import { Mascot } from './Mascot';

interface PlanningPhaseProps {
  onComplete: () => void;
}

export function PlanningPhase({ onComplete }: PlanningPhaseProps) {
  const [domande, setDomande] = useState<PlanningQuestion[]>([]);
  const [titolo, setTitolo] = useState('Impostazioni sessione...');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlanningQuestions()
      .then(res => {
        setDomande(res.domande);
        setTitolo(res.titolo_ui);
        const init: Record<string, string> = {};
        res.domande.forEach(d => { init[d.id] = d.opzioni[0]; });
        setAnswers(init);
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const allAnswered = domande.every(d => answers[d.id]);

  const submit = async () => {
    if (!allAnswered) return;
    setSaving(true);
    try {
      const q = domande;
      await initPersona({
        obiettivo: answers[q[0]?.id] ?? '',
        velocita: answers[q[1]?.id] ?? '',
        self_assessment: answers[q[2]?.id] ?? '',
      });
      onComplete();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-paper-2">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-[12px] text-indigo">Preparando le domande...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 backdrop-blur-md">
      <div
        className="w-[min(580px,92vw)] rounded-xl border border-rule bg-paper p-7 shadow-[0_30px_60px_oklch(0.20_0.01_270/0.18)]"
        style={{ animation: 'blockIn 320ms cubic-bezier(.2,.7,.2,1) both' }}
      >
        <div className="flex items-start gap-3 mb-5">
          <Mascot size={56} variant="full" />
          <div>
            <div className="label-mono text-indigo">Pianificazione</div>
            <h2 className="font-serif text-[24px] font-semibold tracking-[-0.015em] mt-1">{titolo}</h2>
            <p className="font-serif text-[14px] text-ink-2 leading-snug mt-1">
              Mentre il documento viene processato, dimmi come posso aiutarti meglio.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-wrong-edge bg-wrong-soft text-wrong text-[13px] font-mono">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {domande.map(d => (
            <div key={d.id} className="flex flex-col gap-1.5">
              <span className="label-mono">{d.testo}</span>
              <div className="flex flex-wrap gap-1.5">
                {d.opzioni.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setAnswers(a => ({ ...a, [d.id]: opt }))}
                    className={`px-3 py-1.5 rounded-md border text-[13px] text-left transition-colors ${
                      answers[d.id] === opt
                        ? 'border-indigo bg-indigo-soft text-indigo font-semibold'
                        : 'border-rule bg-paper text-ink-2 hover:border-ink-4 hover:text-ink'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-rule">
          <span className="font-serif italic text-[13px] text-ink-3">
            Il tuo profilo cognitivo guiderà le mutazioni del documento.
          </span>
          <button
            className="btn btn-indigo"
            onClick={submit}
            disabled={!allAnswered || saving}
          >
            {saving ? 'Salvataggio...' : 'Inizia lo studio →'}
          </button>
        </div>
      </div>
    </div>
  );
}
