
# 🎨 Audio Visualizer

A drop-in, **React + Canvas2D** visualizer with three animated modes:  
- **EQ Bars** – spectrum analyzer  
- **Fluid** – metaball glow that dances to bass  
- **Fractal** – animated Julia set that pulses to music  

Uses the **Web Audio API** for live analysis and **TailwindCSS** for UI styling.  
No external visualization libraries — everything is rendered on the HTML5 `<canvas>`.

---

## ✨ Features
- **Three visualization modes**: EQ, Fluid, Fractal (dynamic & preset zoom styles)
- **Color presets** + custom background/primary/accent pickers
- Adjustable **glow**, **sensitivity**, and **quality**
- Drag & drop audio file support (MP3, WAV, etc.)
- Responsive layout with sidebar controls and top bar
- **Dynamic performance tuning** for fractal rendering (~12 ms/frame target)
- Works in any modern browser

---

## 🚀 Demo
1. Load a track via the **Load Audio** button or drag a file onto the canvas.  
2. Toggle between modes using the sidebar.  
3. Tweak colors, sensitivity, and quality to taste.  
4. For fractal mode, choose **Dynamic** or **Preset** zoom styles.

---

## 🛠 Installation
```bash
# Clone the repo
git clone https://github.com/your-username/audio-visualizer.git
cd audio-visualizer

# Install dependencies
npm install

# Start the dev server
npm run dev
```

---

## 📂 Project Structure
```
src/
  App.jsx                  # Main component wiring hooks + UI
  hooks/
    useVisualizerState.js  # UI state + presets
    useAudioAnalyser.js    # AudioContext + analyser logic
    useVisualizerRender.js # Canvas render loop
    useDragDrop.js         # Drag & drop file handling
  components/
    TopBar.jsx             # Header controls
    Sidebar.jsx            # Sidebar controls
    CanvasStage.jsx        # Canvas + audio element
    CanvasGlowWrapper.jsx  # Glow overlay
    ui/                    # Small reusable UI pieces
  config/
    colors.js              # Color presets
    fractals.js            # Fractal presets & constants
  render/
    common.js              # Helpers (avg, rms, clamp, etc.)
    eq.js                  # EQ drawing
    fluid.js               # Fluid drawing
    fractal.js             # Fractal drawing
```

---

## 🖱 Controls
**Top Bar**
- **Load Audio**: Select a local audio file  
- **Play/Pause**: Toggle playback  

**Sidebar**
- **Mode**: EQ Bars / Fluid / Fractal  
- **Presets**: Apply color theme  
- **Fractal Options**: Switch style, choose preset, adjust zoom speed  
- **Background / Primary / Accent**: Color pickers  
- **Glow / Sensitivity / Quality**: Range sliders  

**Tips**
- Drag & drop an MP3 anywhere on the canvas to load it instantly.
- Lower **quality** for higher performance in fractal mode.

---

## 📜 License
MIT — free to use and modify.  
Attribution appreciated but not required.

