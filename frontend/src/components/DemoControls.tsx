import type { CheckpointPhase } from '../types';

interface DemoControlsProps {
  phase: CheckpointPhase | 'setup';
  usedFallback?: boolean;
  onNext: () => void;
  onBack: () => void;
  onReset: () => void;
}

const phaseLabel: Record<DemoControlsProps['phase'], string> = {
  setup: 'Set up session',
  reading: 'Reading 2.3',
  open: 'Open the box',
  measuring: 'Claim measurement',
  revising: 'Revising claim',
  repaired: 'Mistake fossil - recall scheduled',
};

const ORDER: DemoControlsProps['phase'][] = ['setup', 'reading', 'open', 'measuring', 'revising', 'repaired'];

export function DemoControls({ phase, usedFallback, onNext, onBack, onReset }: DemoControlsProps) {
  const idx = ORDER.indexOf(phase);
  return (
    <div className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-ink/90 px-3.5 py-1.5 text-paper shadow-[0_12px_30px_oklch(0.20_0.01_270/0.25)]">
      <span className="font-mono text-[10.5px] tracking-[0.1em] text-paper-3">{String(idx + 1).padStart(2, '0')} / 06</span>
      <span className="font-serif text-[14px] font-medium">{phaseLabel[phase]}</span>
      {usedFallback && (
        <span className="rounded-full border border-ink-3 px-2 py-px font-mono text-[9.5px] uppercase tracking-[0.08em] text-paper-3">
          demo fallback
        </span>
      )}
      <div className="flex gap-1">
        {ORDER.map((p, i) => (
          <span
            key={p}
            className="h-1 w-4 rounded-full transition-colors"
            style={{
              background: i === idx
                ? 'oklch(0.78 0.05 280)'
                : i < idx
                  ? 'oklch(0.55 0.14 280)'
                  : 'oklch(0.40 0.01 270)',
            }}
          />
        ))}
      </div>
      <button onClick={onBack} disabled={idx <= 0} className="rounded-full border border-ink-3 bg-ink-2 px-2.5 py-1 text-[12px] text-paper disabled:cursor-not-allowed disabled:opacity-50" aria-label="Previous step">Back</button>
      <button onClick={onNext} disabled={idx >= ORDER.length - 1} className="rounded-full border border-indigo bg-indigo px-2.5 py-1 text-[12px] text-paper disabled:cursor-not-allowed disabled:opacity-50" aria-label="Next step">Next</button>
      <button onClick={onReset} className="rounded-full border border-ink-3 bg-ink-2 px-2.5 py-1 text-[12px] text-paper" aria-label="Restart demo">Reset</button>
    </div>
  );
}
