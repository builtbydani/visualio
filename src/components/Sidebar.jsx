import ToggleGroup from "./ui/ToggleGroup.jsx";
import ButtonPill from "./ui/ButtonPill.jsx";
import RangeControl from "./ui/RangeControl.jsx";
import ColorControl from "./ui/ColorControl.jsx";
import { FRACTAL_PRESETS } from "../config/fractals.js";
import { PRESETS } from "../config/colors.js";

export default function Sidebar({
  mode, setMode, preset, setPreset,
  bg, setBg, fg, setFg, accent, setAccent,
  glow, setGlow, sensitivity, setSensitivity, renderScale, setRenderScale,
  fractalStyle, setFractalStyle, fractalPreset, setFractalPreset, fractalZoomSpeed, setFractalZoomSpeed,
}) {
  return (
    <aside className="p-4 border-r border-white/10 space-y-4 bg-black/30">
      <section>
        <h2 className="text-sm uppercase tracking-widest text-neutral-400 mb-2">Mode</h2>
        <ToggleGroup
          options={[{id:"eq",label:"EQ Bars"},{id:"fluid",label:"Fluid"},{id:"fractal",label:"Fractal"}]}
          value={mode}
          onChange={setMode}
        />
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-neutral-400 mb-2">Presets</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESETS).map(name => (
            <ButtonPill key={name} active={preset===name} onClick={()=>setPreset(name)} title={`${name} preset`}>
              {name}
            </ButtonPill>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-neutral-400 mb-2">Fractal Options</h2>
        <div className="flex gap-2 mb-2">
          <ButtonPill active={fractalStyle==='dynamic'} onClick={()=>setFractalStyle('dynamic')}>Dynamic</ButtonPill>
          <ButtonPill active={fractalStyle==='preset'} onClick={()=>setFractalStyle('preset')}>Preset</ButtonPill>
        </div>
        {fractalStyle === 'preset' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400">Preset</label>
            <select value={fractalPreset} onChange={e=>setFractalPreset(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm">
              {Object.keys(FRACTAL_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        )}
        {fractalStyle === 'preset' && (
          <div className="mt-2">
            <RangeControl label="Preset Zoom Speed" min={0.02} max={0.25} step={0.01} value={fractalZoomSpeed} onChange={setFractalZoomSpeed} />
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <ColorControl label="Background" value={bg} onChange={setBg} />
        <ColorControl label="Primary" value={fg} onChange={setFg} />
        <ColorControl label="Accent" value={accent} onChange={setAccent} />
        <RangeControl label="Glow" min={0} max={1} step={0.01} value={glow} onChange={setGlow} />
        <div className="col-span-2">
          <RangeControl label="Sensitivity" min={0.4} max={2.0} step={0.05} value={sensitivity} onChange={setSensitivity} />
        </div>
        <div className="col-span-2">
          <RangeControl label="Quality" min={0.5} max={1} step={0.05} value={renderScale} onChange={setRenderScale} />
        </div>
      </section>

      <p className="text-xs text-neutral-400">Tip: Drag & drop an MP3 anywhere on the canvas.</p>
    </aside>
  );
}
