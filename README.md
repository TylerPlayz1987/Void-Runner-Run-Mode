# Void Runner Run Mode
Infinite Platform Game

## Overview
Void Runner is a browser-based 2D platformer built around a single-page `index.html` game shell. Version 0.8 expands customization, secret unlocks, and progression polish on top of the core endless-runner loop.

Highlights:
- procedural level generation
- multiple themes and theme-specific music
- code-entry unlock system for secret themes and other things for the future
- player momentum, coyote time, jump buffering, and quick restart
- hazards, checkpoints, achievements, and high-score tracking
- updated Run Mode achievements including Speed Demon and jump milestones
- pause/menu/settings flow with audio, theme, and mobile options
- changelog panel, main-menu subtitle, and pause-menu main menu navigation
- speedrun mode updates with improved flow and UI
- clickable version selector for legacy builds
- 8-bit filter mode on the classic theme

## What Changed In v0.8
- Added code entry flow from the main menu for secret unlocks.
- Updated run achievements:
	- Added Speed Demon: finish 10 levels while holding run the entire time.
	- Updated Spacebar Crusher target to 500 total jumps.
- Updated tutorial messaging and notes so mechanics/unlocks match current gameplay.

## Project Files
- [index.html](index.html): single-page game shell that hosts the canvas, DOM, and script loading.
- [js/game.js](js/game.js): core gameplay loop, menus, state management, and input handling.
- [js/data/theme-data.js](js/data/theme-data.js): theme registry and per-theme configuration.
- [js/data/version-data.js](js/data/version-data.js): version registry for the selector and legacy builds.
- [js/version-picker-legacy.js](js/version-picker-legacy.js): shared legacy version picker behavior.
- [legacy_versions/](legacy_versions): older playable builds linked from the version selector.
- [CHECKLIST.md](CHECKLIST.md): post-change test checklist.

## Controls
- Movement: `A/Left`, `D/Right`
- Jump: `W/Up/Space`
- Run: `Shift`
- Pause/Menu: `P/Escape` (disabled in Speed Running Mode)
- Quick Restart from checkpoint: `R`
- Full Restart to level 1: `Shift+R` (opens confirmation popup)
- Version selector: click the version number in supported builds
- Pause overlay buttons for resume/settings/restart/cheats/main menu

## Game Modes

Void Runner features three distinct game modes accessible from the mode selection menu:

### Run Mode
Standard infinite platformer progression:
- Infinite levels with increasing procedural difficulty
- Checkpoints every 5 levels
- Death recovery at the last checkpoint reached
- High score tracking saved to localStorage as `core_best_v20`
- Pause enabled with full settings access

### Tutorial Level
Guided introduction to game mechanics:
- Extended single level that teaches mechanics progressively
- Hint system that walks through movement, jumping, platforms, hazards, restarts, and progression unlock timing
- Post-completion tour that shows settings and customization pages
- Linear progression with no checkpoints
- Replayable any time from the mode menu

### Speed Running Mode
Competitive time-attack mode to reach level 100 as fast as possible:
- Millisecond precision timer in `MM:SS.mmm` format
- Any death ends the run immediately
- Game over screen shows final level and elapsed time
- Pause is disabled during the run
- Best time tracking uses `core_speedrun_best_time_v1`

## UI and Menus
- Main menu includes the version subtitle, changelog button, version picker entry point, and code entry button for unlocks.
- Pause menu includes a direct main menu button, achievements, cheats, settings, audio, theme, and mobile support pages.
- Theme and audio menus are shared across the main build and the legacy builds.
- The changelog panel lives in the main menu and lists the current release notes.

## Code Structure
### Initialization and globals
- `window.onload`: wraps all setup; reads localStorage best score; sets up canvas, themes, and menus.
- Audio state: `audioCtx`, `masterVol`, `musicVol`, `sfxVol`, `musicMuted`, `sfxMuted`.
- Game state: `running`, `isPaused`, `currentLevel`, `lastCheckpoint`, `deathCount`, `shake`, `flashAlpha`, `winParticles`.
- Speed Running mode state: `speedRunMode`, `speedRunStartTime`, `speedRunGameOverMode`.

### Visual themes
- `themes` object with color palettes and optional features such as `stars`, `glitch`, `glow`, `aurora`, and `music`, sourced from `window.VR_THEME_DATA` in [`js/data/theme-data.js`](js/data/theme-data.js) for the current build.
- Theme-specific background decor in `drawScene()` for stars, cyber city details, magma effects, and more.

### Level generation
- `generateLevel()`: creates base ground, platforms, hazards, seekers, wells, shield item, and goal position.

### Player physics
- `player` object: position, velocity, momentum, ground state, jump buffer, coyote time, and special effect state.
- `update()`: core frame logic including input, momentum, gravity, collisions, hazards, and goal detection.

### Audio and SFX
- `sfx(f, type, duration, volume, slide)`: Web Audio oscillator-based sound effects.
- `play` mapping for sound effect events.
- `bgMusic` `<audio>` element controlled by settings and theme selection.

### Rendering
- `drawScene()`: draws the environment, hazards, platforms, player, effects, and goal.
- `drawPlayer()`: renders the player shape depending on theme and effect state.
- `draw()`: top-level render wrapper; when `isRetro8bit` is true on the classic theme, draws to a low-res offscreen canvas.

## Notes
- Current version is 0.9.0.
- Legacy builds are interchangeable through the version picker.
- High score is saved as `core_best_v20` in localStorage.
- Speed run best time uses `core_speedrun_best_time_v1`.
- Add your own audio files in the expected names under `theme_bg/` to enable theme music.

## Developer Quick Start
### Adjust level difficulty
- In `js/game.js`, modify `generateLevel()` settings.
- Lower or raise hazard chance by updating conditions such as `Math.random() < ...`.
- Adjust platform gap and width for easier or harder traversal.

### Add a new theme
- In `window.VR_THEME_DATA` in `js/data/theme-data.js`, add an entry such as `newtheme: { bg: "#112", plat: "#88f", player: "#fff", hazards: "#f00", music: "theme_bg/New.ogg" }`.
- Add the matching theme option in the theme selector.
- Add render cases in `drawScene()` and `drawPlayer()` for visuals.

### Testing Speed Running Mode
- Click Start on the title screen.
- Select Speed Running mode from the mode menu.
- Timer starts automatically in `MM:SS.mmm` format.
- Reach level 100 to win, or die for game over.
- Use Restart or Back to Menu from the speedrun game over screen.

## Checklist
The post-change test checklist has been moved to [CHECKLIST.md](CHECKLIST.md).
