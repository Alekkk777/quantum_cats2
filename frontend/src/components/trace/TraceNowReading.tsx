import { TraceSection } from './_section';
import type { ConceptSnapshot } from '../../types';

export function TraceNowReading({ concept }: { concept: ConceptSnapshot }) {
  return (
    <TraceSection title="Current concept" count={concept.sectionLabel}>
      <div className="rounded-md border border-rule bg-paper px-3 py-2.5">
        <div className="font-serif text-[15px] font-semibold leading-tight">{concept.title}</div>
        <div className="font-mono text-[10.5px] text-ink-3 mt-0.5 tracking-[0.04em]">
          {concept.fragility} - {concept.strength >= 70 ? 'observed' : 'observing'}
        </div>
        <div className="mt-2.5 h-1 rounded-full bg-paper-3 overflow-hidden">
          <span
            className="block h-full transition-all duration-700"
            style={{
              width: `${concept.strength}%`,
              background: 'linear-gradient(90deg, oklch(0.55 0.14 280), oklch(0.42 0.13 280))',
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5 font-mono text-[9.5px] text-ink-4 tracking-[0.06em]">
          <span>UNOBSERVED</span><span>OBSERVED</span>
        </div>
      </div>
    </TraceSection>
  );
}
