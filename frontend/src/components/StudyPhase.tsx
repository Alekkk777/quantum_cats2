import { useEffect, useState } from 'react';
import { getStudyMode, recordInteraction } from '../lib/api';
import type { StudyModeResponse, UserBrainState } from '../lib/api';
import { LiveDocument } from './LiveDocument';
import { BrainSidebar } from './BrainSidebar';

interface StudyPhaseProps {
  sezioni: string[];
}

export function StudyPhase({ sezioni }: StudyPhaseProps) {
  const [currentSection, setCurrentSection] = useState(sezioni[0] ?? '');
  const [studyData, setStudyData] = useState<StudyModeResponse | null>(null);
  const [brain, setBrain] = useState<UserBrainState>({ acquisiti: [], in_corso: [], lacune: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSection = async (sectionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudyMode(sectionId);
      setStudyData(data);
      setBrain(data.stato_grafo);
      setCurrentSection(sectionId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection) loadSection(currentSection);
  }, []);

  const handleInteraction = async (concetto: string, esito: 'superato' | 'fallito') => {
    try {
      const res = await recordInteraction({
        concetto_target: concetto,
        esito,
        sezione_attuale_id: currentSection,
      });
      setBrain(res.nuovo_stato);
      if (studyData) {
        setStudyData(prev =>
          prev
            ? { ...prev, mutazioni_attive: res.mutazioni_conseguenti, stato_grafo: res.nuovo_stato }
            : prev
        );
      }
    } catch {
      // non-blocking: grafo update failed silently
    }
  };

  return (
    <div className="grid grid-cols-[1fr_var(--side-w)] h-[calc(100vh-var(--topbar-h))]">
      <div className="overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-[12px] text-indigo">Generando le mutazioni...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="m-8 p-4 rounded-lg border border-wrong-edge bg-wrong-soft text-wrong text-[14px] font-mono">
            Errore: {error}
          </div>
        )}
        {!loading && !error && studyData && (
          <LiveDocument
            sectionId={currentSection}
            testo={studyData.testo_originale}
            mutazioni={studyData.mutazioni_attive}
            onInteraction={handleInteraction}
          />
        )}
        {!loading && !error && !studyData && sezioni.length > 0 && (
          <div className="flex items-center justify-center h-64">
            <button className="btn btn-indigo" onClick={() => loadSection(sezioni[0])}>
              Inizia a leggere →
            </button>
          </div>
        )}
      </div>
      <BrainSidebar
        brain={brain}
        sezioni={sezioni}
        currentSection={currentSection}
        onSelectSection={id => loadSection(id)}
      />
    </div>
  );
}
