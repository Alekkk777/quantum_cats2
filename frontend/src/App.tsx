import { useEffect, useReducer, useState } from 'react';
import { TopBar } from './components/TopBar';
import { SetupOverlay } from './components/SetupOverlay';
import { DemoControls } from './components/DemoControls';
import { StudyDocument } from './components/document/StudyDocument';
import { LearningTraceSidebar } from './components/trace/LearningTraceSidebar';
import { UploadPhase } from './components/UploadPhase';
import { StudyPhase } from './components/StudyPhase';
import { sessionReducer } from './lib/sessionReducer';
import { checkClaimWithFallback } from './lib/checkClaimWithFallback';
import { demoSession, STUDENT_WRONG_ANSWER } from './data/demoSession';
import { QUANTUM_CHECKPOINT_CONTEXT } from './data/documentContent';
import { textAnchorsDemo } from './data/textAnchorsDemo';
import { conceptLinksDemo } from './data/conceptLinksDemo';

const STUDENT_RIGHT_ANSWER =
  "If locality holds, realism must be abandoned. Bell's theorem proves that locality and realism together require Bell's inequality to hold, but experiments violate it. Quantum particles cannot carry pre-existing definite properties — EPR's local hidden variable program is experimentally closed off.";

export default function App() {
  const [session, dispatch] = useReducer(sessionReducer, demoSession);
  const [setupOpen, setSetupOpen] = useState(true);

  // Live mode state
  const [appMode, setAppMode] = useState<'demo' | 'live'>('demo');
  const [liveSections, setLiveSections] = useState<string[]>([]);
  const [liveDocTitle, setLiveDocTitle] = useState('');
  const [liveReady, setLiveReady] = useState(false);

  const cp = session.checkpoints['bell-inequality'];
  const phase = setupOpen ? 'setup' : cp.phase;

  const onSubmitAnswer = async (id: string) => {
    dispatch({ type: 'submit-start', checkpointId: id });
    try {
      const { review, usedFallback } = await checkClaimWithFallback({
        question: cp.question,
        answer: cp.answer,
        context: QUANTUM_CHECKPOINT_CONTEXT,
      });
      dispatch({ type: 'submit-success', checkpointId: id, review, usedFallback });
    } catch (err) {
      dispatch({ type: 'submit-error', checkpointId: id, error: (err as Error).message });
    }
  };

  const onApplyRevision = (id: string) => {
    setTimeout(() => dispatch({ type: 'mark-repaired', checkpointId: id }), 350);
  };

  const next = () => {
    if (phase === 'setup') return setSetupOpen(false);
    if (phase === 'reading') {
      dispatch({ type: 'open-checkpoint', checkpointId: 'bell-inequality' });
      setTimeout(() => dispatch({ type: 'set-answer', checkpointId: 'bell-inequality', answer: STUDENT_WRONG_ANSWER }), 200);
      return;
    }
    if (phase === 'open')      return onSubmitAnswer('bell-inequality');
    if (phase === 'measuring') return dispatch({ type: 'begin-revision', checkpointId: 'bell-inequality' });
    if (phase === 'revising') {
      dispatch({ type: 'apply-revision', checkpointId: 'bell-inequality', revisedAnswer: STUDENT_RIGHT_ANSWER });
      return onApplyRevision('bell-inequality');
    }
  };

  const back = () => {
    if (phase === 'reading')   return setSetupOpen(true);
    if (phase === 'open')      return dispatch({ type: 'open-checkpoint', checkpointId: 'bell-inequality' });
  };

  const reset = () => window.location.reload();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleStart = (cfg: { mode: 'demo' | 'live'; goal: typeof session.goal; depth: typeof session.depth; doc: string }) => {
    setAppMode(cfg.mode);
    if (cfg.mode === 'demo') {
      dispatch({ type: 'start-session', goal: cfg.goal, depth: cfg.depth, doc: cfg.doc });
      setSetupOpen(false);
    } else {
      // Live mode: SetupOverlay closes and UploadPhase takes over
      setSetupOpen(false);
    }
  };

  // ── Live mode ──────────────────────────────────────────────────────────
  if (appMode === 'live') {
    const title = liveDocTitle || 'Your document';
    return (
      <>
        <TopBar
          documentTitle={liveReady ? title : 'Shrodinger — Live mode'}
          chapterCrumb={liveReady ? 'Quantum Cats / Live study' : 'Upload your document'}
          status={liveReady ? 'studying' : 'idle'}
          onExportTrace={() => alert('Trace exported as JSON.')}
          onSaveSession={() => alert('Session saved.')}
        />
        {!liveReady ? (
          <UploadPhase
            onUploaded={(sezioni, filename) => {
              setLiveSections(sezioni);
              setLiveDocTitle(filename);
              setLiveReady(true);
            }}
          />
        ) : (
          <StudyPhase sezioni={liveSections} />
        )}
      </>
    );
  }

  // ── Demo mode ──────────────────────────────────────────────────────────
  return (
    <>
      <TopBar
        documentTitle="Quantum Mechanics, Ch. 2"
        chapterCrumb="Quantum Cats / Notes / Bell's theorem"
        status={phase === 'setup' ? 'idle' : phase === 'measuring' || phase === 'revising' ? 'measuring' : 'studying'}
        onExportTrace={() => alert('Trace exported as JSON.')}
        onSaveSession={() => alert('Session saved.')}
      />

      <div className="grid grid-cols-[1fr_var(--side-w)] min-h-[calc(100vh-var(--topbar-h))]">
        <div className="overflow-y-auto h-[calc(100vh-var(--topbar-h))]">
          <StudyDocument
            session={session}
            dispatch={dispatch}
            onSubmitAnswer={onSubmitAnswer}
            onApplyRevision={onApplyRevision}
            textAnchors={textAnchorsDemo}
            conceptLinks={conceptLinksDemo}
          />
        </div>
        <LearningTraceSidebar trace={session.trace} />
      </div>

      <SetupOverlay
        open={setupOpen}
        onStart={handleStart}
      />

      <DemoControls
        phase={phase}
        usedFallback={cp?.usedFallback}
        onNext={next}
        onBack={back}
        onReset={reset}
      />
    </>
  );
}
