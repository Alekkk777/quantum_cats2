import { PhaseHead } from './PhaseHead';

interface MistakeRepairedBlockProps {
  before: string;
  after: string;
}

export function MistakeRepairedBlock({ before, after }: MistakeRepairedBlockProps) {
  return (
    <div className="block-card border-correct-edge"
         style={{
           boxShadow: 'inset 3px 0 0 oklch(0.52 0.10 155)',
           background: 'linear-gradient(180deg, oklch(0.965 0.025 155) 0%, oklch(0.985 0.005 85) 70%)',
         }}
         data-screen-label="Block: Mistake repaired">
      <PhaseHead phase="✓  Mistake repaired" meta="fossil saved · concept observed" />
      <div className="block-body">
        <p className="font-serif text-[15.5px] leading-relaxed text-ink-2 m-0">
          You revised. The new claim is consistent with §4.2 and §4.4. Your understanding of <strong>Reader vs. Resolver</strong> is now <em>observed</em>.
        </p>
        <div className="mt-2.5 rounded border border-rule overflow-hidden">
          <div className="px-3 py-2.5 font-serif text-[14.5px] leading-relaxed text-ink-2 bg-wrong-soft/60 line-through decoration-wrong/60 decoration-1 border-b border-rule">
            <Lbl>Before</Lbl>"{before}"
          </div>
          <div className="px-3 py-2.5 font-serif text-[14.5px] leading-relaxed text-ink bg-correct-soft/60">
            <Lbl>After</Lbl>"{after}"
          </div>
        </div>
      </div>
      <div className="block-foot">
        <span className="font-mono text-[11px] text-ink-3">This claim changed, so it has been scheduled for recall.</span>
      </div>
    </div>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-[9.5px] tracking-[0.12em] uppercase mr-2 px-1.5 py-px rounded bg-paper border border-rule text-ink-3 font-medium align-middle">
      {children}
    </span>
  );
}
