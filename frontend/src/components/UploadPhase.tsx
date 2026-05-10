import { useRef, useState } from 'react';
import { uploadDocument } from '../lib/api';
import { Mascot } from './Mascot';

interface UploadPhaseProps {
  onUploaded: (sezioni: string[], filename: string) => void;
}

export function UploadPhase({ onUploaded }: UploadPhaseProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const res = await uploadDocument(file);
      onUploaded(res.sezioni, file.name);
    } catch (err) {
      setError((err as Error).message ?? 'Upload fallito. Il backend è avviato?');
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-paper-2">
      <div className="w-[min(560px,92vw)] flex flex-col items-center gap-6">
        <div className="flex items-start gap-3">
          <Mascot size={56} variant="full" />
          <div>
            <div className="label-mono text-indigo">Braynr · Studio Adattivo</div>
            <h1 className="font-serif text-[28px] font-semibold tracking-[-0.015em] mt-0.5">
              Carica il tuo documento.
            </h1>
            <p className="font-serif text-[15px] text-ink-2 leading-snug mt-1">
              Trasforma qualsiasi PDF o Markdown in un documento vivente con frizione cognitiva adattiva.
            </p>
          </div>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
            dragOver
              ? 'border-indigo bg-indigo-soft'
              : 'border-rule bg-paper hover:border-indigo-edge hover:bg-indigo-soft'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".md,.pdf,.txt"
            className="hidden"
            onChange={onInputChange}
          />
          {loading ? (
            <>
              <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-[12px] text-indigo">Ingestione in corso...</span>
            </>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-ink-4" strokeWidth="1.5">
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-center">
                <p className="font-serif text-[15px] text-ink">Trascina qui il documento</p>
                <p className="text-[12px] text-ink-4 font-mono mt-0.5">.md · .pdf · .txt</p>
              </div>
              <span className="text-[11px] text-ink-4">oppure clicca per selezionare</span>
            </>
          )}
        </div>

        {error && (
          <div className="w-full p-3 rounded-lg border border-wrong-edge bg-wrong-soft text-wrong text-[13px] font-mono">
            {error}
          </div>
        )}

        <p className="text-[12px] text-ink-4 font-mono text-center">
          Il documento viene processato localmente — nessun dato inviato al cloud.
        </p>
      </div>
    </div>
  );
}
