import { useState } from 'react';
import type { TextAnchor } from '../../types';

const kindGlyph: Record<TextAnchor['kind'], string> = {
  definition: 'Def',
  formula: 'Sum',
  warning: 'Warn',
  context: 'Ctx',
  assumption: 'Asm',
  example: 'Ex',
};

interface TextAnchorNoteProps {
  anchor: TextAnchor;
}

export function TextAnchorNote({ anchor }: TextAnchorNoteProps) {
  const [open, setOpen] = useState(!anchor.collapsed_by_default);

  return (
    <div
      className={`my-2 pl-3 border-l-2 ${
        anchor.priority === 'high' ? 'border-indigo-edge' : 'border-rule'
      }`}
    >
      <button
        className="flex items-center gap-2 text-left w-full group"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-indigo bg-indigo-soft px-1.5 py-px rounded shrink-0">
          {kindGlyph[anchor.kind]} / {anchor.label}
        </span>
        {!open && (
          <span className="font-serif text-[12.5px] text-ink-3 italic truncate">
            {anchor.body.slice(0, 72)}...
          </span>
        )}
      </button>

      {open && (
        <div className="mt-1.5 pr-2">
          <p className="font-serif text-[13.5px] text-ink-2 leading-relaxed">{anchor.body}</p>
          {anchor.source_quote && (
            <blockquote className="mt-1.5 pl-2.5 border-l border-rule font-serif italic text-[12px] text-ink-3 leading-relaxed">
              "{anchor.source_quote}"
            </blockquote>
          )}
          <button
            className="mt-1 font-mono text-[9px] text-ink-4 hover:text-ink-2 tracking-[0.05em]"
            onClick={() => setOpen(false)}
          >
            hide
          </button>
        </div>
      )}
    </div>
  );
}
