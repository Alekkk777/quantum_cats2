import { PhaseHead } from './PhaseHead';
import type { RecallItem } from '../../types';

export function RecallScheduledBlock({ recall, prompt, onContinue }: { recall: RecallItem[]; prompt: string; onContinue: () => void; }) {
  return (
    <div className="block-card border-amber-edge"
         style={{
           boxShadow: 'inset 3px 0 0 oklch(0.62 0.13 70)',
           background: 'linear-gradient(180deg, oklch(0.965 0.025 80) 0%, oklch(0.985 0.005 85) 70%)',
         }}
         data-screen-label="Block: Recall scheduled">
      <PhaseHead phase="↻  Recall scheduled" meta={recall.map((r) => r.scheduledFor).join(' · ')} />
      <div className="block-body">
        <p className="font-serif text-[15.5px] leading-relaxed text-ink-2 m-0">
          {prompt}
        </p>
        <ul className="font-serif text-[14px] text-ink-2 leading-relaxed list-none mt-2.5 space-y-1">
          {recall.map((r) => (
            <li key={r.id} className="flex items-baseline gap-2">
              <span className="font-mono text-[10.5px] text-amber tracking-[0.05em] border border-amber-edge bg-paper rounded-full px-1.5 py-px">{r.scheduledFor}</span>
              <span>{r.prompt}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-3">
          <button className="btn" onClick={onContinue}>Continue reading →</button>
        </div>
      </div>
    </div>
  );
}
