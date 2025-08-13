export const MAX_ZOOM = 10;

export const FRACTAL_PRESETS = {
  Dendrite: { cRe: -0.8,  cIm: 0.156,  scale: 1.8, panX: -0.10, panY: 0.00, interiorDim: 0.10, driftX: 0.010, driftY: 0.010 },
  Spiral:   { cRe: -0.7,  cIm: 0.27015,scale: 1.9, panX: 0.00,  panY: 0.00, interiorDim: 0.07, driftX: 0.012, driftY: 0.014 },
  Celtic:   { cRe: 0.285, cIm: 0.01,   scale: 2.0, panX: 0.00,  panY: 0.00, interiorDim: 0.06, driftX: 0.016, driftY: 0.018 },
  Rabbit:   { cRe: -0.9,  cIm: 0.245,  scale: 1.7, panX: 0.02,  panY: 0.02, interiorDim: 0.08, driftX: 0.018, driftY: 0.020 },
};
