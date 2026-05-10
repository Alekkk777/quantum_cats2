import { useEffect, useRef } from 'react';
import { PhaseHead } from './PhaseHead';
import { BoxGlyph } from '../Mascot';

interface OpenTheBoxBlockProps {
  question: string;
  answer: string;
  hintShown: boolean;
  loading: boolean;
  error: string | null;
  onAnswerChange: (s: string) => void;
  onSubmit: () => void;
  onHint: () => void;
  onSkip: () => void;
}

export function OpenTheBoxBlock(p: OpenTheBoxBlockProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const canSubmit = !!p.answer.trim() && !p.loading;

  return (
    <div
      className="block-card border-indigo-edge"
      style={{
        boxShadow: 'inset 3px 0 0 oklch(0.55 0.14 280)',
        background: 'linear-gradient(180deg, oklch(0.96 0.025 280) 0%, oklch(0.985 0.005 85) 60%)',
      }}
      data-screen-label="Block: Open the box"
    >
      <PhaseHead phase="□  Open the box" meta="checkpoint · ~60s" />
      <div className="block-body">
        <h3 className="font-serif text-[17px] font-semibold leading-tight mb-1.5 flex items-baseline gap-2">
          <BoxGlyph color="oklch(0.55 0.14 280)" />
          {p.question}
        </h3>
        <p className="font-serif text-[15.5px] leading-relaxed text-ink-2">
          Explain it in your own words. Don't paraphrase the paragraph above — explain the <em>why</em>. Two or three sentences is enough.
        </p>
        <textarea
          ref={ref}
          aria-label="Your understanding"
          className="w-full min-h-[96px] mt-1 px-3 py-2.5 rounded-md border border-rule bg-paper font-serif text-[15.5px] leading-relaxed text-ink resize-y placeholder:italic placeholder:text-ink-4 focus:outline-none focus:border-indigo-2 focus:shadow-[0_0_0_3px_oklch(0.55_0.14_280/0.15)]"
          placeholder="Understanding is hidden until you use it…"
          value={p.answer}
          onChange={(e) => p.onAnswerChange(e.target.value)}
          disabled={p.loading}
        />
        {p.hintShown && (
          <div className="mt-3 px-2.5 py-2 rounded border border-dashed border-amber-edge bg-amber-soft/70 font-serif text-[13.5px] text-ink-2 leading-relaxed">
            <strong className="text-ink">Tiny hint.</strong> What does the Reader touch that nothing else in the system touches?
          </div>
        )}
        {p.error && (
          <div className="mt-3 px-2.5 py-2 rounded border border-wrong-edge bg-wrong-soft font-mono text-[11.5px] text-wrong">
            /check-claim failed — {p.error}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button className="btn btn-indigo" onClick={p.onSubmit} disabled={!canSubmit}>
            {p.loading ? 'Measuring…' : 'Submit understanding →'}
          </button>
          <button className="btn" onClick={p.onHint} disabled={p.loading}>Tiny hint</button>
          <button className="btn btn-subtle" onClick={p.onSkip} disabled={p.loading}>Skip, but mark fragile</button>
        </div>
      </div>
      <div className="block-foot">
        <span className="font-mono text-[11px] text-ink-3">
          Inserted because this concept is <strong className="text-ink-2">fragile</strong>: students invert the role 41% of the time.
        </span>
      </div>
    </div>
  );
}
