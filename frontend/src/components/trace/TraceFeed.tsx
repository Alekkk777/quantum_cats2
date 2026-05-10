import { TraceSection } from './_section';
import type { TraceEvent } from '../../types';

const tone: Record<TraceEvent['tone'], string> = {
  neutral: 'border-rule bg-paper text-ink-3',
  indigo:  'border-indigo-edge bg-indigo-soft text-indigo',
  amber:   'border-amber-edge bg-amber-soft text-amber',
  green:   'border-correct-edge bg-correct-soft text-correct',
  red:     'border-wrong-edge bg-wrong-soft text-wrong',
};

export function TraceFeed({ events }: { events: TraceEvent[] }) {
  return (
    <TraceSection title="Learning trace" count={events.length}>
      <div className="flex flex-col">
        {events.map((e, i) => (
          <div key={e.id} className="relative grid grid-cols-[14px_1fr] gap-2.5 py-1.5">
            <div className={`w-3.5 h-3.5 mt-0.5 rounded border grid place-items-center font-mono text-[8px] ${tone[e.tone]}`}>{e.glyph}</div>
            <div className="font-serif text-[13px] text-ink leading-snug">
              {e.text}
              <span className="block font-mono text-[9.5px] text-ink-4 tracking-[0.05em] mt-0.5">
                {e.meta}
                {e.now && <span className="ml-1.5 font-mono text-[9.5px] tracking-[0.08em] font-semibold text-indigo">NOW</span>}
              </span>
            </div>
            {i < events.length - 1 && <span className="absolute left-[6px] top-[22px] bottom-0 w-px bg-rule" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </TraceSection>
  );
}
