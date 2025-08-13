export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }

export function avg(arrLike, start = 0, end = arrLike.length) {
  const n = Math.max(1, end - start);
  let s = 0;
  for (let i = start; i < end && i < arrLike.length; i++) s += arrLike[i];
  return s / n;
}

export function rms(timeData) {
  // Center around 128 for getByteTimeDomainData
  let s = 0;
  for (let i = 0; i < timeData.length; i++) {
    const d = timeData[i] - 128;
    s += d * d;
  }
  return Math.sqrt(s / timeData.length);
}

export function hexToRgba(hex, a = 1) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  const bigint = parseInt(full, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function fillBackground(ctx, canvas, bg, glow) {
  // Gradient vignette in logical pixels
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const vignette = ctx.createRadialGradient(
    w * 0.5, h * 0.55, Math.min(w, h) * 0.2,
    w * 0.5, h * 0.5,  Math.max(w, h) * 0.8
  );
  vignette.addColorStop(0, hexToRgba(bg, 1));
  vignette.addColorStop(1, hexToRgba(bg, Math.max(0.7, 1 - glow * 0.15)));
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}
