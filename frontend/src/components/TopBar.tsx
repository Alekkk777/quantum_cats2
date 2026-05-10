import { Mascot } from './Mascot';

interface TopBarProps {
  documentTitle: string;
  chapterCrumb: string;
  status: 'idle' | 'studying' | 'measuring';
  onExportTrace: () => void;
  onSaveSession: () => void;
}

const statusLabel: Record<TopBarProps['status'], string> = {
  idle: 'NOT STARTED',
  studying: 'STUDY MODE - OBSERVING',
  measuring: 'MEASURING UNDERSTANDING',
};

export function TopBar({ documentTitle, chapterCrumb, status, onExportTrace, onSaveSession }: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-40 h-[var(--topbar-h)] flex items-center gap-3.5 px-4 border-b border-rule bg-paper/85 backdrop-blur-md backdrop-saturate-150"
      data-screen-label="Top bar"
    >
      <div className="flex items-center gap-2.5 font-serif font-semibold text-[17px] -tracking-[0.01em]">
        <Mascot size={32} variant="full" />
        <span>Shrodinger</span>
        <span className="ml-2 font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3 font-medium">by Quantum Cats</span>
      </div>
      <div className="w-px h-6 bg-rule" />
      <div className="flex flex-col leading-tight">
        <span className="font-serif text-[14px] font-semibold">{documentTitle}</span>
        <span className="font-mono text-[10.5px] text-ink-3 tracking-[0.04em]">{chapterCrumb}</span>
      </div>
      <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-indigo-edge bg-indigo-soft text-indigo font-mono text-[10.5px] tracking-[0.06em] font-medium">
        <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-indigo-2" />
        {statusLabel[status]}
      </span>
      <div className="flex-1" />
      <button className="btn" onClick={onExportTrace} title="Export the full learning trace as JSON">Export trace</button>
      <button className="btn" onClick={onSaveSession} title="Save session and pick up later">Save session</button>
    </header>
  );
}
