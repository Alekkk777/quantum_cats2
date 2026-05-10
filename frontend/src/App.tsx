import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { UploadPhase } from './components/UploadPhase';
import { PlanningPhase } from './components/PlanningPhase';
import { StudyPhase } from './components/StudyPhase';

type AppPhase = 'upload' | 'planning' | 'studying';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('upload');
  const [sezioni, setSezioni] = useState<string[]>([]);
  const [docName, setDocName] = useState('');

  const onUploaded = (sections: string[], filename: string) => {
    setSezioni(sections);
    setDocName(filename);
    setPhase('planning');
  };

  const onPlanningComplete = () => {
    setPhase('studying');
  };

  return (
    <>
      <TopBar
        documentTitle={docName || 'Shrodinger Study'}
        chapterCrumb={phase === 'studying' ? `${sezioni.length} sections` : ''}
        status={phase === 'studying' ? 'studying' : 'idle'}
        onExportTrace={() => alert('Trace exported as JSON.')}
        onSaveSession={() => alert('Session saved.')}
      />

      {phase === 'upload' && (
        <UploadPhase onUploaded={onUploaded} />
      )}

      {phase === 'planning' && (
        <PlanningPhase onComplete={onPlanningComplete} />
      )}

      {phase === 'studying' && (
        <StudyPhase sezioni={sezioni} />
      )}
    </>
  );
}
