import { useCallback, useRef, useState } from "react";

export default function useAudioAnalyser() {
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const freqDataRef = useRef(null);
  const timeDataRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const ensureAudio = useCallback(async () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (!analyserRef.current && audioRef.current) {
      const ctx = audioCtxRef.current;
      const src = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.7;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeDataRef.current = new Uint8Array(analyser.fftSize);
    }
  }, []);

  const onFile = useCallback(async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (!audioRef.current) return;
    audioRef.current.src = url;
    audioRef.current.load();
    await ensureAudio();
    await audioCtxRef.current.resume();
    audioRef.current.play();
    setIsPlaying(true);
  }, [ensureAudio]);

  const togglePlay = useCallback(async () => {
    const el = audioRef.current; if (!el) return;
    if (!audioCtxRef.current) await ensureAudio();
    await audioCtxRef.current.resume();
    if (el.paused) { el.play(); setIsPlaying(true); }
    else { el.pause(); setIsPlaying(false); }
  }, [ensureAudio]);

  return {
    audioRef,
    audioCtxRef,
    analyserRef,
    freqDataRef,
    timeDataRef,
    isPlaying,
    onFile,
    togglePlay,
  };
}
