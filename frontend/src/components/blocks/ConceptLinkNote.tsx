import { useState } from 'react';
import type { ConceptLink } from '../../types';

const relationChip: Record<ConceptLink['relation'], string> = {
  prerequisite: 'prerequisite',
  contrast: 'contrast',
  causes: 'causes',
  supports: 'supports',
  example_of: 'example of',
  often_confused_with: 'confused with',
  applies_to: 'applies to',
};

interface ConceptLinkNoteProps {
  link: ConceptLink;
}

export function ConceptLinkNote({ link }: ConceptLinkNoteProps) {
  const [open, setOpen] = useState(!link.collapsed_by_default);

  return (
    <div className="my-1.5 flex items-start gap-2">
      <span className="font-mono text-[10px] text-ink-4 mt-0.5 shrink-0">&lt;-&gt;</span>
      <div>
        <button className="flex items-center gap-1.5 text-left flex-wrap" onClick={() => setOpen((o) => !o)}>
          <span className="font-mono text-[11px] text-ink-2 tracking-[0.02em]">
            {link.from_concept}{' '}
            <span className="text-indigo font-semibold">&lt;-&gt;</span>{' '}
            {link.to_concept}
          </span>
          <span className="font-mono text-[9px] text-ink-4 border border-rule rounded-full px-1.5 py-px tracking-[0.05em] uppercase">
            {relationChip[link.relation]}
          </span>
        </button>

        {open && (
          <div className="mt-1">
            <p className="font-serif text-[12.5px] text-ink-3 leading-relaxed">{link.explanation}</p>
            {link.source_quote && (
              <blockquote className="mt-1 font-serif italic text-[11.5px] text-ink-4 leading-relaxed">
                "{link.source_quote}"
              </blockquote>
            )}
            <button
              className="mt-1 font-mono text-[9px] text-ink-4 hover:text-ink-3 tracking-[0.04em]"
              onClick={() => setOpen(false)}
            >
              hide
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
