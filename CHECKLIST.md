# Post-Change Test Checklist

Use this checklist after any code change before merging.

## 1) Boot and Main Menus
- [ ] Game loads with no console errors.
- [ ] Start screen appears and responds to input.
- [ ] Codes button on start screen opens prompt.
- [ ] Entering code `test` flashes message `test done`.
- [ ] Start button opens mode selection.
- [ ] Mode Back returns to start screen.

## 2) Run Mode Core Gameplay
- [ ] Run Mode starts and player spawns correctly.
- [ ] Left/right movement works (`A/D` and arrows).
- [ ] Jump works (`W/Up/Space`) including coyote/buffer behavior.
- [ ] Shift run increases movement speed.
- [ ] Hazards kill player and increment death counter.
- [ ] Respawn returns to last checkpoint in Run Mode.
- [ ] Level completion increments level and updates UI.

## 3) Pause and Top Shortcut Buttons
- [ ] Top controls are visible in normal gameplay.
- [ ] Pause button pauses/resumes (`P` and `Esc` also work).
- [ ] Achievements shortcut opens achievements page.
- [ ] Mobile shortcut opens mobile support page.
- [ ] Theme shortcut opens theme page.
- [ ] Cheats shortcut opens cheats page.
- [ ] Resume returns to gameplay cleanly.

## 4) Settings Pages
- [ ] Settings page opens from pause menu.
- [ ] Audio Settings page opens and back navigation works.
- [ ] Theme Settings page opens and back button is fully visible (no clipping).
- [ ] Mobile Support page opens and back navigation works.
- [ ] Tutorial Notes page opens and back navigation works.

## 5) Theme System
- [ ] Theme buttons switch visual theme immediately.
- [ ] Active theme button highlight updates correctly.
- [ ] Theme list can scroll when needed without clipping other controls.
- [ ] Theme music changes (if audio file exists for that theme).
- [ ] 8-bit toggle updates label and visual behavior as expected.

## 6) Audio Controls
- [ ] Master slider updates displayed value and effective volume.
- [ ] Music slider updates displayed value and music volume.
- [ ] SFX slider updates displayed value and SFX volume.
- [ ] Music mute toggles ON/OFF and updates button text.
- [ ] SFX mute toggles ON/OFF and updates button text.

## 7) Cheats and Reset Flows
- [ ] Invincibility toggle works and updates label.
- [ ] Warp to valid level works.
- [ ] Reset button opens reset confirmation.
- [ ] Checkpoint restart works and closes prompts.
- [ ] Full restart confirmation flow works (Yes/No paths).
- [ ] Shift+R opens full restart confirmation while playing.
- [ ] R performs quick checkpoint restart while playing.

## 8) Achievements and Save Data
- [ ] Achievements page renders without errors.
- [ ] Unlock conditions still trigger (spot-check at least one achievement).
- [ ] High score updates when cheats are not used.
- [ ] Cheat usage behavior for score state is still correct.
- [ ] Reloading page preserves expected localStorage values.

## 9) Mobile Support
- [ ] Mobile Support toggle shows/hides on-screen controls.
- [ ] On-screen controls move player/jump/run/dash correctly.
- [ ] Customize Buttons flow opens, allows repositioning, and saves.
- [ ] Screen Size slider changes scale and updates value text.

## 10) Tutorial Mode
- [ ] Tutorial mode starts from mode menu.
- [ ] Tutorial hints appear in expected progression.
- [ ] End-of-tutorial flow completes and returns correctly.
- [ ] Post-tutorial settings tour does not soft-lock navigation.

## 11) Speed Running Mode
- [ ] Speed Running mode starts with timer at `00:00.000`.
- [ ] Pause is disabled in Speed Running mode.
- [ ] Dying shows speed run game over overlay.
- [ ] Restart from speed run game over starts fresh run.
- [ ] Back to menu from speed run game over works.
- [ ] Timer formatting remains `MM:SS.mmm`.

## 12) Regression Smoke on Refactor
- [ ] Asset paths resolve after file moves (CSS/JS/theme/audio/icons).
- [ ] No 404s for `css/styles.css`, `js/game.js`, `js/data/theme-data.js`, `js/data/achievements-data.js`.
- [ ] No initialization race issues (data files load before game logic).

## 13) Final Browser Pass
- [ ] Chrome/Edge quick pass.
- [ ] Firefox quick pass.
- [ ] Window resize / small-height layout pass (menus remain usable).
