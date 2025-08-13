import { useEffect, useRef } from "react";
import { FRACTAL_PRESETS, MAX_ZOOM } from "../config/fractals.js";
import { clamp, avg, rms, fillBackground } from "../render/common.js";
import { drawEQ } from "../render/eq.js";
import { drawFluid } from "../render/fluid.js";
import { drawFractal } from "../render/fractal.js";

export default function useVisualizerRender({
  canvasRef,
  analyserRef,
  freqDataRef,
  timeDataRef,
  ui: { mode, bg, fg, accent, glow, sensitivity, renderScale, fractalStyle, fractalPreset, fractalZoomSpeed },
}) {
  const rafRef = useRef(0);
  const frameRef = useRef(0);
  const bloomRef = useRef(null);
  const offscreenRef = useRef(null);
  const fractalZoomRef = useRef(1);
  const fractalLastTRef = useRef(0);
  const fractalQualityRef = useRef(0.75);
  const fractalIterRef = useRef(96);
  const fractalPerfRef = useRef({ lastResizeW: 0, lastResizeH: 0 });
  const fractalDirtyPassesRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!offscreenRef.current) offscreenRef.current = document.createElement("canvas");
      const off = offscreenRef.current;
      off.width = Math.max(160, Math.floor(canvas.clientWidth * renderScale * 0.5));
      off.height = Math.max(120, Math.floor(canvas.clientHeight * renderScale * 0.5));

      if (!bloomRef.current) bloomRef.current = document.createElement("canvas");
      const bloom = bloomRef.current;
      const bw = Math.max(64, Math.floor(canvas.clientWidth * renderScale * 0.25));
      const bh = Math.max(48, Math.floor(canvas.clientHeight * renderScale * 0.25));
      if (bloom.width !== bw || bloom.height !== bh) { bloom.width = bw; bloom.height = bh; }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const render = (t) => {
      frameRef.current++;
      const phase = frameRef.current & 1;

      const analyser = analyserRef.current;
      if (analyser) {
        analyser.getByteFrequencyData(freqDataRef.current);
        analyser.getByteTimeDomainData(timeDataRef.current);
      }
      const freq = freqDataRef.current || new Uint8Array(1024);
      const time = timeDataRef.current || new Uint8Array(2048);

      const bass = avg(freq, 2, 24) / 255;
      const mids = avg(freq, 24, 96) / 255;
      const highs = avg(freq, 96, 256) / 255;
      const level = clamp((rms(time) / 128) * 0.8 + (bass * 0.4 + mids * 0.3 + highs * 0.3), 0, 1);

      fillBackground(ctx, canvas, bg, glow);

      let zoom = 1;
      if (mode === "fractal" && fractalStyle === "preset") {
        const prev = fractalLastTRef.current || t;
        const dt = Math.max(0, (t - prev) / 1000);
        fractalLastTRef.current = t;
        const growth = Math.exp(fractalZoomSpeed * dt);
        fractalZoomRef.current *= growth;
        if (fractalZoomRef.current > MAX_ZOOM) fractalZoomRef.current = 1.0;
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
        const off = offscreenRef.current;
        if (off) {
          const targetW = Math.max(120, Math.floor(canvas.clientWidth * renderScale * fractalQualityRef.current * 0.5));
          const targetH = Math.max(90, Math.floor(canvas.clientHeight * renderScale * fractalQualityRef.current * 0.5));
          if (targetW !== fractalPerfRef.current.lastResizeW || targetH !== fractalPerfRef.current.lastResizeH) {
            off.width = targetW; off.height = targetH;
            fractalPerfRef.current.lastResizeW = targetW;
            fractalPerfRef.current.lastResizeH = targetH;
            fractalDirtyPassesRef.current = 2;
          }
        }
        const t0 = performance.now();

        if (fractalDirtyPassesRef.current > 0) {
          drawFractal(ctx, canvas, off, t, { level, fg, accent, glow, sensitivity, style: fractalStyle, preset: fractalPreset, zoom, iterMaxOverride: fractalIterRef.current, phase, bloomRef });
          drawFractal(ctx, canvas, off, t, { level, fg, accent, glow, sensitivity, style: fractalStyle, preset: fractalPreset, zoom, iterMaxOverride: fractalIterRef.current, phase, bloomRef });
        } else {
          if (frameRef.current % 2 === 0) {
            drawFractal(ctx, canvas, off, t, { level, fg, accent, glow, sensitivity, style: fractalStyle, preset: fractalPreset, zoom, iterMaxOverride: fractalIterRef.current, phase, bloomRef });
          }
          ctx.drawImage(off, 0, 0, canvas.clientWidth, canvas.clientHeight);
          ctx.save(); ctx.globalAlpha = 0.05; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight); ctx.restore();
        }

        // Dynamic perf target ~12ms per fractal pass
        const dt = performance.now() - t0;
        const targetMs = 12;
        if (dt > targetMs + 2) {
          fractalQualityRef.current = Math.max(0.4, fractalQualityRef.current - 0.05);
          fractalIterRef.current    = Math.max(48, Math.floor(fractalIterRef.current * 0.92));
        } else if (dt < targetMs - 2) {
          fractalQualityRef.current = Math.min(1.0, fractalQualityRef.current + 0.02);
          fractalIterRef.current    = Math.min(220, Math.floor(fractalIterRef.current * 1.02));
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [canvasRef, analyserRef, freqDataRef, timeDataRef, mode, bg, fg, accent, glow, sensitivity, renderScale, fractalStyle, fractalPreset, fractalZoomSpeed]);
}
