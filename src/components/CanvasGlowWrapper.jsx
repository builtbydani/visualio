import React from "react";
import { hexToRgba } from "../render/common.js";

export default function CanvasGlowWrapper({ glow, color }) {
  const style = {
    boxShadow: `inset 0 0 60px ${hexToRgba(color, 0.25 * glow)}, inset 0 0 240px ${hexToRgba(color, 0.15 * glow)}`
  };
  return <div className="absolute inset-0 pointer-events-none" style={style} />;
}
