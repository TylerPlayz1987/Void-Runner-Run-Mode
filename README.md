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
- **Speed Running Mode**: competitive time-attack mode to reach level 100 as fast as possible with millisecond precision timer (v0.6+)

## Project files
- `index.html`: full game implementation (canvas, styles, gameplay logic).
- `README.md`: this documentation.

## Controls
- Movement: `A/Left`, `D/Right`
- Jump: `W/Up/Space`
- Run: `Shift`
- Pause/Menu: `P/Escape` (disabled in Speed Running Mode)
- Quick Restart from checkpoint: `R`
- Full Restart to level 1: `Shift+R` (opens confirmation popup)
- Pause overlay buttons for resume/settings/restart/cheats

## Game Modes

Void Runner features three distinct game modes accessible from the mode selection menu:

### Run Mode
Standard infinite platformer progression:
- **Infinite levels**: levels increase indefinitely with increasing procedural difficulty
- **Checkpoints every 5 levels**: save progress at levels 5, 10, 15, 20, etc.
- **Death recovery**: dying respawns player at the last checkpoint reached
- **High score tracking**: best level reached is automatically saved to localStorage as `core_best_v20`
- **Pause enabled**: press `P` or `Escape` to access the pause menu and adjust settings

### Tutorial Level
Guided introduction to game mechanics:
- **Extended single level**: teaches all game mechanics through progressive difficulty
- **Hint system**: contextual text hints appear as player progresses (movement → running → jumping → moving platforms → hazards → advanced features)
- **Post-completion tour**: after reaching the goal, an automated sequence shows audio and theme customization options
- **Linear progression**: single path from start to goal; no checkpoints
- **Replayable**: select "Tutorial Level" from mode menu to play again anytime

### Speed Running Mode (v0.6+)
Competitive speedrunning challenge introduced in version 0.6:
- **Time attack objective**: race from level 1 to level 100 as fast as possible
- **Millisecond precision timer**: on-screen stopwatch in top-right displays `MM:SS.mmm` format (e.g., `01:23.456`)
- **Ironman ruleset**: any death instantly ends the run (no respawn, no checkpoints, no recovery)
- **Game over screen**: when dying, shows final level reached and total elapsed time with restart and menu buttons
- **No pause functionality**: pause menu is disabled; cannot pause the timer
- **Goal**: reach level 100 in shortest time for personal bests and competitive rankings

## Code structure
### Initialization and globals
- `window.onload`: wraps all setup; reads localStorage best score; sets up canvas and theme presets.
- Audio state: `audioCtx`, `masterVol`, `musicVol`, `sfxVol`, `musicMuted`, `sfxMuted`.
- Game state: `running`, `isPaused`, `currentLevel`, `lastCheckpoint`, `deathCount`, `shake`, `flashAlpha`, `winParticles`.
- Speed Running mode state: `speedRunMode` (flag), `speedRunStartTime` (timestamp in ms), `speedRunGameOverMode` (flag for game over screen).

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
- Multiple overlay submenu pages: `startMenu`, `pauseMenu`, `modeMenu`, `settingsPage`, `audioPage`, `themePage`, `cheatsPage`.
- Speed Running overlay: `speedRunGameOver` (game over screen for speed run mode).
- Audio sliders and mute toggles update `masterVol`, `musicVol`, `sfxVol`, with live volume adjustment.
- Theme select updates background and audio track.
- `submenuBack()` for `Esc/P` behavior.
- Speed running timer: `speedRunTimer` (MM:SS.mmm display in top-right).

### Speed Running Mode Functions (v0.6+)
- `startSpeedRunMode()`: initializes a new speed run attempt; records start time, resets all state, hides pause button.
- `formatSpeedRunTime(ms)`: converts milliseconds to `MM:SS.mmm` format for timer display and game over screen.
- `showSpeedRunGameOver()`: displays game over overlay with final level and elapsed time; disables further input.
- Speed run integration: `die()` calls `showSpeedRunGameOver()` instead of respawning; `win()` checks for level 100 completion; `toggle()` prevents pause during speed run.

## Added doc mode
- This README is the separate detailed doc for code structure and behavior.
- Inline comments in `index.html` are concise and oriented to support reading, while this README provides high-level narrative.

## Build / Run
Open `index.html` in any modern desktop browser (Chrome/Firefox/Edge). Local server recommended if audio files are served from relative paths.

## Post-Change Test Checklist
Use this checklist after any code change before merging.

### 1) Boot and Main Menus
- [ ] Game loads with no console errors.
- [ ] Start screen appears and responds to input.
- [ ] Codes button on start screen opens prompt.
- [ ] Entering code `test` flashes message `test done`.
- [ ] Start button opens mode selection.
- [ ] Mode Back returns to start screen.

### 2) Run Mode Core Gameplay
- [ ] Run Mode starts and player spawns correctly.
- [ ] Left/right movement works (`A/D` and arrows).
- [ ] Jump works (`W/Up/Space`) including coyote/buffer behavior.
- [ ] Shift run increases movement speed.
- [ ] Hazards kill player and increment death counter.
- [ ] Respawn returns to last checkpoint in Run Mode.
- [ ] Level completion increments level and updates UI.

### 3) Pause and Top Shortcut Buttons
- [ ] Top controls are visible in normal gameplay.
- [ ] Pause button pauses/resumes (`P` and `Esc` also work).
- [ ] Achievements shortcut opens achievements page.
- [ ] Mobile shortcut opens mobile support page.
- [ ] Theme shortcut opens theme page.
- [ ] Cheats shortcut opens cheats page.
- [ ] Resume returns to gameplay cleanly.

### 4) Settings Pages
- [ ] Settings page opens from pause menu.
- [ ] Audio Settings page opens and back navigation works.
- [ ] Theme Settings page opens and back button is fully visible (no clipping).
- [ ] Mobile Support page opens and back navigation works.
- [ ] Tutorial Notes page opens and back navigation works.

### 5) Theme System
- [ ] Theme buttons switch visual theme immediately.
- [ ] Active theme button highlight updates correctly.
- [ ] Theme list can scroll when needed without clipping other controls.
- [ ] Theme music changes (if audio file exists for that theme).
- [ ] 8-bit toggle updates label and visual behavior as expected.

### 6) Audio Controls
- [ ] Master slider updates displayed value and effective volume.
- [ ] Music slider updates displayed value and music volume.
- [ ] SFX slider updates displayed value and SFX volume.
- [ ] Music mute toggles ON/OFF and updates button text.
- [ ] SFX mute toggles ON/OFF and updates button text.

### 7) Cheats and Reset Flows
- [ ] Invincibility toggle works and updates label.
- [ ] Warp to valid level works.
- [ ] Reset button opens reset confirmation.
- [ ] Checkpoint restart works and closes prompts.
- [ ] Full restart confirmation flow works (Yes/No paths).
- [ ] Shift+R opens full restart confirmation while playing.
- [ ] R performs quick checkpoint restart while playing.

### 8) Achievements and Save Data
- [ ] Achievements page renders without errors.
- [ ] Unlock conditions still trigger (spot-check at least one achievement).
- [ ] High score updates when cheats are not used.
- [ ] Cheat usage behavior for score state is still correct.
- [ ] Reloading page preserves expected localStorage values.

### 9) Mobile Support
- [ ] Mobile Support toggle shows/hides on-screen controls.
- [ ] On-screen controls move player/jump/run/dash correctly.
- [ ] Customize Buttons flow opens, allows repositioning, and saves.
- [ ] Screen Size slider changes scale and updates value text.

### 10) Tutorial Mode
- [ ] Tutorial mode starts from mode menu.
- [ ] Tutorial hints appear in expected progression.
- [ ] End-of-tutorial flow completes and returns correctly.
- [ ] Post-tutorial settings tour does not soft-lock navigation.

### 11) Speed Running Mode
- [ ] Speed Running mode starts with timer at `00:00.000`.
- [ ] Pause is disabled in Speed Running mode.
- [ ] Dying shows speed run game over overlay.
- [ ] Restart from speed run game over starts fresh run.
- [ ] Back to menu from speed run game over works.
- [ ] Timer formatting remains `MM:SS.mmm`.

### 12) Regression Smoke on Refactor
- [ ] Asset paths resolve after file moves (CSS/JS/theme/audio/icons).
- [ ] No 404s for `css/styles.css`, `js/game.js`, `js/data/theme-data.js`, `js/data/achievements-data.js`.
- [ ] No initialization race issues (data files load before game logic).

### 13) Final Browser Pass
- [ ] Chrome/Edge quick pass.
- [ ] Firefox quick pass.
- [ ] Window resize / small-height layout pass (menus remain usable).

## Notes
- Current version is 0.6 with Speed Running Mode feature added.
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

### Testing Speed Running Mode
- Click "Start" on title screen
- Select "Speed Running" mode from mode menu
- Timer starts automatically (MM:SS.mmm format)
- Reach level 100 to win, or die for Game Over
- Click "Restart" to try again or "Back to Menu" to return to mode selection
