import type { UserBrainState } from '../lib/api';

interface BrainSidebarProps {
  brain: UserBrainState;
  sezioni: string[];
  currentSection: string;
  onSelectSection: (id: string) => void;
}

export function BrainSidebar({ brain, sezioni, currentSection, onSelectSection }: BrainSidebarProps) {
  const total = brain.acquisiti.length + brain.lacune.length + brain.in_corso.length;
  const strength = total === 0 ? 0 : Math.round((brain.acquisiti.length / total) * 100);

  return (
    <aside className="h-full border-l border-rule bg-paper flex flex-col overflow-y-auto">
      <div className="px-5 py-4 border-b border-rule">
        <div className="label-mono mb-2">Knowledge graph</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 rounded-full bg-rule overflow-hidden">
            <div
              className="h-full bg-indigo rounded-full transition-all duration-700"
              style={{ width: `${strength}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-ink-3">{strength}%</span>
        </div>
        <div className="text-[11px] text-ink-4 font-mono">
          {brain.acquisiti.length} acquisiti · {brain.lacune.length} lacune
        </div>
      </div>

      {sezioni.length > 0 && (
        <div className="px-5 py-3 border-b border-rule">
          <div className="label-mono mb-2">Sezioni</div>
          <div className="flex flex-col gap-1">
            {sezioni.map(id => (
              <button
                key={id}
                onClick={() => onSelectSection(id)}
                className={`text-left px-2 py-1.5 rounded text-[12px] font-mono transition-colors ${
                  id === currentSection
                    ? 'bg-indigo-soft text-indigo font-semibold border border-indigo-edge'
                    : 'text-ink-3 hover:text-ink hover:bg-paper-3'
                }`}
              >
                {id.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {brain.lacune.length > 0 && (
        <div className="px-5 py-3 border-b border-rule">
          <div className="label-mono text-wrong mb-2">Lacune ({brain.lacune.length})</div>
          <div className="flex flex-col gap-1">
            {brain.lacune.map(c => (
              <div key={c} className="flex items-center gap-1.5 text-[12px]">
                <span className="text-wrong">×</span>
                <span className="text-ink-2">{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {brain.acquisiti.length > 0 && (
        <div className="px-5 py-3">
          <div className="label-mono text-correct mb-2">Acquisiti ({brain.acquisiti.length})</div>
          <div className="flex flex-col gap-1">
            {brain.acquisiti.map(c => (
              <div key={c} className="flex items-center gap-1.5 text-[12px]">
                <span className="text-correct">✓</span>
                <span className="text-ink-2">{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="px-5 py-6 text-center text-ink-4 text-[13px] font-serif italic">
          Il grafo si popola man mano che studi.
        </div>
      )}
    </aside>
  );
}
