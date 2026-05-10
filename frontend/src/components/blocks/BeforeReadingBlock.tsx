import { PhaseHead } from './PhaseHead';

export function BeforeReadingBlock() {
  return (
    <div className="block-card" style={{ boxShadow: 'inset 3px 0 0 oklch(0.74 0.008 270)' }} data-screen-label="Block: Before reading">
      <PhaseHead phase="Before reading" meta="route / 4 stops" />
      <div className="block-body">
        <h3 className="font-serif text-[17px] font-semibold mb-1.5">Your route through this chapter.</h3>
        <p className="font-serif text-[15.5px] leading-relaxed text-ink-2">
          Shrodinger has read the chapter and pre-marked four <em>fragile</em> concepts: places where students typically conflate assumptions or invert a conclusion. You'll meet a checkpoint at each one.
        </p>
        <ol className="font-serif text-[15px] text-ink-2 leading-relaxed mt-3 pl-5 list-decimal space-y-1">
          <li>What entanglement is — and what it isn't (§2.0)</li>
          <li>
            <strong className="text-ink">Locality vs. realism — why students conflate them</strong>{' '}
            <span className="ml-1 inline-block font-mono text-[9.5px] tracking-[0.12em] uppercase px-1.5 py-px rounded border border-rule text-indigo">fragile</span>
          </li>
          <li>Bell's inequality and what violating it proves (§2.3)</li>
          <li>Which assumption physicists actually abandon (§2.4)</li>
        </ol>
      </div>
    </div>
  );
}
