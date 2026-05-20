import { useState, useRef, useCallback } from 'react';

const SUPPORTED_MIME = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
];

function getSupportedMimeType() {
  return SUPPORTED_MIME.find((m) => MediaRecorder.isTypeSupported(m)) || '';
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setDuration(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        clearInterval(timerRef.current);
      };

      recorder.start(100);
      setIsRecording(true);

      // Duration timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone permission.'
          : 'Could not access microphone. Please check your device.'
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null; // prevent blob creation
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
    setAudioBlob(null);
    setDuration(0);
    chunksRef.current = [];
  }, []);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
    setError(null);
  }, []);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return {
    isRecording,
    audioBlob,
    error,
    duration,
    formattedDuration: formatDuration(duration),
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecording,
    isSupported: typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
  };
}
