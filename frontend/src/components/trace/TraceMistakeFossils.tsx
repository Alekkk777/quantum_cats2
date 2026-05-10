import { TraceSection, EmptyHint } from './_section';
import type { MistakeFossil } from '../../types';

export function TraceMistakeFossils({ fossils }: { fossils: MistakeFossil[] }) {
  return (
    <TraceSection title="Mistake fossils" count={fossils.length}>
      {fossils.length === 0 && <EmptyHint>Mistakes will be kept here, not erased.</EmptyHint>}
      {fossils.map((f) => (
        <div key={f.id} className="grid grid-cols-[14px_1fr_auto] gap-2 px-2.5 py-2 rounded-md border border-rule bg-paper items-start">
          <span className="w-2 h-2 mt-1.5 rounded-full bg-wrong" aria-hidden="true" />
          <span className="font-serif text-[13px] text-ink-2 leading-snug">
            <span className="line-through decoration-wrong/60">"{f.before}"</span>
            <span className="block mt-0.5 italic text-correct">revised: {f.after}</span>
          </span>
          <span className="font-mono text-[9.5px] text-ink-4 tracking-[0.04em] uppercase">{f.sectionId}</span>
        </div>
      ))}
    </TraceSection>
  );
}
