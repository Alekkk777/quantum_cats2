import { useState, useRef, useEffect } from 'react';

interface RevisionBoxProps {
  suggested: string;
  onSubmit: (revisedAnswer: string) => void;
}

export function RevisionBox({ suggested, onSubmit }: RevisionBoxProps) {
  const [text, setText] = useState(suggested);
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  return (
    <div className="mt-3.5 rounded-md border border-correct-edge bg-correct-soft/50 p-3">
      <div className="label-mono mb-1.5 text-correct">Suggested revision · edit before accepting</div>
      <textarea
        ref={ref}
        aria-label="Revised answer"
        className="w-full min-h-[96px] px-3 py-2.5 rounded border border-rule bg-paper font-serif text-[15.5px] leading-relaxed text-ink resize-y focus:outline-none focus:border-correct focus:shadow-[0_0_0_3px_oklch(0.52_0.10_155/0.18)]"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2 mt-2.5">
        <button className="btn btn-primary" onClick={() => onSubmit(text)}>Accept revision →</button>
        <button className="btn" onClick={() => setText(suggested)}>Restore suggestion</button>
      </div>
    </div>
  );
}
