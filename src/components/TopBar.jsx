export default function TopBar({ isPlaying, onTogglePlay, onPickFile }) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 backdrop-blur sticky top-0 z-10">
      <h1 className="text-lg sm:text-xl font-bold tracking-wide">
        Audio Visualizer <span className="text-neutral-400">— EQ · Fluid · Fractal</span>
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <label className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer text-sm">
          <input type="file" accept="audio/*" className="hidden" onChange={e=>onPickFile(e.target.files?.[0])} />
          Load Audio
        </label>
        <button onClick={onTogglePlay} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm">
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    </header>
  );
}
