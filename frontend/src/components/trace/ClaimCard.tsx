import type { Claim, Verdict } from '../../types';

const verdictGlyph: Record<Verdict, string> = {
  correct: '✓', partial: '~', incorrect: '✕', unsupported: '?',
};
const verdictBg: Record<Verdict, string> = {
  correct: 'bg-correct text-paper',
  partial: 'bg-partial text-paper',
  incorrect: 'bg-wrong text-paper',
  unsupported: 'bg-unsup text-paper',
};
const verdictFg: Record<Verdict, string> = {
  correct: 'text-correct', partial: 'text-partial', incorrect: 'text-wrong', unsupported: 'text-unsup',
};
const verdictLabel: Record<Verdict, string> = {
  correct: 'Correct',
  partial: 'Partially correct — sharpen this',
  incorrect: 'Incorrect — review',
  unsupported: 'Unsupported by the source',
};

export function ClaimCard({ claim }: { claim: Claim }) {
  return (
    <div
      className="grid grid-cols-[18px_1fr] gap-2.5 rounded-md border border-rule bg-paper px-3 py-2.5"
      role="group"
      aria-label={`Claim: ${claim.text} — verdict ${verdictLabel[claim.verdict]}`}
    >
      <div className={`w-[18px] h-[18px] rounded grid place-items-center font-mono text-[11px] font-semibold ${verdictBg[claim.verdict]}`} aria-hidden="true">
        {verdictGlyph[claim.verdict]}
      </div>
      <div>
        <div className="flex flex-wrap items-baseline gap-2 mb-1">
          <span className="font-serif text-[15px] font-medium text-ink leading-snug">"{claim.text}"</span>
          <span className={`font-mono text-[10px] tracking-[0.1em] uppercase font-semibold ${verdictFg[claim.verdict]}`}>
            {verdictLabel[claim.verdict]}
          </span>
        </div>
        <div className="font-serif text-[14px] text-ink-2 leading-relaxed">
          {claim.rationale}
          {claim.improvement && (
            <span className="block mt-1.5 px-2.5 py-2 border-l-2 border-correct-edge bg-correct-soft/50 rounded-r font-serif text-[13.5px] text-ink-2">
              <strong className="text-ink">More precisely:</strong> {claim.improvement}
            </span>
          )}
          {claim.source_span && (
            <span className="block mt-1.5 font-mono text-[10.5px] text-ink-3 tracking-[0.04em]">
              ↳ {claim.source_span.section_id} — “{claim.source_span.quote}”
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
