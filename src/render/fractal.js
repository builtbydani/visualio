import { FRACTAL_PRESETS } from "../config/fractals.js";
import { hexToRgb, lerp } from "./common.js";

export function drawFractal(ctx, canvas, off, t, {
  level, fg, accent, glow, sensitivity,
  style = 'dynamic', preset = 'Dendrite',
  zoom = 1, iterMaxOverride = 96,
  phase = 0, bloomRef
}) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const ow = off.width, oh = off.height;
  const octx = off.getContext("2d");

  // Choose parameters
  let cRe, cIm, scale, panX, panY, interiorDim = 0.08, driftX = 0.012, driftY = 0.012;

  if (style === 'preset') {
    const p = FRACTAL_PRESETS[preset] || FRACTAL_PRESETS.Dendrite;
    ({ cRe, cIm, scale, panX, panY } = p);
    interiorDim = p.interiorDim ?? 0.08;
    driftX = p.driftX ?? driftX;
    driftY = p.driftY ?? driftY;
  } else {
    const baseRe = -0.8, baseIm = 0.156;
    const jitter = 0.06 + level * 0.06;
    cRe = baseRe + Math.cos(t * (0.0009 + 0.0006 * sensitivity)) * jitter;
    cIm = baseIm + Math.sin(t * (0.0011 + 0.0005 * sensitivity)) * jitter * 0.8;
    scale = 1.8; panX = -0.10; panY = 0.0;
    interiorDim = 0.09;
    driftX = 0.008;
    driftY = 0.010;
  }

  const effectiveScale = scale * zoom;
  const z = Math.max(0, Math.log2(Math.max(zoom, 1)));
  const panXEff = panX - driftX * z;
  const panYEff = panY + driftY * z;

  const iterMax = Math.max(40, Math.floor(iterMaxOverride + level * 24));

  const img = octx.getImageData(0, 0, ow, oh);
  const data = img.data;

  const [r1, g1, b1] = hexToRgb(fg);
  const [r2, g2, b2] = hexToRgb(accent);

  const bright = Math.max(0.7, Math.min(1.35, 0.85 + level * 0.55));

  for (let y = phase; y < oh; y += 2) {
    const ny = ((y / oh - 0.5) * 2.0) / effectiveScale + panYEff;
    let i = (y * ow) * 4;
    for (let x = 0; x < ow; x++) {
      const nx = (((x / ow - 0.5) * (w / h) * 2.0) / effectiveScale) + panXEff;

      let zr = nx, zi = ny;
      let iter = 0, zr2 = 0, zi2 = 0;
      while ((zr2 = zr * zr) + (zi2 = zi * zi) < 4 && iter < iterMax) {
        zi = 2 * zr * zi + cIm;
        zr = zr2 - zi2 + cRe;
        iter++;
      }

      if (iter === iterMax) {
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

  const bloom = bloomRef.current;
  const bw = bloom.width; 
  const bh = bloom.height;
  const bctx = bloom.getContext("2d");
  bctx.clearRect(0, 0, bw, bh);
  bctx.globalCompositeOperation = "source-over";
  bctx.globalAlpha = 1;
  bctx.drawImage(off, 0, 0, bw, bh);

  bctx.globalCompositeOperation = "lighter";
  bctx.globalAlpha = 0.5;
  bctx.drawImage(bloom, -1, 0, bw + 1, bh);
  bctx.drawImage(bloom, 0, -1, bw, bh + 1);
  bctx.globalAlpha = 0.35;
  bctx.drawImage(bloom, -2, 0, bw + 2, bh);
  bctx.drawImage(bloom, 0, -2, bw, bh + 2);

  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.6 * glow;
  ctx.drawImage(bloom, 0, 0, w, h);

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.95;
  ctx.drawImage(off, 0, 0, w, h);
  ctx.restore();
}
