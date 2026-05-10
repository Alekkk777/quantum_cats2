import type { Claim, Verdict } from '../../types';

const verdictStyles: Record<Verdict, { mark: string; chip: string; ariaWord: string; markGlyph: string }> = {
  correct:     { mark: 'bg-correct',     chip: 'text-correct',     ariaWord: 'correct',                    markGlyph: '✓' },
  partial:     { mark: 'bg-partial',     chip: 'text-partial',     ariaWord: 'partially correct',          markGlyph: '~' },
  incorrect:   { mark: 'bg-incorrect',   chip: 'text-incorrect',   ariaWord: 'incorrect',                  markGlyph: '×' },
  unsupported: { mark: 'bg-unsupported', chip: 'text-unsupported', ariaWord: 'unsupported by source',      markGlyph: '?' },
};

const verdictLabel: Record<Verdict, string> = {
  correct: 'Correct',
  partial: 'Partial',
  incorrect: 'Incorrect',
  unsupported: 'Unsupported',
};

export function ClaimCard({ claim }: { claim: Claim }) {
  const v = verdictStyles[claim.verdict];
  return (
    <article
      className="grid grid-cols-[18px_1fr] gap-2.5 p-3 border border-rule rounded-md bg-paper"
      aria-label={`Claim "${claim.text}". Verdict: ${v.ariaWord}.`}
    >
      <div
        className={`w-[18px] h-[18px] rounded-sm flex items-center justify-center text-paper font-mono text-[11px] font-semibold ${v.mark}`}
        aria-hidden
      >
        {v.markGlyph}
      </div>
      <div>
        <div className="flex items-baseline gap-2 flex-wrap mb-1">
          <span className="font-serif text-[15px] font-medium leading-tight text-ink">"{claim.text}"</span>
          <span className={`font-mono text-[10px] uppercase tracking-wider font-semibold ${v.chip}`}>
            {verdictLabel[claim.verdict]}
            {claim.severity === 'major' && claim.verdict === 'incorrect' && <> · {claim.label}</>}
          </span>
        </div>
        <div className="font-serif text-[14px] text-ink-2 leading-[1.5]" style={{ textWrap: 'pretty' }}>
          {claim.rationale}
          {claim.improvement && (
            <span className="block mt-1.5 px-2.5 py-1.5 border-l-2 border-correct-edge bg-correct-soft/50 rounded-r font-serif text-[13.5px] text-ink-2">
              <strong className="text-ink">More precisely:</strong> {claim.improvement}
            </span>
          )}
          {claim.source_span && (
            <span className="mt-1.5 inline-block font-mono text-[10.5px] text-ink-3 tracking-wide">
              §{claim.source_span.section_id} — "{claim.source_span.quote}"
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
