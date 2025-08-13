import CanvasGlowWrapper from "./CanvasGlowWrapper.jsx";

export default function CanvasStage({ canvasRef, audioRef, bg, glow, accent }) {
  return (
    <section className="relative" style={{ background: bg }}>
      <CanvasGlowWrapper glow={glow} color={accent} />
      <canvas ref={canvasRef} className="w-full h-full block" />
      <audio ref={audioRef} crossOrigin="anonymous" hidden />
    </section>
  );
}
