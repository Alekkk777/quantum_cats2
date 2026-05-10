import { useState } from 'react';

interface InsightBlockProps {
  target: string;
  contenuto: string;
  tipo: 'insight' | 'confronto';
}

export function InsightBlock({ target, contenuto, tipo }: InsightBlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="inline">
      <button
        onClick={() => setOpen(o => !o)}
        className={`underline decoration-dotted decoration-indigo underline-offset-2 text-indigo hover:text-indigo-2 transition-colors cursor-pointer ${open ? 'font-semibold' : ''}`}
      >
        {target}
      </button>
      {open && (
        <span
          className="block my-2 px-4 py-3 rounded-lg border border-indigo-edge bg-indigo-soft text-ink text-[14px] leading-[1.55]"
          style={{ animation: 'blockIn 220ms cubic-bezier(.2,.7,.2,1) both' }}
        >
          <span className="label-mono text-indigo block mb-1">
            {tipo === 'insight' ? '💡 Insight' : '↔ Confronto'}
          </span>
          {contenuto}
        </span>
      )}
    </span>
  );
}
