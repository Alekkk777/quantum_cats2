import * as React from 'react';

export function TraceSection({ title, count, children }: { title: string; count?: number | string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center justify-between">
        <span className="label-mono">{title}</span>
        {count !== undefined && <span className="font-mono text-[10.5px] text-ink-4">{count}</span>}
      </header>
      {children}
    </section>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-serif text-[13px] italic text-ink-3 px-2.5 py-2 rounded border border-dashed border-rule">
      {children}
    </div>
  );
}
