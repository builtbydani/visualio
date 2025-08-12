import React, { useEffect, useMemo, useRef, useState } from "react";

const FRACTAL_PRESETS = {
  Dendrite: { cRe: -0.8,   cIm: 0.156,  scale: 1.8, panX: -0.10, panY: 0.00 },
  Spiral:   { cRe: -0.4,   cIm: 0.6,    scale: 1.6, panX: 0.00,  panY: 0.00 },
  Celtic:   { cRe: -0.390, cIm: -0.587, scale: 1.7, panX: 0.05,  panY: 0.00 },
  Rabbit:   { cRe: -0.123, cIm: 0.745,  scale: 1.9, panX: 0.00,  panY: 0.00 },
};
/**
 * Audio Visualizer — Three Modes
 * - EQ Bars (spectrum)
 * - Fluid (metaball glow that dances to bass)
 * - Fractal (animated Julia set that pulses to the music)
 *
 * Drop-in React component using Canvas2D + Web Audio API.
 * Tailwind for UI. No external libs.
 *
 * Usage: <AudioVisualizer /> in any React app (Vite recommended).2048
 */
export default function AudioVisualizer() {
  // UI State
  const [mode, setMode] = useState("eq"); // 'eq' | 'fluid' | 'fractal'
  const [preset, setPreset] = useState("Vapor");
  const [bg, setBg] = useState("#0b0b14");
  const [fg, setFg] = useState("#9af2d0");
  const [accent, setAccent] = useState("#b9a7ff");
  const [glow, setGlow] = useState(0.4); // 0..1 (lower default for perf)
  const [sensitivity, setSensitivity] = useState(1.0); // 0.4..2.0 is nice
  const [renderScale, setRenderScale] = useState(0.75); // 0.5..1 affects internal buffers
  const [isPlaying, setIsPlaying] = useState(false);
  const [fractalStyle, setFractalStyle] = useState('dynamic');
  const [fractalPreset, setFractalPreset] = useState('Dendrite');
  const [fractalZoomSpeed, setFractalZoomSpeed] = useState(0.06);
  const MAX_ZOOM = 35;

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const freqDataRef = useRef(null);
  const timeDataRef = useRef(null);
  const rafRef = useRef(0);
  const offscreenRef = useRef(null); // for fractal low-res
  const fractalZoomRef = useRef(1);
  const fractalLastTRef = useRef(0);

  // Presets
  const PRESETS = useMemo(
    () => ({
      Vapor: { bg: "#0b0b14", fg: "#aee6ff", accent: "#ff9ad9" },
      Neon: { bg: "#0c0c0c", fg: "#00ffd1", accent: "#ff00e5" },
      Candy: { bg: "#1a1023", fg: "#ffb3c7", accent: "#b9a7ff" },
      Sunset: { bg: "#0b0d12", fg: "#ffdca8", accent: "#ff9b73" },
      Mono: { bg: "#0c0c0e", fg: "#e6e6e6", accent: "#8a8a8a" },
    }),
    []
  );

  
  
  useEffect(() => {
    // Apply preset colors when changed
    const p = PRESETS[preset];
    if (p) {
      setBg(p.bg);
      setFg(p.fg);
      setAccent(p.accent);
    }
  }, [preset, PRESETS]);

  // Audio setup
  const ensureAudio = async () => {
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
    }
    if (!analyserRef.current) {
      const ctx = audioCtxRef.current;
      const audioEl = audioRef.current;
      if (!audioEl) return;
      const src = ctx.createMediaElementSource(audioEl);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048; // 1024 or 2048 nice balance
      analyser.smoothingTimeConstant = 0.7; // snappier response
      src.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeDataRef.current = new Uint8Array(analyser.fftSize);
    }
  };

  // File handling
  const onFile = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.src = url;
    audioEl.load();
    await ensureAudio();
    await audioCtxRef.current.resume();
    audioEl.play();
    setIsPlaying(true);
  };

  // Drag + drop
  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const onDragOver = (e) => {
      e.preventDefault();
      el.classList.add("ring-2", "ring-pink-400");
    };
    const onLeave = () => el.classList.remove("ring-2", "ring-pink-400");
    const onDrop = (e) => {
      e.preventDefault();
      onLeave();
      const f = e.dataTransfer?.files?.[0];
      if (f) onFile(f);
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // logical pixels

      if (!offscreenRef.current) {
        offscreenRef.current = document.createElement("canvas");
      }
      const off = offscreenRef.current;
      // Low-res buffer for fractal; scale later
      off.width = Math.max(160, Math.floor(canvas.clientWidth * renderScale * 0.5));
      off.height = Math.max(120, Math.floor(canvas.clientHeight * renderScale * 0.5));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let lastT = 0;
    const render = (t) => {
      const analyser = analyserRef.current;
      if (analyser) {
        analyser.getByteFrequencyData(freqDataRef.current);
        analyser.getByteTimeDomainData(timeDataRef.current);
      }

      // Analysis helpers
      const freq = freqDataRef.current || new Uint8Array(1024);
      const time = timeDataRef.current || new Uint8Array(2048);

      // Crude band windows
      const bass = avg(freq, 2, 24) / 255; // ~lowest bins
      const mids = avg(freq, 24, 96) / 255;
      const highs = avg(freq, 96, 256) / 255;
      const level = clamp(
        (rms(time) / 128) * 0.8 + (bass * 0.4 + mids * 0.3 + highs * 0.3),
        0,
        1
      );

      // Clear with bg + optional vignette
      fillBackground(ctx, canvas, bg, glow);

      let zoom = 1;
      if (mode === "fractal" && fractalStyle === "preset") {
        const prev = fractalLastTRef.current || t;
        const dt = Math.max(0, (t - prev) / 1000);
        fractalLastTRef.current = t;

        const growth = Math.exp(fractalZoomSpeed * dt);
        fractalZoomRef.current *= growth;

        if (fractalZoomRef.current > MAX_ZOOM) {
          fractalZoomRef.current = 1.0;
        }
        zoom = fractalZoomRef.current;
      } else {
        fractalLastTRef.current = t;
        fractalZoomRef.current = 1.0;
      }

      if (mode === "eq") {
        drawEQ(ctx, canvas, freq, { fg, accent, glow, sensitivity });
      } else if (mode === "fluid") {
        drawFluid(ctx, canvas, t, { bass, mids, highs, fg, accent, glow, sensitivity });
      } else if (mode === "fractal") {
        drawFractal(ctx, canvas, offscreenRef.current, t, {
          level, fg, accent, glow, sensitivity,
          style: fractalStyle,
          preset: fractalPreset,
          zoom,
        });
      }

      lastT = t;
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [mode, bg, fg, accent, glow, sensitivity, renderScale, fractalStyle, fractalPreset]);

  // Controls
  const onPreset = (name) => setPreset(name);
  const onPick = (setter) => (e) => setter(e.target.value);
  const togglePlay = async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (!audioCtxRef.current) await ensureAudio();
    await audioCtxRef.current.resume();
    if (audioEl.paused) {
      audioEl.play();
      setIsPlaying(true);
    } else {
      audioEl.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="h-screen w-full grid grid-rows-[auto_1fr] bg-neutral-950 text-neutral-100">
      {/* Top Bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 backdrop-blur sticky top-0 z-10">
        <h1 className="text-lg sm:text-xl font-bold tracking-wide">
          Audio Visualizer <span className="text-neutral-400">— EQ · Fluid · Fractal</span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <label className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer text-sm">
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            Load Audio
          </label>
          <button onClick={togglePlay} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm">
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </header>

      {/* Main Area */}
      <main className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
        {/* Controls */}
        <aside className="p-4 border-r border-white/10 space-y-4 bg-black/30">
          <section>
            <h2 className="text-sm uppercase tracking-widest text-neutral-400 mb-2">Mode</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "eq", label: "EQ Bars" },
                { id: "fluid", label: "Fluid" },
                { id: "fractal", label: "Fractal" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={
                    "px-3 py-2 rounded-xl text-sm border " +
                    (mode === m.id
                      ? "border-white/40 bg-white/10"
                      : "border-white/10 hover:bg-white/5")
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm uppercase tracking-widest text-neutral-400 mb-2">Presets</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PRESETS).map((name) => (
                <button
                  key={name}
                  onClick={() => onPreset(name)}
                  className={
                    "px-3 py-1.5 rounded-xl text-sm border " +
                    (preset === name
                      ? "border-white/40 bg-white/10"
                      : "border-white/10 hover:bg-white/5")
                  }
                  title={`${name} preset`}
                >
                  {name}
                </button>
              ))}
            </div>
          </section>

          {/* Fractal Options */}
          <section>
            <h2 className="
              text-sm uppercase 
              tracking-widest 
              text-neutral-400 mb-2
            ">
              Fractal Options
            </h2>

            <div className="flex gap-2 mb-2">
              {[
                { id: 'dynamic', label: 'Dynamic' },
                { id: 'preset',  label: 'Preset'  },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFractalStyle(opt.id)}
                  className={
                    "px-3 py-1.5 rounded-xl text-sm border " +
                    (fractalStyle === opt.id
                      ? "border-white/40 bg-white/10"
                      : "border-white/10 hover:bg-white/5")
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {fractalStyle === 'preset' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-400">Preset</label>
                <select
                  value={fractalPreset}
                  onChange={(e) => setFractalPreset(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm"
                >
                  {Object.keys(FRACTAL_PRESETS).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            )}
            {fractalStyle === 'preset' && (
              <div className="mt-2">
                <label className="block text-xs text-neutral-400 mb-1">Preset Zoom Speed</label>
                <input
                  type="range"
                  min={0.02}
                  max={0.25}
                  step={0.01}
                  value={fractalZoomSpeed}
                  onChange={(e) => setFractalZoomSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Background</label>
              <input type="color" value={bg} onChange={onPick(setBg)} className="w-full h-10 rounded" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Primary</label>
              <input type="color" value={fg} onChange={onPick(setFg)} className="w-full h-10 rounded" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Accent</label>
              <input type="color" value={accent} onChange={onPick(setAccent)} className="w-full h-10 rounded" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Glow</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={glow}
                onChange={(e) => setGlow(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-neutral-400 mb-1">Sensitivity</label>
              <input
                type="range"
                min={0.4}
                max={2.0}
                step={0.05}
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-neutral-400 mb-1">Quality</label>
              <input
                type="range"
                min={0.5}
                max={1}
                step={0.05}
                value={renderScale}
                onChange={(e) => setRenderScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </section>

          <p className="text-xs text-neutral-400">Tip: Drag & drop an MP3 anywhere on the canvas.</p>
        </aside>

        {/* Canvas Stage */}
        <section
          className="relative"
          style={{ background: bg }}
        >
          <CanvasGlowWrapper glow={glow} color={accent} />
          <canvas ref={canvasRef} className="w-full h-full block" />
          <audio ref={audioRef} crossOrigin="anonymous" hidden />
        </section>
      </main>
    </div>
  );
}

/* ==================== Drawing Helpers ==================== */
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function avg(arrLike, start = 0, end = arrLike.length) {
  const n = Math.max(1, end - start);
  let s = 0;
  for (let i = start; i < end && i < arrLike.length; i++) s += arrLike[i];
  return s / n;
}
function rms(timeData) {
  // Center around 128 for getByteTimeDomainData
  let s = 0;
  for (let i = 0; i < timeData.length; i++) {
    const d = timeData[i] - 128;
    s += d * d;
  }
  return Math.sqrt(s / timeData.length);
}

function fillBackground(ctx, canvas, bg, glow) {
  // Gradient vignette
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const g = ctx.createRadialGradient(w * 0.5, h * 0.55, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
  g.addColorStop(0, hexToRgba(bg, 1));
  g.addColorStop(1, hexToRgba(bg, clamp(1 - glow * 0.15, 0.7, 1)));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function hexToRgba(hex, a = 1) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}

/* ============ Mode: EQ BARS ============ */
function drawEQ(ctx, canvas, freq, { fg, accent, glow, sensitivity }) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const N = 80; // number of bars
  const binStep = Math.floor(freq.length / (N * 1.2));
  const bw = w / N;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < N; i++) {
    const start = Math.floor(i * binStep);
    const end = Math.floor(start + binStep);
    const v = avg(freq, start, end) / 255;
    const amp = Math.pow(v * sensitivity, 1.2);
    const bh = amp * (h * 0.9);
    const x = i * bw + bw * 0.1;
    const y = h - bh;

    // Bar gradient (cheap glow baked in via brighter top)
    const g = ctx.createLinearGradient(0, y, 0, h);
    g.addColorStop(0, hexToRgba(accent, 0.95));
    g.addColorStop(0.6, hexToRgba(fg, 0.8));
    g.addColorStop(1, hexToRgba(fg, 0.15));

    const radius = Math.min(12, bw * 0.25);
    roundRect(ctx, x, y, bw * 0.8, bh, radius);
    ctx.fillStyle = g;
    ctx.fill();

    // Faux glow: draw a soft overlay without expensive shadowBlur
    if (glow > 0.01) {
      ctx.globalAlpha = 0.12 * glow;
      roundRect(ctx, x - 1, y - 2, bw * 0.8 + 2, bh + 4, radius + 1);
      ctx.fillStyle = hexToRgba(accent, 1);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ============ Mode: FLUID (Metaballs) ============ */
const MB_STATE = { balls: [], initialized: false, w: 0, h: 0, bassEnv: 0 };

function ensureMetaballs(w, h) {
  if (MB_STATE.initialized && MB_STATE.w === w && MB_STATE.h === h) return MB_STATE;
  MB_STATE.w = w; MB_STATE.h = h;
  MB_STATE.balls = new Array(10).fill(0).map(() => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    r: 36 + Math.random() * 60,
    phase: Math.random() * Math.PI * 2,
    wobble: 0.06 + Math.random() * 0.12,
  }));
  MB_STATE.initialized = true;
  return MB_STATE;
}

function drawFluid(ctx, canvas, t, { bass, mids, highs, fg, accent, glow, sensitivity }) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const { balls } = ensureMetaballs(w, h);

  // Envelope followers for responsiveness
  MB_STATE.bassEnv = Math.max(bass, MB_STATE.bassEnv - 0.02); // slow decay
  const pulse = 1 + MB_STATE.bassEnv * sensitivity * 1.8;
  const swing = 0.6 + (mids * 0.6 + highs * 0.2) * sensitivity;

  // Light trails: very cheap fade
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = hexToRgba("#000", 1);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const b of balls) {
    // Subtle wandering
    b.vx += (Math.random() - 0.5) * 0.02;
    b.vy += (Math.random() - 0.5) * 0.02;
    b.x += b.vx * swing;
    b.y += b.vy * swing;
    if (b.x < -120 || b.x > w + 120) b.vx *= -1;
    if (b.y < -120 || b.y > h + 120) b.vy *= -1;

    b.phase += b.wobble + MB_STATE.bassEnv * 0.05;
    const squash = 0.85 + Math.sin(b.phase) * 0.15;
    const stretch = 2 - squash;

    const R = b.r * pulse;

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(stretch, squash);

    const grad = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
    grad.addColorStop(0, hexToRgba(accent, 0.85));
    grad.addColorStop(0.35, hexToRgba(fg, 0.65));
    grad.addColorStop(1, hexToRgba(fg, 0.02));

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();

    // Rippling rim
    const ripple = 0.06 + MB_STATE.bassEnv * 0.10 + Math.sin(t * 0.003 + b.phase) * 0.03;
    const r1 = R * (1.05 + ripple);
    const r2 = R * (1.20 + ripple * 1.5);

    ctx.globalAlpha = 0.12 + 0.15 * glow;
    ctx.beginPath();
    ctx.arc(0, 0, r1, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(accent, 1);
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.globalAlpha = 0.06 + 0.12 * glow;
    ctx.beginPath();
    ctx.arc(0, 0, r2, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(fg, 1);
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.restore();
  }
  ctx.restore();
}

/* ============ Mode: FRACTAL (Julia Set) ============ */
function drawFractal(ctx, canvas, off, t, {
  level, fg, accent, glow, sensitivity,
  style = 'dynamic', preset = 'Dendrite',
  zoom = 1,
}) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const ow = off.width, oh = off.height;
  const octx = off.getContext("2d");

  // Choose parameters
  let cRe, cIm, scale, panX, panY;
  if (style === 'preset') {
    const p = FRACTAL_PRESETS[preset] || FRACTAL_PRESETS.Dendrite;
    ({ cRe, cIm, scale, panX, panY } = p);
  } else {
    // Dynamic: gently orbit around a classic point
    const baseRe = -0.8, baseIm = 0.156;
    const jitter = 0.06 + level * 0.06;
    cRe = baseRe + Math.cos(t * (0.0009 + 0.0006 * sensitivity)) * jitter;
    cIm = baseIm + Math.sin(t * (0.0011 + 0.0005 * sensitivity)) * jitter * 0.8;
    scale = 1.8; panX = -0.10; panY = 0.0;
  }

  const effectiveScale = scale * zoom;

  const img = octx.getImageData(0, 0, ow, oh);
  const data = img.data;
  const iterMax = Math.floor(56 + level * 60);

  const [r1, g1, b1] = hexToRgb(fg);
  const [r2, g2, b2] = hexToRgb(accent);

  // Music brightness pulse (applied to colors)
  const bright = Math.max(0.6, Math.min(1.4, 0.80 + level * 0.60));

  let i = 0;
  for (let y = 0; y < oh; y++) {
    const ny = ((y / oh - 0.5) * 2.0) / effectiveScale + panY;
    for (let x = 0; x < ow; x++) {
      const nx = (((x / ow - 0.5) * (w / h) * 2.0) / effectiveScale) + panX;

      let zr = nx, zi = ny;
      let iter = 0, zr2 = 0, zi2 = 0;
      while ((zr2 = zr * zr) + (zi2 = zi * zi) < 4 && iter < iterMax) {
        zi = 2 * zr * zi + cIm;
        zr = zr2 - zi2 + cRe;
        iter++;
      }

      if (iter === iterMax) {
        // keep interior dim so shape isn't a paint bucket
        data[i++] = Math.floor(r1 * 0.10);
        data[i++] = Math.floor(g1 * 0.10);
        data[i++] = Math.floor(b1 * 0.10);
        data[i++] = 255;
        continue;
      }

      const log_zn = Math.log(zr2 + zi2) / 2;
      const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
      const tcol = iter + 1 - nu;
      const norm = Math.min(1, tcol / iterMax);

      let R = Math.floor(lerp(r1, r2, Math.pow(norm, 0.65)) * bright);
      let G = Math.floor(lerp(g1, g2, Math.pow(norm, 0.65)) * bright);
      let B = Math.floor(lerp(b1, b2, Math.pow(norm, 0.65)) * bright);
      data[i++] = Math.min(255, R);
      data[i++] = Math.min(255, G);
      data[i++] = Math.min(255, B);
      data[i++] = 255;
    }
  }
  octx.putImageData(img, 0, 0);

  // Composite with optional soft glow
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  if (glow > 0.05) {
    ctx.filter = `blur(${Math.round(2 + 5 * glow)}px)`;
    ctx.globalAlpha = 0.6;
    ctx.drawImage(off, 0, 0, w, h);
    ctx.filter = 'none';
  }
  ctx.globalAlpha = 0.95;
  ctx.drawImage(off, 0, 0, w, h);
  ctx.restore();
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  const bigint = parseInt(full, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

/* ============ Canvas UI Glow Overlay ============ */
function CanvasGlowWrapper({ glow, color }) {
  const style = {
    boxShadow: `inset 0 0 60px ${hexToRgba(color, 0.25 * glow)}, inset 0 0 240px ${hexToRgba(color, 0.15 * glow)}`,
  };
  return <div className="absolute inset-0 pointer-events-none" style={style} />;
}

