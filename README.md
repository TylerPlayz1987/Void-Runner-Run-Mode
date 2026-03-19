# Void Runner Run Mode
Infinite Platform Game

## Overview
Void Runner is a browser-based 2D endless platformer in a single-page `index.html` file. It features:
- procedural level generation
- multiple themes and audio tracks
- player controls with momentum and coyote-time jump buffering
- hazards, checkpoints, and high-score tracking
- pause/menu/settings with audio and theme controls
- cheat controls (invincibility + level warp)
- 8-bit filter mode on classic theme

## Project files
- `index.html`: full game implementation (canvas, styles, gameplay logic).
- `README.md`: this documentation.

## Controls
- Movement: `A/Left`, `D/Right`
- Jump: `W/Up/Space`
- Run: `Shift`
- Pause/Menu: `P/Escape`
- Pause overlay buttons for resume/settings/restart/cheats

## Code structure
### Initialization and globals
- `window.onload`: wraps all setup; reads localStorage best score; sets up canvas and theme presets.
- Audio state: `audioCtx`, `masterVol`, `musicVol`, `sfxVol`, `musicMuted`, `sfxMuted`.
- Game state: `running`, `isPaused`, `currentLevel`, `lastCheckpoint`, `deathCount`, `shake`, `flashAlpha`, `winParticles`.

### Visual themes
- `themes` object with color palettes and optional features (`stars`, `glitch`, `glow`, `aurora`, `music` file names).
- Theme-specific background decor in `drawScene()` (stars, cyber buildings, magma volcanoes, etc.).

### Level generation
- `generateLevel()`: creates base ground, platforms, hazards, seekers, wells, shield item, and goal position.

### Player physics
- `player` object: position, velocity, momentum, ground state, jump buffer, coyote time, special effect state.
- `update()`: core frame logic includes input, momentum, gravity, wells, collisions, crash/death logic, goal detection.

### Audio and SFX
- `sfx(f, type, duration, volume, slide)`: Web Audio oscillator-based sound effects.
- `play` mapping for sound effect events.
- `bgMusic` `<audio>` element controlled by settings and theme selection.

### Rendering
- `drawScene()`: draws environment, hazards, platforms, player, effects, and goal.
- `drawPlayer()`: renders player shape depending on theme and effect state.
- `draw()`: top-level render wrapper; when `isRetro8bit` is true on classic theme, draws to low-res offscreen canvas.

### Menus and UI
- Multiple overlay submenu pages: `startMenu`, `pauseMenu`, `settingsPage`, `audioPage`, `themePage`, `cheatsPage`.
- Audio sliders and mute toggles update `masterVol`, `musicVol`, `sfxVol`, with live volume adjustment.
- Theme select updates background and audio track.
- `submenuBack()` for `Esc/P` behavior.

## Added doc mode
- This README is the separate detailed doc for code structure and behavior.
- Inline comments in `index.html` are concise and oriented to support reading, while this README provides high-level narrative.

## Build / Run
Open `index.html` in any modern desktop browser (Chrome/Firefox/Edge). Local server recommended if audio files are served from relative paths.

## Notes
- This branch is `verion0.5final` (likely final feature set for version 0.5).
- High score is saved as `core_best_v20` in localStorage.
- Add your own audio files in the expected names (`Smile.ogg`, `Dark.ogg`, `Funny.ogg`, `Neon.ogg`, `Boom.ogg`, `Starry.ogg`) to enable theme music.

## Developer Quick Start
### Adjust level difficulty
- In `index.html`, modify `generateLevel()` settings:
  - lower/raise hazard chance by updating condition `Math.random() < ...`.
  - adjust `platform` gap and `w` for easier/harder traversal.
  - modify `currentLevel` scaling (like `4 + currentLevel`) to change progression.

### Add a new theme
- In `index.html` `themes` object, add entry e.g. `newtheme: { bg: "#112", plat: "#88f", player: "#fff", hazards: "#f00", music: "New.ogg" }`.
- Add `<option value="newtheme">New Theme</option>` in theme select.
- Add render cases in `drawScene()` and `drawPlayer()` for visuals.

### Customize 8-bit filter target theme
- 8-bit mode currently activates when `isRetro8bit` is true and `currentTheme === "classic"`.
- In `index.html`, search for:

```js
const isRetro = isRetro8bit && currentTheme === "classic";
```

- Replace with, for example, to allow all themes:

```js
const isRetro = isRetro8bit;
```

- Adjust `retroCanvas.width` / `retroCanvas.height` values (160x80) for different pixelation levels.

