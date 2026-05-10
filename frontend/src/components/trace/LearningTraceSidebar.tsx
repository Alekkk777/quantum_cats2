import { TraceNowReading } from './TraceNowReading';
import { TraceWhyIntervened } from './TraceWhyIntervened';
import { TraceActiveClaims } from './TraceActiveClaims';
import { TraceMistakeFossils } from './TraceMistakeFossils';
import { TraceRecallQueue } from './TraceRecallQueue';
import { TraceFeed } from './TraceFeed';
import type { LearningTraceState } from '../../types';

export function LearningTraceSidebar({ trace }: { trace: LearningTraceState }) {
  return (
    <aside
      className="border-l border-rule bg-paper-2/60 sticky top-[var(--topbar-h)] h-[calc(100vh-var(--topbar-h))] overflow-y-auto"
      data-screen-label="Sidebar"
    >
      <div className="flex flex-col gap-6 p-5 pb-20">
        <TraceNowReading concept={trace.concept} />
        <TraceWhyIntervened concept={trace.concept} />
        <TraceActiveClaims claims={trace.claims} />
        <TraceMistakeFossils fossils={trace.fossils} />
        <TraceRecallQueue recall={trace.recall} />
        <TraceFeed events={trace.events} />
      </div>
    </aside>
  );
}
