import { useState } from 'react';
import type { DebateEntry } from '../../types';

interface DebateThreadProps {
  claimLabel: string;
  entries: DebateEntry[];
  loading: boolean;
  maxRounds?: number;
  onSubmitReply: (text: string) => void;
}

export function DebateThread({ claimLabel, entries, loading, maxRounds = 3, onSubmitReply }: DebateThreadProps) {
  const [reply, setReply] = useState('');

  const studentRounds = entries.filter((e) => e.role === 'student').length;
  const canReply = studentRounds < maxRounds && !loading && entries.length > 0;

  return (
    <div className="mt-2.5 ml-[28px] flex flex-col gap-1.5" data-screen-label="Debate thread">
      <div className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-4 mb-0.5">
        Debate - {claimLabel}
      </div>

      {entries.map((entry, i) => (
        <div
          key={i}
          className={`rounded border px-3 py-2 font-serif text-[13.5px] leading-relaxed ${
            entry.role === 'student'
              ? 'border-rule bg-paper-2 text-ink-2 ml-5'
              : 'border-indigo-edge bg-indigo-soft text-ink'
          }`}
        >
          <span
            className={`font-mono text-[9px] tracking-[0.09em] uppercase mr-2 ${
              entry.role === 'student' ? 'text-ink-4' : 'text-indigo'
            }`}
          >
            {entry.role === 'student' ? 'You' : 'Shrodinger'}
          </span>
          {entry.text}
        </div>
      ))}

      {loading && (
        <div className="border border-indigo-edge bg-indigo-soft rounded px-3 py-2 font-mono text-[10.5px] text-indigo tracking-[0.06em] animate-pulse">
          Shrodinger is thinking...
        </div>
      )}

      {canReply && (
        <div className="ml-5 mt-1">
          <textarea
            className="w-full min-h-[56px] px-2.5 py-2 rounded border border-rule bg-paper font-serif text-[13.5px] text-ink resize-y placeholder:italic placeholder:text-ink-4 focus:outline-none focus:border-indigo-2"
            placeholder="Reply to Shrodinger..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <div className="mt-1.5 flex gap-2">
            <button
              className="btn btn-indigo"
              disabled={!reply.trim()}
              onClick={() => {
                onSubmitReply(reply.trim());
                setReply('');
              }}
            >
              Reply
            </button>
          </div>
        </div>
      )}

      {!canReply && !loading && studentRounds >= maxRounds && (
        <div className="font-mono text-[9.5px] text-ink-4 tracking-[0.04em] ml-5">
          Max debate rounds reached. Challenge stays in your trace.
        </div>
      )}
    </div>
  );
}
