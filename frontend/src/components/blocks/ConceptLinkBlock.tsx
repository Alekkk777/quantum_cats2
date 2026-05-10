import { PhaseHead } from './PhaseHead';
import { renderInline } from '../document/inline';

export function ConceptLinkBlock({ from, text }: { from: string; text: string }) {
  return (
    <div className="block-card" style={{ boxShadow: 'inset 3px 0 0 oklch(0.55 0.14 280)' }} data-screen-label="Block: Concept link">
      <PhaseHead phase="Concept link" meta={`from ${from}`} />
      <div className="block-body">
        <p className="font-serif text-[15.5px] leading-relaxed text-ink-2 m-0">{renderInline(text)}</p>
      </div>
    </div>
  );
}
