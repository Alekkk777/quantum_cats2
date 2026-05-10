import { useState } from 'react';
import { PhaseHead } from './PhaseHead';
import { ClaimCard } from '../trace/ClaimCard';
import { RevisionBox } from './RevisionBox';
import { DebateThread } from './DebateThread';
import { challengeClaimWithFallback } from '../../lib/challengeClaimWithFallback';
import { QUANTUM_CHECKPOINT_CONTEXT } from '../../data/documentContent';
import type { Claim, ClaimReview, DebateEntry } from '../../types';

interface ClaimMeasurementBlockProps {
  review: ClaimReview;
  studentAnswer: string;
  isRevising: boolean;
  context?: string;
  onAccept: () => void;
  onChallenge?: (claim: Claim, note: string) => void;
  onBeginRevision: () => void;
  onSubmitRevision: (revisedAnswer: string) => void;
}

export function ClaimMeasurementBlock(p: ClaimMeasurementBlockProps) {
  const context = p.context ?? QUANTUM_CHECKPOINT_CONTEXT;

  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [challengeText, setChallengeText] = useState('');
  const [debates, setDebates] = useState<Record<string, DebateEntry[]>>({});
  const [debateLoading, setDebateLoading] = useState<string | null>(null);

  const startChallenge = async () => {
    if (!selectedClaim || !challengeText.trim()) return;
    const claim = selectedClaim;
    const studentText = challengeText.trim();

    setSelectedClaim(null);
    setChallengeText('');

    const studentEntry: DebateEntry = { role: 'student', text: studentText };
    const currentHistory = debates[claim.id] ?? [];
    setDebates((d) => ({ ...d, [claim.id]: [...currentHistory, studentEntry] }));
    setDebateLoading(claim.id);

    try {
      const result = await challengeClaimWithFallback({
        claimText: claim.text,
        claimVerdict: claim.verdict,
        studentChallenge: studentText,
        originalQuestion: p.review.review_title,
        context,
        history: currentHistory,
      });
      const shrodingerEntry: DebateEntry = { role: 'shrodinger', text: result.response };
      setDebates((d) => ({ ...d, [claim.id]: [...(d[claim.id] ?? []), shrodingerEntry] }));
      p.onChallenge?.(claim, studentText);
    } finally {
      setDebateLoading(null);
    }
  };

  const continueDebate = async (claimId: string, replyText: string) => {
    const claim = p.review.claims.find((c) => c.id === claimId);
    if (!claim) return;

    const studentEntry: DebateEntry = { role: 'student', text: replyText };
    const currentHistory = debates[claimId] ?? [];
    setDebates((d) => ({ ...d, [claimId]: [...currentHistory, studentEntry] }));
    setDebateLoading(claimId);

    try {
      const result = await challengeClaimWithFallback({
        claimText: claim.text,
        claimVerdict: claim.verdict,
        studentChallenge: replyText,
        originalQuestion: p.review.review_title,
        context,
        history: [...currentHistory, studentEntry],
      });
      const shrodingerEntry: DebateEntry = { role: 'shrodinger', text: result.response };
      setDebates((d) => ({ ...d, [claimId]: [...(d[claimId] ?? []), shrodingerEntry] }));
    } finally {
      setDebateLoading(null);
    }
  };

  return (
    <div
      className="block-card border-indigo-edge"
      style={{ boxShadow: 'inset 3px 0 0 oklch(0.55 0.14 280)' }}
      data-screen-label="Block: Claim measurement"
    >
      <PhaseHead phase="Claim measurement" meta={`${p.review.claims.length} claims extracted`} />
      <div className="block-body">
        <p className="font-serif text-[15.5px] leading-relaxed text-ink-2 mb-1.5">{p.review.summary}</p>
        <blockquote className="mt-2.5 px-3 py-2.5 rounded border border-rule bg-paper-2 font-serif italic text-[14.5px] text-ink-2 leading-relaxed">
          "{p.studentAnswer}"
        </blockquote>

        <div className="flex flex-col gap-2.5 mt-3.5">
          {p.review.claims.map((claim) => (
            <div key={claim.id}>
              <ClaimCard claim={claim} onChallenge={setSelectedClaim} />

              {/* Inline challenge input */}
              {selectedClaim?.id === claim.id && (
                <div className="mt-2 ml-[28px] rounded-md border border-rule bg-paper-2 px-3 py-2.5">
                  <textarea
                    className="w-full min-h-[64px] px-2.5 py-2 rounded border border-rule bg-paper font-serif text-[13.5px] text-ink resize-y placeholder:italic placeholder:text-ink-4 focus:outline-none focus:border-indigo-2"
                    placeholder="What do you disagree with? Schrödinger will respond."
                    value={challengeText}
                    onChange={(e) => setChallengeText(e.target.value)}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      className="btn btn-indigo"
                      onClick={startChallenge}
                      disabled={!challengeText.trim() || debateLoading === claim.id}
                    >
                      Challenge Schrödinger
                    </button>
                    <button className="btn btn-subtle" onClick={() => setSelectedClaim(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Debate thread — shown once a challenge has started */}
              {(debates[claim.id]?.length ?? 0) > 0 || debateLoading === claim.id ? (
                <DebateThread
                  claimLabel={claim.label}
                  entries={debates[claim.id] ?? []}
                  loading={debateLoading === claim.id}
                  onSubmitReply={(text) => continueDebate(claim.id, text)}
                />
              ) : null}
            </div>
          ))}
        </div>

        {p.review.missing_ideas.length > 0 && (
          <div className="mt-3 p-3 rounded border border-rule bg-paper-2">
            <div className="label-mono mb-1">Missing</div>
            <ul className="font-serif text-[14px] text-ink-2 leading-relaxed list-disc pl-5 space-y-1">
              {p.review.missing_ideas.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {p.isRevising ? (
          <RevisionBox suggested={p.review.suggested_revision} onSubmit={p.onSubmitRevision} />
        ) : (
          <div className="flex flex-wrap items-center gap-2 mt-3.5">
            <button className="btn btn-indigo" onClick={p.onBeginRevision}>
              Revise claim
            </button>
            <button className="btn" onClick={p.onAccept}>
              Accept correction
            </button>
          </div>
        )}
      </div>
      <div className="block-foot">
        <span className="font-mono text-[11px] text-ink-3">
          Mistake repaired, not erased — the original claim stays in your trace as an anchor for recall.
        </span>
      </div>
    </div>
  );
}
