import { TraceSection, EmptyHint } from './_section';
import type { Claim } from '../../types';

const dot: Record<Claim['verdict'], string> = {
  correct: 'bg-correct', partial: 'bg-partial', incorrect: 'bg-wrong', unsupported: 'bg-unsup',
};

export function TraceActiveClaims({ claims }: { claims: Claim[] }) {
  return (
    <TraceSection title="Active claims" count={claims.length}>
      {claims.length === 0 && <EmptyHint>Submit an answer to extract claims.</EmptyHint>}
      {claims.map((c) => (
        <div key={c.id} className="grid grid-cols-[14px_1fr_auto] gap-2 px-2.5 py-2 rounded-md border border-rule bg-paper items-start">
          <span className={`w-2 h-2 mt-1.5 rounded-full ${dot[c.verdict]}`} aria-hidden="true" />
          <span className="font-serif text-[13px] text-ink leading-snug">"{c.text}"</span>
          <span className="font-mono text-[9.5px] text-ink-4 tracking-[0.04em] uppercase">{c.verdict}</span>
        </div>
      ))}
    </TraceSection>
  );
}
