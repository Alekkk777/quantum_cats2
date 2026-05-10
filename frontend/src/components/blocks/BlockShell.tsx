// Common chrome for any inline document block: phase header, accent edge,
// optional foot strip ("why this is here"). Phase determines the accent color
// without the children needing to care.

import type { ReactNode } from 'react';

export type Phase =
  | 'before' | 'concept' | 'formula'
  | 'open' | 'claim' | 'repair' | 'recall';

const phaseClasses: Record<Phase, string> = {
  before:  'shadow-[inset_3px_0_0_var(--ink-4)]',
  concept: 'shadow-[inset_3px_0_0_var(--indigo-2)]',
  formula: 'shadow-[inset_3px_0_0_var(--amber)]',
  open:    'shadow-[inset_3px_0_0_var(--indigo-2)] !border-indigo-edge bg-gradient-to-b from-indigo-soft to-paper',
  claim:   'shadow-[inset_3px_0_0_var(--indigo-2)] !border-indigo-edge',
  repair:  'shadow-[inset_3px_0_0_var(--correct)] !border-correct-edge bg-gradient-to-b from-correct-soft to-paper',
  recall:  'shadow-[inset_3px_0_0_var(--amber)] !border-amber-edge bg-gradient-to-b from-amber-soft to-paper',
};

interface Props {
  phase: Phase;
  glyph: string;
  phaseLabel: string;
  meta?: string;
  children: ReactNode;
  foot?: ReactNode;
  screenLabel?: string;
}

export function BlockShell({ phase, glyph, phaseLabel, meta, children, foot, screenLabel }: Props) {
  return (
    <section
      data-screen-label={screenLabel}
      className={`my-6 border border-rule rounded-lg bg-paper shadow-card overflow-hidden animate-block-in ${phaseClasses[phase]}`}
    >
      <header className="flex items-center gap-2.5 px-3.5 py-2 border-b border-rule bg-paper-2/60">
        <span className="label-meta">{glyph}&nbsp;&nbsp;{phaseLabel}</span>
        <div className="flex-1" />
        {meta && <span className="font-mono text-[10.5px] text-ink-3 tracking-wide">{meta}</span>}
      </header>
      <div className="px-4 pt-3.5 pb-4">{children}</div>
      {foot && <footer className="flex items-center gap-2 px-3.5 py-2.5 border-t border-rule-2 bg-[oklch(0.985_0.004_85_/_0.6)]">{foot}</footer>}
    </section>
  );
}
