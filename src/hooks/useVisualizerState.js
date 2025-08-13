import { useEffect, useState } from "react";
import { PRESETS } from "../config/colors.js";

export default function useVisualizerState() {
  const [mode, setMode] = useState("eq");
  const [preset, setPreset] = useState("Vapor");
  const [bg, setBg] = useState("#0b0b14");
  const [fg, setFg] = useState("#9af2d0");
  const [accent, setAccent] = useState("#b9a7ff");
  const [glow, setGlow] = useState(0.4);
  const [sensitivity, setSensitivity] = useState(1.0);
  const [renderScale, setRenderScale] = useState(0.75);
  const [fractalStyle, setFractalStyle] = useState("dynamic");
  const [fractalPreset, setFractalPreset] = useState("Dendrite");
  const [fractalZoomSpeed, setFractalZoomSpeed] = useState(0.06);

  // Apply color preset when changed
  useEffect(() => {
    const p = PRESETS[preset];
    if (p) {
      setBg(p.bg); setFg(p.fg); setAccent(p.accent);
    }
  }, [preset]);

  return {
    // values
    mode, preset, bg, fg, accent, glow, sensitivity, renderScale,
    fractalStyle, fractalPreset, fractalZoomSpeed,
    // setters
    setMode, setPreset, setBg, setFg, setAccent, setGlow, setSensitivity, setRenderScale,
    setFractalStyle, setFractalPreset, setFractalZoomSpeed,
  };
}
