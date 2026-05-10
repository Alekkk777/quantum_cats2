import { PhaseHead } from './PhaseHead';

export function FormulaAnchorBlock({ formula, explanation }: { formula: string; explanation: string }) {
  return (
    <div className="block-card" style={{ boxShadow: 'inset 3px 0 0 oklch(0.62 0.13 70)' }} data-screen-label="Block: Formula anchor">
      <PhaseHead phase="∴  Formula anchor" meta="rule" />
      <div className="block-body">
        <span className="inline-block font-mono text-[13.5px] px-3 py-2 rounded border border-rule bg-paper-3">
          {formula}
        </span>
        <p className="font-serif text-[15.5px] leading-relaxed text-ink-2 mt-2.5">{explanation}</p>
      </div>
    </div>
  );
}
