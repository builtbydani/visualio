import { hexToRgba } from "./common.js";

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

export function drawFluid(ctx, canvas, t, { bass, mids, highs, fg, accent, glow, sensitivity }) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const { balls } = ensureMetaballs(w, h);

  MB_STATE.bassEnv = Math.max(bass, MB_STATE.bassEnv - 0.02);
  const pulse = 1 + MB_STATE.bassEnv * sensitivity * 1.8;
  const swing = 0.6 + (mids * 0.6 + highs * 0.2) * sensitivity;

  // Light trails: cheap fade
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = hexToRgba("#000", 1);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const b of balls) {
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
