import { useCallback, useRef, useState } from 'react';

export function useAudioRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const message = 'Voice recording is not available in this browser.';
      setError(message);
      throw new Error(message);
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      cleanup();
      setIsRecording(false);
      const message = err instanceof Error ? err.message : 'Could not start recording.';
      setError(message);
      throw err;
    }
  }, [cleanup, isSupported]);

  const stopRecording = useCallback(() => {
    return new Promise<Blob | null>((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false);
        cleanup();
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const blob = chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type }) : null;
        setIsRecording(false);
        cleanup();
        resolve(blob);
      };
      recorder.stop();
    });
  }, [cleanup]);

  return {
    error,
    isRecording,
    isSupported,
    clearError: () => setError(null),
    startRecording,
    stopRecording,
  };
}
