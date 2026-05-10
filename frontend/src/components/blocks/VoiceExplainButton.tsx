import { useState } from 'react';
import { transcribeAudio } from '../../lib/api';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

interface VoiceExplainButtonProps {
  disabled?: boolean;
  onTranscript: (text: string) => void;
}

export function VoiceExplainButton({ disabled, onTranscript }: VoiceExplainButtonProps) {
  const { clearError, error: recorderError, isRecording, isSupported, startRecording, stopRecording } = useAudioRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    clearError();

    if (!isRecording) {
      try {
        await startRecording();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not start recording.');
      }
      return;
    }

    const audio = await stopRecording();
    if (!audio) {
      setError('No audio was recorded.');
      return;
    }

    try {
      setIsTranscribing(true);
      const result = await transcribeAudio(audio);
      const transcript = result.text.trim();
      if (!transcript) {
        setError('No speech detected. You can still type your answer.');
        return;
      }
      onTranscript(transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed. You can still type your answer.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const message = error ?? recorderError;
  const label = isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Explain by voice';

  return (
    <div className="mt-2">
      <button
        className="btn btn-subtle"
        type="button"
        onClick={handleClick}
        disabled={disabled || isTranscribing || !isSupported}
        title={isSupported ? undefined : 'Voice recording is not available in this browser.'}
      >
        {isRecording && <span className="w-2 h-2 rounded-full bg-wrong pulse-dot" aria-hidden="true" />}
        {label}
      </button>
      {message && (
        <div className="mt-1.5 font-mono text-[10.5px] text-wrong tracking-[0.04em]">
          {message}
        </div>
      )}
    </div>
  );
}
