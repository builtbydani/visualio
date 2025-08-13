import { avg, hexToRgba, roundRect } from "./common.js";

export function drawEQ(ctx, canvas, freq, { fg, accent, glow, sensitivity }) {
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

    const g = ctx.createLinearGradient(0, y, 0, h);
    g.addColorStop(0, hexToRgba(accent, 0.95));
    g.addColorStop(0.6, hexToRgba(fg, 0.8));
    g.addColorStop(1, hexToRgba(fg, 0.15));

    const radius = Math.min(12, bw * 0.25);
    roundRect(ctx, x, y, bw * 0.8, bh, radius);
    ctx.fillStyle = g;
    ctx.fill();

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
