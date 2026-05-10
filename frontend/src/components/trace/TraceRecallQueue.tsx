import { TraceSection, EmptyHint } from './_section';
import type { RecallItem } from '../../types';

export function TraceRecallQueue({ recall }: { recall: RecallItem[] }) {
  return (
    <TraceSection title="Recall queue" count={recall.length}>
      {recall.length === 0 && <EmptyHint>Concepts will be re-surfaced where they matter.</EmptyHint>}
      {recall.map((r) => (
        <div key={r.id} className="grid grid-cols-[14px_1fr_auto] gap-2 px-2.5 py-2 rounded-md border border-rule bg-paper items-start">
          <span className="w-2 h-2 mt-1.5 rounded-full bg-amber" aria-hidden="true" />
          <span className="font-serif text-[13px] text-ink leading-snug">{r.prompt}</span>
          <span className="font-mono text-[9.5px] text-ink-3 tracking-[0.05em] border border-rule rounded-full px-2 py-px bg-paper-2">{r.scheduledFor}</span>
        </div>
      ))}
    </TraceSection>
  );
}
