import { useState } from 'react';
import { Mascot } from './Mascot';
import type { StudySession } from '../types';

interface SetupOverlayProps {
  open: boolean;
  onStart: (cfg: { goal: StudySession['goal']; depth: StudySession['depth']; doc: string }) => void;
}

const docs: Array<[string, string, string]> = [
  ['agent-arch', 'Agent Architectures, Ch. 4', 'Reader / Resolver / MCP / 12 pp'],
  ['linalg', 'Linear Algebra Done Right, Ch. 5', 'Eigenvalues / 18 pp'],
  ['biochem', 'Lehninger Biochemistry, Ch. 14', 'Glycolysis / 22 pp'],
];

const goals: Array<[StudySession['goal'], string]> = [
  ['exam',  'Pass the exam'],
  ['build', 'Build something with this'],
  ['teach', 'Teach it to a peer'],
  ['curio', 'Just curious'],
];

const depths: Array<[StudySession['depth'], string]> = [
  ['light', 'Light - 1 checkpoint / page'],
  ['rigorous', 'Rigorous - checkpoints at every fragile concept'],
  ['oral', 'Oral defense - explain everything'],
];

export function SetupOverlay({ open, onStart }: SetupOverlayProps) {
  const [doc, setDoc] = useState('agent-arch');
  const [goal, setGoal] = useState<StudySession['goal']>('exam');
  const [depth, setDepth] = useState<StudySession['depth']>('rigorous');

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 backdrop-blur-md" data-screen-label="Setup">
      <div
        className="w-[min(580px,92vw)] rounded-xl border border-rule bg-paper p-7 shadow-[0_30px_60px_oklch(0.20_0.01_270/0.18)]"
        style={{ animation: 'blockIn 320ms cubic-bezier(.2,.7,.2,1) both' }}
      >
        <div className="flex items-start gap-3 mb-5">
          <Mascot size={56} variant="full" />
          <div>
            <div className="label-mono text-indigo">Open the box of understanding</div>
            <h2 className="font-serif text-[26px] font-semibold -tracking-[0.015em] mt-1">Set up this study session.</h2>
            <p className="font-serif text-[15px] text-ink-2 leading-snug mt-1">
              Shrodinger does not summarize for you. It inserts checkpoints into your document so your understanding becomes <em>observable</em>.
            </p>
          </div>
        </div>

        <Field label="Document">
          <div className="flex gap-1.5 flex-wrap">
            {docs.map(([id, name, sub]) => (
              <SegBtn key={id} on={doc === id} onClick={() => setDoc(id)} className="flex-1 min-w-0 flex flex-col gap-0.5 items-start">
                <span className="font-serif text-[14px] font-semibold">{name}</span>
                <span className="font-mono text-[10px] text-ink-4 tracking-[0.04em]">{sub}</span>
              </SegBtn>
            ))}
          </div>
        </Field>
        <Field label="Study goal">
          <div className="flex gap-1.5 flex-wrap">
            {goals.map(([id, label]) => (
              <SegBtn key={id} on={goal === id} onClick={() => setGoal(id)}>{label}</SegBtn>
            ))}
          </div>
        </Field>
        <Field label="Intervention depth">
          <div className="flex gap-1.5 flex-wrap">
            {depths.map(([id, label]) => (
              <SegBtn key={id} on={depth === id} onClick={() => setDepth(id)}>{label}</SegBtn>
            ))}
          </div>
        </Field>

        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-rule">
          <span className="font-serif italic text-[13px] text-ink-3">Until you use it, your understanding is unobserved.</span>
          <button className="btn btn-indigo" onClick={() => onStart({ goal, depth, doc })}>Begin study mode</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <span className="label-mono">{label}</span>
      {children}
    </div>
  );
}

function SegBtn({ on, children, className = '', ...rest }: { on: boolean; children: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`px-3 py-1.5 rounded-md border text-[13px] text-left transition-colors ${
        on ? 'border-indigo bg-indigo-soft text-indigo font-semibold' : 'border-rule bg-paper text-ink-2 hover:border-ink-4 hover:text-ink'
      } ${className}`}
    />
  );
}
