import { TraceSection } from './_section';
import type { ConceptSnapshot } from '../../types';

export function TraceWhyIntervened({ concept }: { concept: ConceptSnapshot }) {
  return (
    <TraceSection title="Why Shrodinger intervened">
      <div className="rounded-md border border-rule bg-paper px-3 py-2.5 font-serif text-[13.5px] text-ink-2 leading-relaxed">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[9.5px] tracking-[0.1em] uppercase px-1.5 py-px rounded bg-indigo-soft text-indigo font-semibold">Heuristic</span>
          <span className="label-mono">{concept.heuristic}</span>
        </div>
        {concept.rationale}
        <ul className="list-none mt-2 space-y-0.5 font-mono text-[10.5px] text-ink-3 tracking-[0.02em]">
          {concept.signals.map((s, i) => <li key={i}>- {s}</li>)}
        </ul>
      </div>
    </TraceSection>
  );
}
