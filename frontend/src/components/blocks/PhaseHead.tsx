interface PhaseHeadProps { phase: string; meta?: string; }
export function PhaseHead({ phase, meta }: PhaseHeadProps) {
  return (
    <div className="block-head">
      <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-medium text-ink-2">{phase}</span>
      <div className="flex-1" />
      {meta && <span className="font-mono text-[10.5px] text-ink-3 tracking-[0.04em]">{meta}</span>}
    </div>
  );
}
