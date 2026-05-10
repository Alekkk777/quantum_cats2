import { useEffect, useState } from 'react';
import { generateConceptLinks, generateTextAnchors, getStudyMode, recordInteraction } from '../lib/api';
import type { StudyModeResponse, UserBrainState } from '../lib/api';
import type { Claim, ClaimReview, ConceptLink, LearningTraceState, MistakeFossil, RecallItem, TextAnchor, TraceEvent } from '../types';
import { initialTrace } from '../data/initialTrace';
import { LiveDocument } from './LiveDocument';
import { LearningTraceSidebar } from './trace/LearningTraceSidebar';

interface StudyPhaseProps {
  sezioni: string[];
}

const now = () => new Date().toISOString();
const nid = () => Math.random().toString(36).slice(2, 9);

function event(partial: Omit<TraceEvent, 'id' | 'at'>): TraceEvent {
  return { id: nid(), at: now(), ...partial };
}

function appendCurrentEvent(events: TraceEvent[], next: TraceEvent) {
  return events.map((e) => (e.now ? { ...e, now: false } : e)).concat(next);
}

function readableSection(sectionId: string) {
  return sectionId.replace(/_/g, ' ');
}

function titleFromText(text: string, sectionId: string) {
  const heading = text
    .split(/\n+/)
    .map((line) => line.replace(/^#{1,3}\s+/, '').trim())
    .find(Boolean);
  return heading ?? readableSection(sectionId);
}

function strengthFromBrain(brain: UserBrainState) {
  const total = brain.acquisiti.length + brain.in_corso.length + brain.lacune.length;
  if (total === 0) return 12;
  return Math.max(8, Math.round((brain.acquisiti.length / total) * 100));
}

function conceptFromStudyData(
  sectionId: string,
  studyData: StudyModeResponse,
): LearningTraceState['concept'] {
  const question = studyData.mutazioni_attive.find((m) => m.tipo_ui === 'domanda_inline');
  const signals = studyData.mutazioni_attive.length > 0
    ? studyData.mutazioni_attive.map((m) => `${m.tipo_ui} on ${m.target}`)
    : ['No live mutation inserted for this section yet'];

  return {
    id: sectionId,
    title: question?.target ?? titleFromText(studyData.testo_originale, sectionId),
    sectionLabel: readableSection(sectionId),
    fragility: studyData.stato_grafo.lacune.length > 0 ? 'fragile' : 'stable',
    strength: strengthFromBrain(studyData.stato_grafo),
    rationale: question
      ? 'A checkpoint was inserted because this concept is worth making observable before the document moves on.'
      : 'Shrodinger is watching the reading path and will insert checkpoints where the document exposes fragile concepts.',
    signals,
    heuristic: question ? 'question-mcp' : 'document-mutation',
  };
}

const isMajorMistake = (claim: Claim) =>
  claim.severity === 'major' && (claim.verdict === 'incorrect' || claim.verdict === 'partial');

function recallFromReview(review: ClaimReview, sectionId: string): RecallItem | null {
  if (!review.next_retrieval_prompt.trim()) return null;
  return {
    id: nid(),
    prompt: review.next_retrieval_prompt,
    conceptId: sectionId,
    scheduledFor: '+2d',
    source: sectionId,
  };
}

export function StudyPhase({ sezioni }: StudyPhaseProps) {
  const [currentSection, setCurrentSection] = useState(sezioni[0] ?? '');
  const [studyData, setStudyData] = useState<StudyModeResponse | null>(null);
  const [textAnchors, setTextAnchors] = useState<TextAnchor[]>([]);
  const [conceptLinks, setConceptLinks] = useState<ConceptLink[]>([]);
  const [trace, setTrace] = useState<LearningTraceState>(initialTrace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentIndex = Math.max(0, sezioni.indexOf(currentSection));

  const loadSection = async (sectionId: string) => {
    if (!sectionId) return;
    setLoading(true);
    setError(null);
    setTextAnchors([]);
    setConceptLinks([]);
    try {
      const data = await getStudyMode(sectionId);
      setStudyData(data);
      setCurrentSection(sectionId);
      setTrace((prev) => ({
        ...prev,
        concept: conceptFromStudyData(sectionId, data),
        claims: [],
        events: appendCurrentEvent(prev.events, event({
          glyph: 'read',
          tone: 'indigo',
          text: `Now reading ${readableSection(sectionId)}.`,
          meta: 'document focus',
          now: true,
        })),
      }));

      const topics = data.mutazioni_attive.map((m) => m.target).filter(Boolean).slice(0, 4);
      Promise.all([
        generateTextAnchors({
          documentId: sectionId,
          selectedTopics: topics,
          documentExcerpt: data.testo_originale,
          demoMode: false,
        }),
        generateConceptLinks({
          documentId: sectionId,
          selectedTopics: topics,
          documentExcerpt: data.testo_originale,
          learnerTraceSummary: conceptFromStudyData(sectionId, data).rationale,
          demoMode: false,
        }),
      ])
        .then(([anchors, links]) => {
          setTextAnchors(anchors.anchors);
          setConceptLinks(links.links);
        })
        .catch((err) => {
          console.warn('[Shrodinger] live augmentation failed; continuing with checkpoint UI only.', err);
        });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection) loadSection(currentSection);
  }, []);

  const goToSection = (index: number) => {
    if (loading) return;
    const nextSection = sezioni[index];
    if (!nextSection || nextSection === currentSection) return;
    loadSection(nextSection);
  };

  const goBack = () => goToSection(currentIndex - 1);
  const goNext = () => goToSection(currentIndex + 1);
  const resetSections = () => goToSection(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') goBack();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleInteraction = async (concetto: string, esito: 'superato' | 'fallito') => {
    try {
      const res = await recordInteraction({
        concetto_target: concetto,
        esito,
        sezione_attuale_id: currentSection,
      });
      if (studyData) {
        setStudyData((prev) =>
          prev
            ? { ...prev, mutazioni_attive: res.mutazioni_conseguenti, stato_grafo: res.nuovo_stato }
            : prev,
        );
      }
      setTrace((prev) => ({
        ...prev,
        concept: { ...prev.concept, strength: strengthFromBrain(res.nuovo_stato) },
        events: appendCurrentEvent(prev.events, event({
          glyph: esito === 'superato' ? 'ok' : 'x',
          tone: esito === 'superato' ? 'green' : 'red',
          text: `${concetto} marked ${esito === 'superato' ? 'understood' : 'fragile'}.`,
          meta: 'learning graph updated',
          now: true,
        })),
      }));
    } catch {
      setTrace((prev) => ({
        ...prev,
        events: appendCurrentEvent(prev.events, event({
          glyph: '!',
          tone: 'amber',
          text: 'Learning graph update did not complete.',
          meta: 'non-blocking',
          now: true,
        })),
      }));
    }
  };

  const handleClaimReview = (review: ClaimReview, usedFallback: boolean) => {
    const recall = recallFromReview(review, currentSection);
    setTrace((prev) => ({
      ...prev,
      claims: review.claims.slice(0, 5),
      recall: recall
        ? [recall, ...prev.recall.filter((item) => item.prompt !== recall.prompt)].slice(0, 5)
        : prev.recall,
      events: appendCurrentEvent(prev.events, event({
        glyph: 'o',
        tone: 'indigo',
        text: `${review.claims.length} claims measured from the checkpoint answer.`,
        meta: usedFallback ? 'demo fallback' : 'check-claim',
        now: true,
      })),
    }));
  };

  const handleClaimRepair = (review: ClaimReview, revisedAnswer: string) => {
    const fossils: MistakeFossil[] = review.claims.filter(isMajorMistake).map((claim) => ({
      id: nid(),
      claimId: claim.id,
      before: claim.text,
      after: revisedAnswer || claim.improvement || review.suggested_revision,
      rationale: claim.rationale,
      capturedAt: now(),
      sectionId: currentSection,
    }));

    const repairedClaims = review.claims.map((claim) =>
      claim.verdict === 'incorrect' || claim.verdict === 'partial'
        ? {
            ...claim,
            verdict: 'correct' as const,
            text: claim.improvement ?? claim.text,
            rationale: claim.improvement ?? claim.rationale,
            improvement: null,
          }
        : claim,
    );

    setTrace((prev) => ({
      ...prev,
      concept: { ...prev.concept, strength: Math.max(prev.concept.strength, 78) },
      claims: repairedClaims,
      fossils: fossils.length > 0 ? [...fossils, ...prev.fossils].slice(0, 6) : prev.fossils,
      events: appendCurrentEvent(prev.events, event({
        glyph: 'fix',
        tone: 'green',
        text: fossils.length > 0 ? 'Mistake fossil created from the revision.' : 'Revision recorded.',
        meta: 'claim repaired',
        now: true,
      })),
    }));
  };

  const handleChallengeRecorded = (claim: Claim, note: string) => {
    setTrace((prev) => ({
      ...prev,
      events: appendCurrentEvent(prev.events, event({
        glyph: '?',
        tone: 'amber',
        text: `Challenge recorded for ${claim.label}: ${note}`,
        meta: 'student challenge',
        now: true,
      })),
    }));
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_var(--side-w)] h-[calc(100vh-var(--topbar-h))]">
      <div className="overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-[12px] text-indigo">Preparing document interventions...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="m-8 p-4 rounded-lg border border-wrong-edge bg-wrong-soft text-wrong text-[14px] font-mono">
            Error: {error}
          </div>
        )}

        {!loading && !error && studyData && (
          <LiveDocument
            sectionId={currentSection}
            testo={studyData.testo_originale}
            mutazioni={studyData.mutazioni_attive}
            onInteraction={handleInteraction}
            onClaimReview={handleClaimReview}
            onClaimRepair={handleClaimRepair}
            onChallengeRecorded={handleChallengeRecorded}
            textAnchors={textAnchors}
            conceptLinks={conceptLinks}
          />
        )}

        {!loading && !error && !studyData && sezioni.length > 0 && (
          <div className="flex items-center justify-center h-64">
            <button className="btn btn-indigo" onClick={() => loadSection(sezioni[0])}>
              Start reading
            </button>
          </div>
        )}
      </div>
      <SectionControls
        currentIndex={currentIndex}
        currentSection={currentSection}
        loading={loading}
        sections={sezioni}
        onBack={goBack}
        onJump={goToSection}
        onNext={goNext}
        onReset={resetSections}
      />
      <LearningTraceSidebar trace={trace} />
    </div>
  );
}

function SectionControls({
  currentIndex,
  currentSection,
  loading,
  sections,
  onBack,
  onJump,
  onNext,
  onReset,
}: {
  currentIndex: number;
  currentSection: string;
  loading: boolean;
  sections: string[];
  onBack: () => void;
  onJump: (index: number) => void;
  onNext: () => void;
  onReset: () => void;
}) {
  if (sections.length <= 1) return null;

  const total = sections.length;
  const idx = Math.min(Math.max(currentIndex, 0), total - 1);

  return (
    <div className="fixed bottom-4 left-1/2 z-30 flex max-w-[760px] -translate-x-1/2 items-center gap-2.5 rounded-full bg-ink/90 px-3.5 py-1.5 text-paper shadow-[0_12px_30px_oklch(0.20_0.01_270/0.25)]">
      <span className="font-mono text-[10.5px] tracking-[0.1em] text-paper-3">
        {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
      <span className="max-w-[220px] truncate font-serif text-[14px] font-medium">
        {loading ? 'Loading...' : `Reading ${readableSection(currentSection)}`}
      </span>
      <div className="flex max-w-[220px] gap-1 overflow-hidden">
        {sections.map((section, i) => (
          <button
            key={section}
            className="h-1 w-4 shrink-0 rounded-full transition-colors"
            style={{
              background: i === idx
                ? 'oklch(0.78 0.05 280)'
                : i < idx
                  ? 'oklch(0.55 0.14 280)'
                  : 'oklch(0.40 0.01 270)',
            }}
            onClick={() => onJump(i)}
            disabled={loading || i === idx}
            aria-label={`Go to ${readableSection(section)}`}
            title={readableSection(section)}
            type="button"
          />
        ))}
      </div>
      <button
        onClick={onBack}
        disabled={loading || idx <= 0}
        className="rounded-full border border-ink-3 bg-ink-2 px-2.5 py-1 text-[12px] text-paper disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Previous section"
      >
        Back
      </button>
      <button
        onClick={onNext}
        disabled={loading || idx >= total - 1}
        className="rounded-full border border-indigo bg-indigo px-2.5 py-1 text-[12px] text-paper disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Next section"
      >
        Next
      </button>
      <button
        onClick={onReset}
        disabled={loading || idx === 0}
        className="rounded-full border border-ink-3 bg-ink-2 px-2.5 py-1 text-[12px] text-paper disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Return to first section"
      >
        Reset
      </button>
    </div>
  );
}
