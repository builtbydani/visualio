import React, { useRef } from "react";

import useVisualizerState from "./hooks/useVisualizerState.js";
import useAudioAnalyser from "./hooks/useAudioAnalyser.js";
import useVisualizerRender from "./hooks/useVisualizerRender.js";
import useDragDrop from "./hooks/useDragDrop.js";

import TopBar from "./components/TopBar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import CanvasStage from "./components/CanvasStage.jsx";


/**
 * Audio Visualizer — Three Modes
 * - EQ Bars (spectrum)
 * - Fluid (metaball glow that dances to bass)
 * - Fractal (animated Julia set that pulses to the music)
 *
 * Drop-in React component using Canvas2D + Web Audio API.
 * Tailwind for UI. No external libs.
 *
 * Usage: <AudioVisualizer /> in any React app (Vite recommended)
 */
export default function AudioVisualizer() {
  const ui = useVisualizerState();
  const { 
    audioRef,
    analyserRef,
    freqDataRef,
    timeDataRef,
    isPlaying,
    onFile,
    togglePlay
  } = useAudioAnalyser();

  const canvasRef = useRef(null);
  const hostRef = useRef(null);

  useVisualizerRender({ canvasRef, analyserRef, freqDataRef, timeDataRef, ui });
  useDragDrop(hostRef, onFile);

  return (
    <div
      ref={hostRef}
      className="h-screen w-full grid grid-rows-[auto_1fr] bg-neutral-950 text-neutral-100">
      <TopBar 
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onPickFile={onFile} />
      <main className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
        <Sidebar {...ui} />
        <CanvasStage 
          canvasRef={canvasRef} 
          audioRef={audioRef}
          bg={ui.bg}
          glow={ui.glow}
          accent={ui.accent} />
      </main>
    </div>
  );
}
