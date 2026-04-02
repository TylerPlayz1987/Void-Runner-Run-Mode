      // Entry point: run once DOM is ready
      window.onload = function () {
        // ---------------------------------------------------------------------
        // Game audio and UI state variables
        // ---------------------------------------------------------------------
        // audioCtx: Web Audio API context for generated SFX (oscillators)
        // masterVol: global volume multiplier (0.0-1.0)
        // musicVol: background music volume control (0.0-1.0)
        // sfxVol: sound effects volume control (0.0-1.0)
        // musicMuted / sfxMuted: explicit toggle state
        // isRetro8bit: state for retro low-res filter effect
        // frameCount: global frame counter for animations
        // running: whether game loop is active
        // isPaused: when true the game sim stops updating
        // currentLevel / lastCheckpoint: progression tracking
        // deathCount: player deaths shown on UI
        // cheatsUsed: toggles high-score saving checks
        // shake: camera shake amount for effects
        // winParticles: victory particle effect storage
        // flashAlpha: white flash overlay timer for checkpoints
        let audioCtx,
          masterVol = 0.5,
          musicVol = 0.5,
          sfxVol = 0.5,
          musicMuted = false,
          sfxMuted = false,
          isRetro8bit = false,
          frameCount = 0,
          running = false,
          isPaused = false,
          currentLevel = 1,
          lastCheckpoint = 1,
          deathCount = 0,
          cheatsUsed = false,
          tutorialMode = false,
          showingPostTutorialSettings = false,
          loopStarted = false,
          shake = 0,
          winParticles = [],
          flashAlpha = 0,
          // Speed Running mode state
          // speedRunMode: true while player is in speed run mode
          // speedRunStartTime: timestamp used for stopwatch elapsed time
          // speedRunGameOverMode: true while speed run game-over overlay is active
          speedRunMode = false,
          speedRunStartTime = 0,
          speedRunGameOverMode = false,
          speedRunGlitchWallX = -260,
          speedRunGlitchWallW = 34,
          speedRunGlitchWallSpeed = 0.9,
          fullRestartResumeOnCancel = false,
          fullRestartOpenedFromResetPrompt = false,
          mobileSupportEnabled = false,
          mobileBtnSize = 64,
          mobileBtnBottom = 10,
          mobileBtnLeft = 14,
          screenScale = 100,
          buttonCustomizationActive = false,
          showCustomizeGrid = false,
          touchStartDistance = 0,
          defaultButtonPositions = {
            "btn-left": { x: 14, y: 0 },
            "btn-right": { x: 90, y: 0 },
            "btn-run": { x: 14, y: 80 },
            "btn-jump": { x: 108, y: 80 },
            "btn-dash": { x: 166, y: 80 }
          },
          defaultButtonSizes = {
            "btn-left": 64,
            "btn-right": 64,
            "btn-run": 64,
            "btn-jump": 64,
            "btn-dash": 64
          },
          buttonPositions = JSON.parse(JSON.stringify(defaultButtonPositions)),
          buttonSizes = JSON.parse(JSON.stringify(defaultButtonSizes)),
          currentCustomizingButton = null,
          customizeStartData = null;
        let postTutorialTourTimers = [];
        const canvas = document.getElementById("canvas"),
          mainCtx = canvas.getContext("2d"),
          container = document.getElementById("container"),
          cpNotif = document.getElementById("cp-notif"),
          tutorialHintEl = document.getElementById("tutorialHint"),
          tourExplainEl = document.getElementById("tourExplain");
        const versionPickerBtn = document.getElementById("versionPickerBtn");
        const versionPickerMenu = document.getElementById("versionPickerMenu");
        const versionPickerTitle = document.getElementById("versionPickerTitle");
        const versionPickerCloseBtn = document.getElementById("versionPickerClose");
        const versionPickerList = document.getElementById("versionPickerList");
        let ctx = mainCtx;
        const retroCanvas = document.createElement("canvas");
        retroCanvas.width = 160;
        retroCanvas.height = 80;
        const retroCtx = retroCanvas.getContext("2d");
        canvas.width = 800;
        canvas.height = 400;
        let bestLevel = localStorage.getItem("core_best_v20") || 1;
        let speedRunBestLevel = localStorage.getItem("core_speedrun_best_level_v1") || 1;
        let speedRunBestTime = parseFloat(localStorage.getItem("core_speedrun_best_time_v1") || "0");
        document.getElementById("best").textContent = bestLevel;

        const fallbackVersionData = {
          currentVersion: "v0.7.0",
          versions: [{ label: "v0.7.0 (Current)", path: "./", current: true }],
        };
        const versionData = window.VR_VERSION_DATA || fallbackVersionData;
        const currentGameVersion =
          typeof versionData.currentVersion === "string" && versionData.currentVersion.trim()
            ? versionData.currentVersion.trim()
            : fallbackVersionData.currentVersion;
        const versionOptions = Array.isArray(versionData.versions) && versionData.versions.length
          ? versionData.versions
          : fallbackVersionData.versions;

        function closeVersionPicker() {
          versionPickerMenu.style.display = "none";
          versionPickerBtn.setAttribute("aria-expanded", "false");
        }

        function openVersionPicker() {
          versionPickerMenu.style.display = "flex";
          versionPickerBtn.setAttribute("aria-expanded", "true");
        }

        function buildVersionPicker() {
          versionPickerBtn.textContent = currentGameVersion;
          versionPickerTitle.textContent = `Choose Version (${currentGameVersion})`;
          versionPickerList.innerHTML = "";

          for (const option of versionOptions) {
            if (!option || typeof option !== "object") continue;
            const label = typeof option.label === "string" ? option.label.trim() : "";
            const path = typeof option.path === "string" ? option.path.trim() : "";
            if (!label || !path) continue;

            const isCurrent = Boolean(option.current);
            const optionBtn = document.createElement("button");
            optionBtn.type = "button";
            optionBtn.className = "version-option-btn";
            if (isCurrent) optionBtn.classList.add("current");
            optionBtn.textContent = isCurrent ? `${label} - Playing` : label;
            optionBtn.onclick = () => {
              if (isCurrent) {
                closeVersionPicker();
                return;
              }
              window.location.href = path;
            };
            versionPickerList.appendChild(optionBtn);
          }

          if (!versionPickerList.children.length) {
            const fallbackBtn = document.createElement("button");
            fallbackBtn.type = "button";
            fallbackBtn.className = "version-option-btn current";
            fallbackBtn.textContent = `${currentGameVersion} - Playing`;
            fallbackBtn.onclick = () => closeVersionPicker();
            versionPickerList.appendChild(fallbackBtn);
          }
        }

        buildVersionPicker();
        closeVersionPicker();

        versionPickerBtn.onclick = (e) => {
          e.stopPropagation();
          if (versionPickerMenu.style.display === "flex") {
            closeVersionPicker();
          } else {
            openVersionPicker();
          }
        };

        versionPickerCloseBtn.onclick = () => closeVersionPicker();
        versionPickerMenu.onclick = (e) => e.stopPropagation();
        document.addEventListener("click", () => closeVersionPicker());

        updateHudModeUi();
        updateSpeedRunBestTimeUi();

        function updateBestLevelUi() {
          const highScore = speedRunMode ? speedRunBestLevel : bestLevel;
          document.getElementById("best").textContent = highScore;
        }

        function updateHudModeUi() {
          document.getElementById("death-stat").style.display = speedRunMode ? "none" : "block";
          updateBestLevelUi();
        }
        
        // Achievements are defined in js/data/achievements-data.js.
        const achievements = JSON.parse(
          JSON.stringify(window.VR_ACHIEVEMENT_DATA.achievementsTemplate)
        );
        const achievementIconImageSources = window.VR_ACHIEVEMENT_DATA.iconSources;
        const achievementIconImageCache = {};

        function getAchievementIconImage(achievementId) {
          const src = achievementIconImageSources[achievementId];
          if (!src) return null;
          if (!achievementIconImageCache[achievementId]) {
            const img = new Image();
            img.src = src;
            img.onload = () => renderAchievements();
            achievementIconImageCache[achievementId] = img;
          }
          return achievementIconImageCache[achievementId];
        }
        
        // Helper function to get achievements for a specific mode
        function getAchievementsForMode(mode) {
          return Object.entries(achievements).filter(
            ([, ach]) => !ach.mode || ach.mode === mode
          );
        }

        // Load unlocked achievements from localStorage with corruption recovery.
        let storedAchievements = {};
        try {
          const rawStoredAchievements = localStorage.getItem("void_achievements");
          storedAchievements = rawStoredAchievements
            ? JSON.parse(rawStoredAchievements)
            : {};
        } catch (_err) {
          storedAchievements = {};
          localStorage.removeItem("void_achievements");
        }
        for (let key in achievements) {
          achievements[key].unlocked = storedAchievements[key] || false;
        }

        // Persistent run-mode jump progress for run achievements.
        let totalRunModeJumps = parseInt(localStorage.getItem("void_total_run_jumps") || "0", 10);
        if (!Number.isFinite(totalRunModeJumps) || totalRunModeJumps < 0) {
          totalRunModeJumps = 0;
        }

        // Persistent progress for Speed Demon.
        let speedDemonLevelCount = parseInt(
          localStorage.getItem("void_speed_demon_level_count") || "0",
          10
        );
        if (!Number.isFinite(speedDemonLevelCount) || speedDemonLevelCount < 0) {
          speedDemonLevelCount = 0;
        }

        // Persistent cumulative main-menu idle progress for "Staring into the Void".
        let mainMenuIdleMs = parseInt(
          localStorage.getItem("void_main_menu_idle_ms") || "0",
          10
        );
        if (!Number.isFinite(mainMenuIdleMs) || mainMenuIdleMs < 0) {
          mainMenuIdleMs = 0;
        }
        let mainMenuIdleLastTick = Date.now();
        let mainMenuIdleDirty = false;
        let mainMenuIdleLastPersist = 0;

        function persistMainMenuIdleProgress(force = false) {
          if (!force && !mainMenuIdleDirty) return;
          const now = Date.now();
          if (!force && now - mainMenuIdleLastPersist < 5000) return;
          localStorage.setItem("void_main_menu_idle_ms", String(mainMenuIdleMs));
          mainMenuIdleDirty = false;
          mainMenuIdleLastPersist = now;
        }

        function isOnStartMenuScreen() {
          return (
            document.getElementById("startMenu").style.display !== "none" &&
            document.getElementById("modeMenu").style.display === "none" &&
            !running
          );
        }

        function trackMainMenuIdleTime() {
          const now = Date.now();
          const deltaMs = Math.min(1000, Math.max(0, now - mainMenuIdleLastTick));
          mainMenuIdleLastTick = now;

          if (document.hidden) return;
          if (!isOnStartMenuScreen()) return;
          if (achievements.staringIntoTheVoid.unlocked) return;

          mainMenuIdleMs += deltaMs;
          mainMenuIdleDirty = true;
          persistMainMenuIdleProgress();

          if (mainMenuIdleMs >= 180000) {
            unlockAchievement("staringIntoTheVoid");
            persistMainMenuIdleProgress(true);
          }
        }

        setInterval(trackMainMenuIdleTime, 250);
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            persistMainMenuIdleProgress(true);
          }
          mainMenuIdleLastTick = Date.now();
        });
        window.addEventListener("beforeunload", () => {
          persistMainMenuIdleProgress(true);
        });

        // Per-level challenge tracking for "Is This Thing On?"
        let noMoveStartJumpCount = 0;
        let noMoveStartMoved = false;
        let noMoveStartX = 50;
        let speedDemonRunHeldThisLevel = false;
        
        // Render achievements on initialization
        renderAchievements();
        
        function unlockAchievement(achievementId) {
          if (achievements[achievementId] && !achievements[achievementId].unlocked) {
            achievements[achievementId].unlocked = true;
            storedAchievements[achievementId] = true;
            localStorage.setItem("void_achievements", JSON.stringify(storedAchievements));
            play.ach();
            showAchievementNotification(achievements[achievementId]);
          }
        }
        
        function showAchievementNotification(achievement) {
          const notif = document.createElement("div");
          notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #ffd700;
            padding: 12px;
            color: #ffd700;
            font-family: "Courier New", monospace;
            font-weight: bold;
            border-radius: 5px;
            min-width: 220px;
            z-index: 500;
            box-shadow: 0 0 15px #ffd700;
            display: flex;
            align-items: center;
            gap: 10px;
            pointer-events: none;
          `;
          const iconCanvas = document.createElement("canvas");
          drawAchievementIcon(iconCanvas, achievement.id);
          iconCanvas.style.width = "44px";
          iconCanvas.style.height = "44px";
          iconCanvas.style.flexShrink = "0";

          const textWrap = document.createElement("div");
          textWrap.innerHTML = `<div style="font-size: 14px;">ACHIEVEMENT UNLOCKED</div><div style="font-size: 12px; margin-top: 4px;">${achievement.name}</div>`;

          notif.appendChild(iconCanvas);
          notif.appendChild(textWrap);
          document.body.appendChild(notif);
          setTimeout(() => {
            notif.style.transition = "opacity 0.5s";
            notif.style.opacity = "0";
            setTimeout(() => notif.remove(), 500);
          }, 3000);
          renderAchievements();
        }
        
        function drawAchievementIcon(canvas, achievementId) {
          const ctx = canvas.getContext("2d");
          canvas.width = 50;
          canvas.height = 50;

          const imageIcon = getAchievementIconImage(achievementId);
          if (imageIcon && imageIcon.complete && imageIcon.naturalWidth > 0) {
            ctx.clearRect(0, 0, 50, 50);
            ctx.drawImage(imageIcon, 0, 0, 50, 50);
            return;
          }
          
          if (achievementId === "floorIsLava") {
            // Draw orange/red door icon for "Floor is Lava"
            ctx.fillStyle = "#ff6600";
            ctx.fillRect(5, 8, 40, 34);
            ctx.fillStyle = "#ff3300";
            ctx.fillRect(10, 13, 30, 24);
            ctx.fillStyle = "#ffaa00";
            ctx.beginPath();
            ctx.arc(32, 25, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#ffcc00";
            ctx.lineWidth = 2;
            ctx.strokeRect(5, 8, 40, 34);
          } else if (achievementId === "spacebarCrusher") {
            // Pixel-style icon: night sky, white block, and dark platform.
            ctx.fillStyle = "#05070a";
            ctx.fillRect(0, 0, 50, 50);

            ctx.fillStyle = "#6f7782";
            ctx.fillRect(0, 34, 50, 16);
            ctx.fillStyle = "#2f3338";
            ctx.fillRect(0, 34, 50, 4);

            ctx.fillStyle = "#f2f4f8";
            ctx.fillRect(16, 24, 18, 10);

            ctx.fillStyle = "#8893a1";
            ctx.fillRect(6, 8, 2, 2);
            ctx.fillRect(10, 6, 1, 1);
            ctx.fillRect(13, 10, 1, 1);
            ctx.fillRect(21, 7, 2, 2);
            ctx.fillRect(28, 9, 1, 1);
            ctx.fillRect(36, 6, 2, 2);
            ctx.fillRect(41, 10, 1, 1);
          } else if (achievementId === "isThisThingOn") {
            // Simple doodle-style icon matching the provided concept image.
            ctx.fillStyle = "#f2f2f2";
            ctx.fillRect(0, 0, 50, 50);

            // Ground/platform
            ctx.fillStyle = "#4a4a4a";
            ctx.fillRect(0, 34, 50, 16);
            ctx.fillStyle = "#2f2f2f";
            ctx.fillRect(0, 34, 50, 2);

            // Character outline
            ctx.strokeStyle = "#111";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(9, 34);
            ctx.quadraticCurveTo(10, 16, 17, 10);
            ctx.quadraticCurveTo(28, 4, 41, 13);
            ctx.quadraticCurveTo(44, 15, 41, 18);
            ctx.quadraticCurveTo(31, 20, 18, 20);
            ctx.stroke();

            // Face
            ctx.fillStyle = "#111";
            ctx.beginPath();
            ctx.arc(25, 17, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(36, 16, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(21, 22);
            ctx.lineTo(30, 22);
            ctx.stroke();

            // Body/arms
            ctx.beginPath();
            ctx.moveTo(12, 34);
            ctx.lineTo(16, 45);
            ctx.moveTo(30, 33);
            ctx.lineTo(33, 45);
            ctx.stroke();

            // Small spinner/loading rays over head
            const cx = 18;
            const cy = 6;
            const rays = 10;
            for (let i = 0; i < rays; i++) {
              const a = (Math.PI * 2 * i) / rays;
              const x1 = cx + Math.cos(a) * 4;
              const y1 = cy + Math.sin(a) * 4;
              const x2 = cx + Math.cos(a) * 7;
              const y2 = cy + Math.sin(a) * 7;
              const v = Math.floor((255 * i) / rays);
              ctx.strokeStyle = `rgb(${v},${v},${v})`;
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
          }
        }
        
        function renderAchievements() {
          const container = document.getElementById("achievements-container");
          container.innerHTML = "";
          
          // Determine which mode we're in and render appropriate achievements
          let currentMode = "run"; // Default to run mode
          if (tutorialMode) {
            currentMode = "tutorial"; // Tutorial mode has no achievements
          } else if (speedRunMode) {
            currentMode = "speedrun"; // Speedrun mode has its own achievements
          }
          
          // Only render achievements if not in tutorial mode
          if (tutorialMode) return;
          
          const visibleAchievements = getAchievementsForMode(currentMode);

          for (const [key, achievement] of visibleAchievements) {
            
            const badge = document.createElement("div");
            badge.className = "achievement-badge" + (achievement.unlocked ? "" : " achievement-badge-locked");
            
            const canvas = document.createElement("canvas");
            drawAchievementIcon(canvas, key);
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            
            badge.appendChild(canvas);
            
            if (achievement.unlocked) {
              const tooltip = document.createElement("div");
              tooltip.className = "achievement-tooltip";
              tooltip.textContent = achievement.description;
              badge.appendChild(tooltip);
              badge.title = achievement.name;
            } else {
              badge.title = achievement.name + " (Locked)";
            }
            
            container.appendChild(badge);
          }
        }
        
        let shieldItem = null,
          wells = [],
          currentTheme = "classic",
          infiniteInvincibility = false;
        const { themes, getLavaFx, getWellFx } = window.VR_THEME_DATA;
        const themeBackgroundImages = {};
        const themeGoalImages = {};
        const themePlayerImages = {};
        function getThemeBackgroundImage(themeName) {
          const theme = themes[themeName];
          if (!theme || !theme.bgImage) return null;
          if (!themeBackgroundImages[themeName]) {
            const image = new Image();
            image.src = theme.bgImage;
            themeBackgroundImages[themeName] = image;
          }
          return themeBackgroundImages[themeName];
        }
        function getThemeGoalImage(themeName) {
          const theme = themes[themeName];
          if (!theme || !theme.goalImage) return null;
          if (!themeGoalImages[themeName]) {
            const image = new Image();
            image.src = theme.goalImage;
            themeGoalImages[themeName] = image;
          }
          return themeGoalImages[themeName];
        }
        function getThemePlayerImage(themeName) {
          const theme = themes[themeName];
          if (!theme || !theme.playerImage) return null;
          if (!themePlayerImages[themeName]) {
            const image = new Image();
            image.src = theme.playerImage;
            themePlayerImages[themeName] = image;
          }
          return themePlayerImages[themeName];
        }
        // Theme particles/background add-ons (cosmetic)
        const cyberBldgs = Array.from({ length: 12 }, () => ({
          x: Math.random() * 1200,
          w: 80 + Math.random() * 60,
          h: 180 + Math.random() * 180,
          s: 0.15 + Math.random() * 0.1,
          neon: ["#f0f", "#0ff", "#f06"][Math.floor(Math.random() * 3)],
        }));
        const hoverCars = Array.from({ length: 6 }, () => ({
          x: Math.random() * 800,
          y: 150 + Math.random() * 150,
          s: 2 + Math.random() * 3,
          w: 15,
          c: ["#f0f", "#0ff"][Math.floor(Math.random() * 2)],
        }));
        const fallingStars = Array.from({ length: 3 }, () => ({
          x: Math.random() * 800,
          y: Math.random() * -400,
          s: 10 + Math.random() * 5,
          w: 3,
          l: 80 + Math.random() * 100,
        }));
        const fallingToys = Array.from({ length: 14 }, () => ({
          x: Math.random() * 860 - 30,
          y: Math.random() * -500,
          size: 10 + Math.random() * 18,
          vy: 0.45 + Math.random() * 1.2,
          drift: (Math.random() - 0.5) * 0.6,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.035,
          shape: ["block", "duck", "ball", "spinner"][
            Math.floor(Math.random() * 4)
          ],
          color: ["#f44336", "#2196f3", "#4caf50", "#ff9800", "#9c27b0"][
            Math.floor(Math.random() * 5)
          ],
        }));
        const moonTreeTops = Array.from({ length: 52 }, () => ({
          x: Math.random() * 2600,
          // Keep tree bases below the visible canvas so only the tops peek in.
          baseY: 432 + Math.random() * 88,
          w: 20 + Math.random() * 38,
          h: 110 + Math.random() * 170,
          parallax: 0.08 + Math.random() * 0.22,
          sway: Math.random() * Math.PI * 2,
          swayAmp: 0.25 + Math.random() * 0.8,
          tone: ["rgba(4,8,16,0.96)", "rgba(7,12,24,0.95)", "rgba(10,15,30,0.92)"][
            Math.floor(Math.random() * 3)
          ],
        }));
        const sunnyClouds = [
          { x: 50, y: 50, w: 100, h: 40 },
          { x: 300, y: 80, w: 120, h: 45 },
          { x: 600, y: 40, w: 90, h: 35 },
          { x: 850, y: 100, w: 110, h: 40 },
          { x: 1100, y: 60, w: 100, h: 38 },
        ];
        const magmaDots = Array.from({ length: 30 }, () => ({
          x: Math.random() * 800,
          y: Math.random() * 400,
          s: 1 + Math.random() * 2,
        }));
        const volcanoes = Array.from({ length: 4 }, (_, i) => ({
          x: i * 400,
          type: i % 2,
        }));
        const stars = Array.from({ length: 50 }, () => ({
          x: Math.random() * 800,
          y: Math.random() * 400,
          s: Math.random() * 2,
        }));
        // World state arrays and input map
        let platforms = [],
          hazards = [],
          lavaParticles = [],
          keys = {},
          jumpDust = [];
        const PLATFORM_W = 120,
          SPIKE_W = 15,
          SPIKE_H = 12,
          SPEED_ZONE_START_LEVEL = 40,
          SPEED_ZONE_CHANCE = 0.33,
          FAKE_HAZARD_START_LEVEL = 70,
          FAKE_HAZARD_CHANCE = 0.12;
        const tutorialGuide = [
          {
            minX: 0,
            text: "Start easy: move with A/D or Arrows and jump with W/Up/Space.",
          },
          {
            minX: 260,
            text: "Hold Shift to run for longer jumps.",
          },
          {
            minX: 540,
            text: "Double jump: you get one extra jump in the air, then it resets on landing.",
          },
          {
            minX: 700,
            text: "Press Q to dash: a quick burst of speed with cooldown.",
          },
          {
            minX: 860,
            text: "Moving platform: keep your jump timing and ride it safely.",
          },
          {
            minX: 1120,
            text: "Blue phase platform blinks in and out. Wait for solid timing.",
          },
          {
            minX: 1360,
            text: "Speed zones: teal boosts you, amber slows you down.",
          },
          {
            minX: 1700,
            text: "Hazards start here: spikes hurt on contact, so clear them cleanly.",
          },
          {
            minX: 1960,
            text: "Seekers slide side to side. Watch their rhythm before jumping.",
          },
          {
            minX: 2260,
            text: "Sinking platforms drop after touch, so keep moving.",
          },
          {
            minX: 2480,
            text: "Fake hazards can look dangerous but are harmless. Learn the difference.",
          },
          {
            minX: 2660,
            text: "Collect the shield for one extra save against danger.",
          },
          {
            minX: 2920,
            text: "Gravity wells pull you inward. Keep momentum and jump early to escape.",
          },
          {
            minX: 3140,
            text: "Lava walls rise and fall in cycles. Time your crossing.",
          },
          {
            minX: 3920,
            text: "Run Mode checkpoints save every 5 levels. Reach one to set your restart point.",
          },
          {
            minX: 4120,
            text: "Quick restart keys: press R for checkpoint restart, or Shift+R for full restart with confirmation.",
          },
          {
            minX: 4320,
            text: "Obstacle unlocks: L10 spikes, L15 lava, L20 moving, L30 phase, L35 shield, L40 speed+seekers, L50 sinking, L55 wells, L70 fake hazards.",
          },
          {
            minX: 4760,
            text: "Final stretch. Reach the goal, then review settings and notes after completion.",
          },
        ];
        let tutorialHintText = "";

        function setLevelDisplay() {
          document.getElementById("lvl").textContent = tutorialMode
            ? "TUTORIAL"
            : currentLevel;
        }

        function setTutorialUiVisible(visible) {
          tutorialHintEl.style.display = visible ? "block" : "none";
          if (!visible) {
            tutorialHintText = "";
            tutorialHintEl.textContent = "";
          }
        }

        function updateTutorialHint() {
          if (!tutorialMode) return;
          let nextText = tutorialGuide[0].text;
          for (let i = 0; i < tutorialGuide.length; i++) {
            if (player.x >= tutorialGuide[i].minX) {
              nextText = tutorialGuide[i].text;
            } else {
              break;
            }
          }
          if (nextText !== tutorialHintText) {
            tutorialHintText = nextText;
            tutorialHintEl.textContent = nextText;
          }
        }

        function makeTutorialPlatform(x, y, w = PLATFORM_W, extra = {}) {
          return Object.assign(
            {
              x,
              y,
              w,
              h: 15,
              isPhase: false,
              isSinking: false,
              isTouched: false,
              hasSpike: false,
              spikeX: 0,
              spikeW: SPIKE_W,
              spikeH: SPIKE_H,
              spikeShape: "triangle",
              moveRange: 0,
              startX: x,
              moveDir: 1,
              moveSpeed: 1.5,
              hasSeeker: false,
              seekerX: 0,
              seekerDir: 1,
              seekerW: SPIKE_W,
              seekerH: SPIKE_H,
              seekerShape: "triangle",
              hasSpeedZone: false,
              speedZoneType: null,
              speedZoneX: 0,
              speedZoneW: 0,
              speedZoneDuration: 0,
              speedZoneMul: 1,
              hasFakeHazard: false,
              fakeType: null,
              fakeX: 0,
              fakeW: 0,
              fakeH: 0,
            },
            extra,
          );
        }
        function createSpikeProfile(level = 1, isSeeker = false) {
          let shape = "triangle";
          const roll = Math.random();
          if (level < 20) {
            shape = roll < 0.55 ? "wide" : roll < 0.9 ? "triangle" : "split";
          } else if (level < 40) {
            shape =
              roll < 0.35
                ? "wide"
                : roll < 0.65
                  ? "triangle"
                  : "split";
          } else {
            shape =
              roll < 0.2
                ? "wide"
                : roll < 0.4
                  ? "triangle"
                  : roll < 0.75
                    ? "split"
                    : "needle";
          }
          if (isSeeker && shape === "needle" && level < 45) shape = "split";
          const scale = Math.min(1.4, 1 + level * 0.006);
          if (shape === "needle") {
            return {
              shape,
              w: 8 + Math.floor(Math.random() * 5),
              h: Math.floor((16 + Math.random() * 9) * scale),
            };
          }
          if (shape === "wide") {
            return {
              shape,
              w: Math.floor((20 + Math.random() * 9) * Math.min(1.25, scale)),
              h: 8 + Math.floor(Math.random() * 6),
            };
          }
          if (shape === "split") {
            return {
              shape,
              w: 16 + Math.floor(Math.random() * 9),
              h: Math.floor((10 + Math.random() * 9) * Math.min(1.25, scale)),
            };
          }
          return {
            shape,
            w: 12 + Math.floor(Math.random() * 9),
            h: Math.floor((10 + Math.random() * 7) * Math.min(1.2, scale)),
          };
        }
        function drawSpike(sx, sy, w, h, shape, camX) {
          const drawX = sx - camX;
          if (shape === "split") {
            const gap = Math.max(2, Math.floor(w * 0.2));
            const toothW = Math.max(4, (w - gap) / 2);
            ctx.beginPath();
            ctx.moveTo(drawX, sy);
            ctx.lineTo(drawX + toothW / 2, sy - h);
            ctx.lineTo(drawX + toothW, sy);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(drawX + toothW + gap, sy);
            ctx.lineTo(drawX + toothW + gap + toothW / 2, sy - h);
            ctx.lineTo(drawX + toothW + gap + toothW, sy);
            ctx.fill();
            return;
          }
          if (shape === "diamond") shape = "triangle";
          ctx.beginPath();
          ctx.moveTo(drawX, sy);
          ctx.lineTo(drawX + w / 2, sy - h);
          ctx.lineTo(drawX + w, sy);
          ctx.fill();
        }
        // Player state and physics
        const player = {
          x: 50,
          y: 200,
          w: 20,
          h: 20,
          vx: 0,
          vy: 0,
          momentumX: 0,
          speed: 5,
          runSpeed: 8,
          jump: -12,
          grounded: false,
          trail: [],
          hasShield: false,
          invincibleTimer: 0,
          spaghettified: false,
          deathScale: 1,
          deathRotate: 0,
          isBeingRescued: false,
          rescueTarget: null,
          stretchX: 1,
          stretchY: 1,
          coyoteTime: 0,
          jumpBuffer: 0,
          jumpHeld: false,
          hasAirJump: true,
          speedZoneTimer: 0,
          speedZoneType: null,
          speedZoneMul: 1,
          standPlatform: null,
          dashCooldown: 0,
          dashSpeed: 15,
          dashDuration: 15,
          dashTimer: 0,
          currentDashSpeed: 15,
          dashHeld: false,
        };
        let goal = { x: 0, y: 0, w: 40, h: 40 };
        function sfx(f, t, d, v, slide = 0) {
          // Generate a simple oscillator-based sound effect.
          // f: frequency in Hz, t: waveform type, d: duration seconds, v: volume gain.
          // slide: optional frequency glide target (for jump / warp chirp effects).
          try {
            if (!audioCtx) return;
            if (audioCtx.state === "suspended") audioCtx.resume();
            const o = audioCtx.createOscillator(),
              g = audioCtx.createGain();
            o.type = t;
            o.frequency.setValueAtTime(f, audioCtx.currentTime);
            if (slide)
              o.frequency.exponentialRampToValueAtTime(
                slide,
                audioCtx.currentTime + d,
              );
            const effectiveSfxVol = sfxMuted ? 0 : sfxVol * masterVol;
            g.gain.setValueAtTime(v * effectiveSfxVol, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(
              0.0001,
              audioCtx.currentTime + d,
            );
            o.connect(g);
            g.connect(audioCtx.destination);
            o.start();
            o.stop(audioCtx.currentTime + d);
          } catch (e) {}
        }
        const play = {
          jp: () => sfx(180, "square", 0.1, 0.08, 450),
          wn: () => {
            sfx(523, "triangle", 0.1, 0.1);
            setTimeout(() => sfx(659, "triangle", 0.1, 0.1), 80);
          },
          ach: () => {
            // Bright three-note chime for achievement unlocks.
            sfx(784, "triangle", 0.08, 0.1);
            setTimeout(() => sfx(988, "triangle", 0.1, 0.1), 80);
            setTimeout(() => sfx(1175, "triangle", 0.12, 0.11), 170);
          },
          di: () => sfx(150, "sawtooth", 0.4, 0.1, 40),
          rewind: () => {
            sfx(220, "triangle", 0.15, 0.12, 360);
            setTimeout(() => sfx(120, "sine", 0.2, 0.08, 220), 70);
          },
          cp: () => {
            sfx(300, "sine", 1.2, 0.2, 1400);
            sfx(450, "sine", 1.2, 0.1, 1600);
          },
          dash: () => {
            // Short layered whoosh for dash start.
            sfx(240, "sawtooth", 0.08, 0.07, 110);
            setTimeout(() => sfx(160, "triangle", 0.06, 0.045, 80), 12);
          },
          well: () => sfx(60, "sine", 0.8, 0.15, 10),
          grab: () => sfx(400, "sawtooth", 0.2, 0.1, 100),
        };
        function useCheat() {
          cheatsUsed = true;
          document.getElementById("best").textContent = "CHEATS USED";
        }
        // Procedurally generate platforms/hazards for the current level
        // - resets collectible/shield state
        // - creates base ground and progressively harder obstacles
        function generateLevel() {
          shieldItem = null;
          wells = [];
          platforms = [{ x: 0, y: 350, w: 300, h: 50, isPhase: false }];
          hazards = [];
          let lx = 300,
            ly = 350;
          for (let i = 0; i < 4 + currentLevel; i++) {
            let gp = 110 + Math.random() * 80,
              vd = (Math.random() - 0.5) * 140;
            lx += gp;
            ly = Math.max(120, Math.min(340, ly + vd));
            let isG = i === 3 + currentLevel,
              ph =
                currentLevel >= 30 &&
                !isG &&
                !platforms[platforms.length - 1].isPhase &&
                Math.random() < 0.35,
              isSink = currentLevel >= 50 && !isG && !ph && Math.random() < 0.3;
            const canPlaceOnPlatform = !isG && !ph && !isSink;
            const allowObstacleStacking = currentLevel >= 50;
            let platformHasObstacle = false;
            let hasFakeHazard =
              currentLevel >= FAKE_HAZARD_START_LEVEL &&
              canPlaceOnPlatform &&
              Math.random() < FAKE_HAZARD_CHANCE;
            if (hasFakeHazard) platformHasObstacle = true;
            let hasSpike =
                currentLevel >= 10 &&
                canPlaceOnPlatform &&
                !hasFakeHazard &&
                (allowObstacleStacking || !platformHasObstacle) &&
                Math.random() < 0.3;
            if (hasSpike) platformHasObstacle = true;
            let hasSeeker =
                currentLevel >= 40 &&
                canPlaceOnPlatform &&
                !hasFakeHazard &&
                !hasSpike &&
                (allowObstacleStacking || !platformHasObstacle) &&
                Math.random() < 0.3;
            if (hasSeeker) platformHasObstacle = true;
            const hasSpeedZone =
              currentLevel >= SPEED_ZONE_START_LEVEL &&
              !isG &&
              !ph &&
              !hasFakeHazard &&
              Math.random() < SPEED_ZONE_CHANCE;
            const platformWidth = PLATFORM_W;
            const speedZoneW = hasSpeedZone ? 34 + Math.random() * 36 : 0;
            const speedZoneX = hasSpeedZone
              ? Math.random() * (platformWidth - speedZoneW)
              : 0;
            const speedZoneType = hasSpeedZone
              ? Math.random() < 0.5
                ? "boost"
                : "slow"
              : null;
            const fakeType = hasFakeHazard
              ? Math.random() < 0.7
                ? "ghostSpike"
                : "ghostBlock"
              : null;
            const fakeW = hasFakeHazard
              ? fakeType === "ghostSpike"
                ? 16 + Math.random() * 14
                : 20 + Math.random() * 18
              : 0;
            const fakeH = hasFakeHazard
              ? fakeType === "ghostSpike"
                ? 12 + Math.random() * 10
                : 14 + Math.random() * 10
              : 0;
            const spikeProfile = hasSpike ? createSpikeProfile(currentLevel, false) : null;
            const seekerProfile = hasSeeker ? createSpikeProfile(currentLevel, true) : null;
            platforms.push({
              x: lx,
              y: ly,
              w: platformWidth,
              h: 15,
              isPhase: ph,
              isSinking: isSink,
              isTouched: false,
              hasSpike,
              spikeX: hasSpike ? Math.random() * (PLATFORM_W - spikeProfile.w) : 0,
              spikeW: hasSpike ? spikeProfile.w : SPIKE_W,
              spikeH: hasSpike ? spikeProfile.h : SPIKE_H,
              spikeShape: hasSpike ? spikeProfile.shape : "triangle",
              moveRange:
                currentLevel >= 20 && !isG && Math.random() < 0.4
                  ? 50 + Math.random() * 50
                  : 0,
              startX: lx,
              moveDir: 1,
              moveSpeed: 1.5,
              hasSeeker,
              seekerX: 0,
              seekerDir: 1,
              seekerW: hasSeeker ? seekerProfile.w : SPIKE_W,
              seekerH: hasSeeker ? seekerProfile.h : SPIKE_H,
              seekerShape: hasSeeker ? seekerProfile.shape : "triangle",
              hasSpeedZone,
              speedZoneType,
              speedZoneX,
              speedZoneW,
              speedZoneDuration:
                hasSpeedZone ? 600 + Math.floor(Math.random() * 301) : 0,
              speedZoneMul:
                speedZoneType === "boost"
                  ? 1.55 + Math.random() * 0.25
                  : speedZoneType === "slow"
                    ? 0.5 + Math.random() * 0.15
                    : 1,
              hasFakeHazard,
              fakeType,
              fakeX: hasFakeHazard ? Math.random() * (PLATFORM_W - fakeW) : 0,
              fakeW,
              fakeH,
            });
            let lastP = platforms[platforms.length - 1];
            if (
              currentLevel >= 55 &&
              canPlaceOnPlatform &&
              !hasFakeHazard &&
              (allowObstacleStacking || !platformHasObstacle) &&
              Math.random() < 0.25
            ) {
              wells.push({
                x: lx + 60,
                y: ly - 100,
                r: 110,
                core: 10,
              });
              platformHasObstacle = true;
            }

            // lava wall hazard from this platform (bottom-up wall)
            if (
              currentLevel >= 15 &&
              canPlaceOnPlatform &&
              !hasFakeHazard &&
              (allowObstacleStacking || !platformHasObstacle) &&
              Math.random() < 0.22 &&
              Math.abs(lastP.x - 50) > 140 &&
              Math.abs(lastP.x - goal.x) > 120
            ) {
              const requiredHeight = 400 - lastP.y + 24; // ensure it reaches through platform
              const levelHeight = 100 + Math.min(140, currentLevel * 2);
              hazards.push({
                type: "lava",
                x: lastP.x + lastP.w / 2 - 12,
                w: 24,
                y: 400,
                h: 0,
                maxH: Math.max(requiredHeight, levelHeight),
                speed: 1.6 + Math.min(2.6, currentLevel * 0.03),
                rising: true,
                hold: 0,
                holdMax: 40,
                warned: false,
              });
              platformHasObstacle = true;
            }

            if (
              currentLevel >= 35 &&
              !shieldItem &&
              !isG &&
              !lastP.isPhase &&
              Math.random() < 0.2
            )
              shieldItem = {
                x: lastP.x + lastP.w / 2 - 10,
                y: lastP.y - 30,
                w: 20,
                h: 20,
                collected: false,
              };
            if (isG) {
              goal.x = lx + 40;
              goal.y = ly - 45;
            }
          }
        }

        function generateTutorialLevel() {
          shieldItem = {
            x: 2725,
            y: 160,
            w: 20,
            h: 20,
            collected: false,
          };
          wells = [
            { x: 3040, y: 238, r: 95, core: 10 },
            { x: 4300, y: 225, r: 105, core: 10 },
          ];
          hazards = [
            {
              type: "lava",
              x: 3240,
              w: 28,
              y: 400,
              h: 0,
              maxH: 100,
              speed: 1,
              rising: true,
              hold: 0,
              holdMax: 100,
              warned: false,
            },
            {
              type: "lava",
              x: 4400,
              w: 28,
              y: 400,
              h: 0,
              maxH: 110,
              speed: 1.15,
              rising: true,
              hold: 0,
              holdMax: 90,
              warned: false,
            },
          ];

          platforms = [
            makeTutorialPlatform(0, 350, 520, { h: 50 }),
            makeTutorialPlatform(610, 300, 140),
            makeTutorialPlatform(840, 260, 130, {
              moveRange: 70,
              moveSpeed: 1.35,
            }),
            makeTutorialPlatform(1050, 240, 130, {
              isPhase: true,
            }),
            makeTutorialPlatform(1270, 250, 150, {
              hasSpeedZone: true,
              speedZoneType: "boost",
              speedZoneX: 35,
              speedZoneW: 80,
              speedZoneDuration: 420,
              speedZoneMul: 1.6,
            }),
            makeTutorialPlatform(1500, 250, 145, {
              hasSpeedZone: true,
              speedZoneType: "slow",
              speedZoneX: 34,
              speedZoneW: 72,
              speedZoneDuration: 360,
              speedZoneMul: 0.6,
            }),
            makeTutorialPlatform(1730, 250, 160, {
              hasSpike: true,
              spikeX: 62,
              spikeW: 26,
              spikeH: 13,
              spikeShape: "wide",
            }),
            makeTutorialPlatform(1980, 232, 150, {
              hasSeeker: true,
              seekerW: 18,
              seekerH: 14,
              seekerShape: "split",
            }),
            makeTutorialPlatform(2230, 250, 145, {
              isSinking: true,
            }),
            makeTutorialPlatform(2460, 230, 150, {
              hasFakeHazard: true,
              fakeType: "ghostSpike",
              fakeX: 72,
              fakeW: 22,
              fakeH: 16,
            }),
            makeTutorialPlatform(2680, 225, 150),
            makeTutorialPlatform(2900, 210, 160),
            makeTutorialPlatform(3160, 230, 155),
            makeTutorialPlatform(3400, 210, 150, {
              hasSpike: true,
              spikeX: 52,
              spikeW: 24,
              spikeH: 15,
              spikeShape: "split",
            }),
            makeTutorialPlatform(3620, 245, 170),
            makeTutorialPlatform(3860, 230, 180),
            makeTutorialPlatform(4120, 220, 155, {
              isPhase: true,
              hasSpeedZone: true,
              speedZoneType: "boost",
              speedZoneX: 40,
              speedZoneW: 70,
              speedZoneDuration: 380,
              speedZoneMul: 1.55,
            }),
            makeTutorialPlatform(4360, 220, 150, {
              hasSeeker: true,
              seekerW: 16,
              seekerH: 14,
              seekerShape: "wide",
              hasSpeedZone: true,
              speedZoneType: "slow",
              speedZoneX: 18,
              speedZoneW: 48,
              speedZoneDuration: 330,
              speedZoneMul: 0.58,
            }),
            makeTutorialPlatform(4600, 190, 160, {
              hasFakeHazard: true,
              fakeType: "ghostBlock",
              fakeX: 96,
              fakeW: 24,
              fakeH: 16,
            }),
            makeTutorialPlatform(4820, 225, 170, {
              isSinking: true,
            }),
            makeTutorialPlatform(5060, 210, 180),
            makeTutorialPlatform(5300, 220, 170),
          ];

          goal.x = 5530;
          goal.y = 175;
          goal.w = 40;
          goal.h = 40;
          tutorialHintText = "";
          updateTutorialHint();
        }
        // Handle player death and reset after falling/out of bounds/hazard hit
        function resetPlayerForRun(spawnY = 200) {
          player.x = 50;
          player.y = spawnY;
          player.vx = 0;
          player.vy = 0;
          player.trail = [];
          player.invincibleTimer = 0;
          player.isBeingRescued = false;
          player.rescueTarget = null;
          player.stretchX = 1;
          player.stretchY = 1;
          player.coyoteTime = 0;
          player.jumpBuffer = 0;
          player.jumpHeld = false;
          player.hasAirJump = true;
          player.dashCooldown = 0;
          player.dashSpeed = 15;
          player.dashDuration = 15;
          player.dashTimer = 0;
          player.currentDashSpeed = 15;
          player.dashHeld = false;
          noMoveStartJumpCount = 0;
          noMoveStartMoved = false;
          noMoveStartX = player.x;
          speedDemonRunHeldThisLevel = !!(keys["ShiftLeft"] || keys["ShiftRight"]);
        }

        function die() {
          if (player.spaghettified) return;
          // Speed Running Mode: any death instantly shows game over (no respawn)
          if (speedRunMode) {
            showSpeedRunGameOver();
            return;
          }
          
          // Check for "Floor is Lava" achievement (run mode only, magma theme).
          if (!tutorialMode && !speedRunMode && currentTheme === "magma") {
            unlockAchievement("floorIsLava");
          }
          
          shake = 15;
          deathCount++;
          document.getElementById("deaths").textContent = deathCount;
          if (!tutorialMode) {
            currentLevel = lastCheckpoint;
          }
          setLevelDisplay();
          play.di();
          container.style.borderColor = "#f44";
          setTimeout(() => (container.style.borderColor = "#333"), 200);
          if (tutorialMode) {
            generateTutorialLevel();
          } else {
            generateLevel();
          }
          resetPlayerForRun(330);
          player.hasShield = false;
          player.spaghettified = false;
          player.deathScale = 1;
          player.deathRotate = 0;
          player.isBeingRescued = false;
          player.stretchX = 1;
          player.stretchY = 1;
          player.coyoteTime = 0;
          player.jumpBuffer = 0;
          player.speedZoneTimer = 0;
          player.speedZoneType = null;
          player.speedZoneMul = 1;
          player.standPlatform = null;
        }
        function findSafePlatform() {
          let s = platforms;
          let minD = Infinity;
          platforms.forEach((p) => {
            if (!p.isPhase && !p.hasSpike && !p.hasSeeker && !p.isSinking) {
              let d = Math.abs(p.x - player.x);
              if (d < minD) {
                minD = d;
                s = p;
              }
            }
          });
          return s;
        }
        function emitJumpDust() {
          for (let i = 0; i < 12; i++) {
            jumpDust.push({
              x: player.x + player.w / 2 + (Math.random() - 0.5) * 8,
              y: player.y + player.h,
              vx: (Math.random() - 0.5) * 2.5,
              vy: -4 - Math.random() * 1.5,
              size: 2 + Math.random() * 2,
              alpha: 0.85,
              life: 18 + Math.floor(Math.random() * 8),
            });
          }
        }

        function emitPlatformChips() {
          for (let i = 0; i < 8; i++) {
            jumpDust.push({
              x: player.x + player.w / 2 + (Math.random() - 0.5) * 12,
              y: player.y + player.h + 2,
              vx: (Math.random() - 0.5) * 3,
              vy: -2 - Math.random() * 2,
              size: 1 + Math.random() * 2,
              alpha: 0.9,
              life: 25 + Math.floor(Math.random() * 10),
            });
          }
        }

        function performJump(useAirJump = false) {
          player.vy = player.jump;
          player.grounded = false;
          player.jumpBuffer = 0;
          if (useAirJump) player.hasAirJump = false;

          // Count only run-mode jumps (exclude tutorial and speedrun achievements).
          if (!tutorialMode && !speedRunMode) {
            totalRunModeJumps++;
            localStorage.setItem("void_total_run_jumps", String(totalRunModeJumps));
            if (totalRunModeJumps >= 500) {
              unlockAchievement("spacebarCrusher");
            }

            if (!noMoveStartMoved) {
              noMoveStartJumpCount++;
              if (noMoveStartJumpCount >= 50) {
                unlockAchievement("isThisThingOn");
              }
            }
          }

          play.jp();
          player.stretchX = 0.6;
          player.stretchY = 1.4;
          emitJumpDust();
        }

        function win() {
          if (tutorialMode) {
            play.cp();
            const prevText = cpNotif.textContent;
            cpNotif.textContent = "Tutorial Complete! Showing settings + notes next...";
            cpNotif.style.opacity = "1";
            container.style.borderColor = "#0f0";
            container.style.boxShadow = "0 0 30px #0f0";
            setTimeout(() => {
              container.style.borderColor = "#333";
              container.style.boxShadow = "none";
              cpNotif.style.opacity = "0";
              cpNotif.textContent = prevText;
              tutorialMode = false;
              setTutorialUiVisible(false);
              runPostTutorialSettingsTour();
            }, 2200);
            return;
          }
          currentLevel++;
          setLevelDisplay();
          // Check if speed run mode reached level 100
          if (speedRunMode && currentLevel > 100) {
            const elapsedTime = Date.now() - speedRunStartTime;
            play.wn();
            const prevText = cpNotif.textContent;
            cpNotif.textContent = `Speed Run Complete! Final Time: ${formatSpeedRunTime(elapsedTime)}`;
            cpNotif.style.opacity = "1";
            container.style.borderColor = "#f44";
            container.style.boxShadow = "0 0 30px #f44";
            running = false;
            setTimeout(() => {
              container.style.borderColor = "#333";
              container.style.boxShadow = "none";
              cpNotif.style.opacity = "0";
              cpNotif.textContent = prevText;
              speedRunMode = false;
              document.getElementById("speedRunTimer").classList.remove("active");
              returnToStartMenu();
            }, 3500);
            return;
          }
          for (let i = 0; i < 30; i++)
            winParticles.push({
              x: goal.x + goal.w / 2,
              y: goal.y + goal.h / 2,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              l: 40,
            });
          // Skip checkpoint logic in speed run mode
          if (!speedRunMode && currentLevel % 5 === 0) {
            lastCheckpoint = currentLevel;
            play.cp();
            flashAlpha = 0.5;
            cpNotif.style.opacity = "1";
            container.style.borderColor = "#0f0";
            container.style.boxShadow = "0 0 30px #0f0";
            setTimeout(() => {
              container.style.borderColor = "#333";
              container.style.boxShadow = "none";
              cpNotif.style.opacity = "0";
            }, 1500);
          } else play.wn();
          if (!cheatsUsed) {
            if (speedRunMode && currentLevel > speedRunBestLevel) {
              speedRunBestLevel = currentLevel;
              localStorage.setItem("core_speedrun_best_level_v1", speedRunBestLevel);
              updateBestLevelUi();
            } else if (!speedRunMode && currentLevel > bestLevel) {
              bestLevel = currentLevel;
              localStorage.setItem("core_best_v20", bestLevel);
              updateBestLevelUi();
            }
          }
          if (!tutorialMode && !speedRunMode && speedDemonRunHeldThisLevel) {
            speedDemonLevelCount++;
            localStorage.setItem(
              "void_speed_demon_level_count",
              String(speedDemonLevelCount)
            );
            if (speedDemonLevelCount >= 10) {
              unlockAchievement("speedDemon");
            }
          }
          resetPlayerForRun(200);
          player.x = 50;
          player.y = 200;
          player.vx = 0;
          player.vy = 0;
          player.invincibleTimer = 0;
          player.isBeingRescued = false;
          player.speedZoneTimer = 0;
          player.speedZoneType = null;
          player.speedZoneMul = 1;
          player.standPlatform = null;
          generateLevel();
          if (speedRunMode) {
            resetSpeedRunGlitchWall();
          }
        }

        function resetSpeedRunGlitchWall() {
          speedRunGlitchWallX = -260;
          speedRunGlitchWallSpeed = 0.78 + Math.min(1.05, currentLevel * 0.02);
        }

        // Main game simulation, runs every frame before draw()
        function update() {
          if (!running || isPaused) return;
          frameCount++;
          if (shake > 0) shake *= 0.9;
          if (flashAlpha > 0) flashAlpha -= 0.02;
          player.stretchX += (1 - player.stretchX) * 0.15;
          player.stretchY += (1 - player.stretchY) * 0.15;
          // Update speed run timer display
          if (speedRunMode && !speedRunGameOverMode) {
            const elapsedTime = Date.now() - speedRunStartTime;
            document.getElementById("speedRunTimer").textContent = formatSpeedRunTime(elapsedTime);
            speedRunGlitchWallX += speedRunGlitchWallSpeed;
            if (
              player.x + player.w > speedRunGlitchWallX &&
              player.x < speedRunGlitchWallX + speedRunGlitchWallW
            ) {
              showSpeedRunGameOver();
              return;
            }
          }
          for (let i = winParticles.length - 1; i >= 0; i--) {
            let p = winParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.l--;
            if (p.l <= 0) winParticles.splice(i, 1);
          }
          if (player.isBeingRescued) {
            let tX =
                player.rescueTarget.x +
                player.rescueTarget.w / 2 -
                player.w / 2,
              tY = player.rescueTarget.y - player.h - 5;
            player.x += (tX - player.x) * 0.08;
            player.y += (tY - player.y) * 0.08;
            if (Math.abs(player.x - tX) < 5 && Math.abs(player.y - tY) < 5) {
              player.isBeingRescued = false;
              player.vx = 0;
              player.vy = 0;
              player.invincibleTimer = 60;
            }
            return;
          }
          if (player.invincibleTimer > 0) player.invincibleTimer--;
          if (player.spaghettified) {
            player.deathScale *= 0.96;
            player.deathRotate += 0.15;
            if (player.deathScale < 0.05) {
              player.spaghettified = false;
              die();
            }
            return;
          }
          if (keys["ShiftLeft"] || keys["ShiftRight"] || player.dashTimer > 0) {
            player.trail.push({ x: player.x, y: player.y });
          if (player.trail.length > 12) player.trail.shift();
          } else {
            player.trail = [];
          }
          let activeSpeedZone = null;
          for (let p of platforms) {
            if (!p.hasSpeedZone) continue;
            const zoneX = p.x + p.speedZoneX;
            if (
              player.x + player.w > zoneX &&
              player.x < zoneX + p.speedZoneW &&
              player.y + player.h >= p.y - 6 &&
              player.y + player.h <= p.y + p.h + 8
            ) {
              activeSpeedZone = p;
              break;
            }
          }
          if (activeSpeedZone) {
            if (player.speedZoneType === activeSpeedZone.speedZoneType) {
              player.speedZoneTimer = Math.max(
                player.speedZoneTimer,
                activeSpeedZone.speedZoneDuration,
              );
            } else {
              player.speedZoneTimer = activeSpeedZone.speedZoneDuration;
            }
            player.speedZoneType = activeSpeedZone.speedZoneType;
            player.speedZoneMul = activeSpeedZone.speedZoneMul;
          }
          if (player.speedZoneTimer > 0) {
            player.speedZoneTimer--;
          } else {
            player.speedZoneType = null;
            player.speedZoneMul = 1;
          }

          if (!(keys["ShiftLeft"] || keys["ShiftRight"])) {
            speedDemonRunHeldThisLevel = false;
          }
          
          // Handle dash cooldown and duration
          if (player.dashCooldown > 0) player.dashCooldown--;
          if (player.dashTimer > 0) {
            player.dashTimer--;
            if (player.dashTimer === 0) {
              player.dashCooldown = 90; // 1.5 second cooldown at 60fps
            }
          }
          
          // Check for dash input (Q key) using edge detection so dash only triggers on a fresh press
          const dashKeyDown = !!keys["KeyQ"];
          const dashPressed = dashKeyDown && !player.dashHeld;
          player.dashHeld = dashKeyDown;
          if (dashPressed && player.dashCooldown === 0 && player.dashTimer === 0) {
            player.dashTimer = player.dashDuration;
            // Determine dash direction based on current momentum or input
            let dashDir = player.momentumX !== 0 ? Math.sign(player.momentumX) : 
                         ((keys["ArrowRight"] || keys["KeyD"] ? 1 : 0) - (keys["ArrowLeft"] || keys["KeyA"] ? 1 : 0));
            if (dashDir === 0) dashDir = 1; // Default to right if no direction
            
            // Increase dash speed if sprinting
            let currentDashSpeed = player.dashSpeed;
            if (keys["ShiftLeft"] || keys["ShiftRight"]) {
              currentDashSpeed *= 1.5; // 50% faster when sprinting
            }
            player.currentDashSpeed = currentDashSpeed;
            
            player.vx = dashDir * currentDashSpeed;
            player.vy = 0; // Reset vertical velocity for cleaner dash
            play.dash();
            // Add dash trail effect
            player.trail.push({ x: player.x, y: player.y });
            if (player.trail.length > 12) player.trail.shift();
          }
          
          let s =
            keys["ShiftLeft"] || keys["ShiftRight"]
              ? player.runSpeed
              : player.speed;
          s *= player.speedZoneMul;
          let inputDir =
            (keys["ArrowRight"] || keys["KeyD"] ? 1 : 0) -
            (keys["ArrowLeft"] || keys["KeyA"] ? 1 : 0);
          if (inputDir !== 0) {
            noMoveStartMoved = true;
            player.momentumX += inputDir * 0.6;
            player.momentumX = Math.max(-s, Math.min(s, player.momentumX));
          } else {
            player.momentumX *= 0.8;
            if (Math.abs(player.momentumX) < 0.03) player.momentumX = 0;
          }
          
          // Apply dash velocity or normal momentum
          if (player.dashTimer > 0) {
            // During dash, maintain dash velocity
            player.vx = Math.sign(player.vx) * player.currentDashSpeed;
          } else {
            player.vx = player.momentumX;
          }
          
          player.vy += 0.6;
          let dead = false,
            suckedIn = false;
          wells.forEach((w) => {
            let dx = w.x - (player.x + 10),
              dy = w.y - (player.y + 10),
              dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < w.r) {
              let f = (1 - dist / w.r) * 1.1;
              player.vx += (dx / dist) * f;
              player.vy += (dy / dist) * f;
              if (w.core > 0 && dist < w.core) {
                if (player.hasShield) {
                  player.hasShield = false;
                  player.invincibleTimer = 120;
                  player.vy = -16;
                  play.di();
                } else if (
                  player.invincibleTimer <= 0 &&
                  !infiniteInvincibility
                ) {
                  suckedIn = true;
                  dead = true;
                }
              }
            }
          });
          if (player.grounded) player.coyoteTime = 6;
          else if (player.coyoteTime > 0) player.coyoteTime--;
          const jumpPressed =
            keys["ArrowUp"] || keys["KeyW"] || keys["Space"];
          if (jumpPressed && !player.jumpHeld) player.jumpBuffer = 6;
          else if (player.jumpBuffer > 0) player.jumpBuffer--;
          player.jumpHeld = jumpPressed;
          if (player.jumpBuffer > 0 && player.coyoteTime > 0) {
            player.coyoteTime = 0;
            // Cancel dash if jumping from ground
            if (player.dashTimer > 0) {
              player.dashTimer = 0;
              player.dashCooldown = 90; // Reset cooldown when canceling dash with jump
            }
            performJump(false);
          } else if (player.jumpBuffer > 0 && player.hasAirJump && player.coyoteTime === 0) {
            // Cancel dash if using air jump
            if (player.dashTimer > 0) {
              player.dashTimer = 0;
              player.dashCooldown = 90; // Reset cooldown when canceling dash with jump
            }
            performJump(true);
          }
          hazards.forEach((h) => {
            if (h.type === "lava") {
              if (!h.warned && h.rising && h.h < 10) {
                h.warned = true;
                sfx(270, "sawtooth", 0.07, 0.11, 240);
              }
              if (h.h >= h.maxH && h.rising) {
                h.h = h.maxH;
                h.hold = (h.hold || 0) + 1;
                if (h.hold >= h.holdMax) {
                  h.rising = false;
                  h.hold = 0;
                }
              } else if (h.h <= 0 && !h.rising) {
                h.h = 0;
                h.hold = (h.hold || 0) + 1;
                if (h.hold >= h.holdMax) {
                  h.rising = true;
                  h.hold = 0;
                  h.warned = false;
                }
              } else {
                h.h += h.rising ? h.speed : -h.speed;
                h.h = Math.max(0, Math.min(h.maxH, h.h));
              }
              h.y = 400 - h.h;

              // emit rim particles while active
              if (h.h > 10 && Math.random() < 0.35) {
                const lavaFx = getLavaFx(currentTheme);
                lavaParticles.push({
                  x: h.x + Math.random() * h.w,
                  y: h.y,
                  vx: (Math.random() - 0.5) * 0.6,
                  vy: -1 - Math.random() * 0.8,
                  life: 24 + Math.floor(Math.random() * 12),
                  size: 1 + Math.random() * 2,
                  tintMix: Math.random(),
                  particleA: lavaFx.particleA,
                  particleB: lavaFx.particleB,
                  style: lavaFx.particleStyle,
                });
              }
            } else if (h.r) {
              h.sy += h.s * h.dir;
              if (h.sy > h.r || h.sy < 50) h.dir *= -1;
              h.y = h.sy;
            }
          });
          let nX = player.x + player.vx,
            nY = player.y + player.vy;
          let wasGrounded = player.grounded;
          player.grounded = false;
          let maxPlatformDelta = 0;
          platforms.forEach((p) => {
            p.isSolidNow = !p.isPhase || frameCount % 300 < 240;
            let dX = 0;
            let dY = 0;
            const oY = p.y;
            if (p.moveRange > 0) {
              let oX = p.x;
              p.x += p.moveSpeed * p.moveDir;
              if (p.x > p.startX + p.moveRange || p.x < p.startX - p.moveRange)
                p.moveDir *= -1;
              dX = p.x - oX;
            }
            if (p.isSinking && p.isTouched) p.y += 2.5;
            dY = p.y - oY;
            p.deltaX = dX;
            p.deltaY = dY;
            maxPlatformDelta = Math.max(
              maxPlatformDelta,
              Math.abs(dX),
              Math.abs(dY),
            );
            if (p.hasSeeker) {
              p.seekerX += 2.5 * p.seekerDir;
              if (p.seekerX > p.w - p.seekerW || p.seekerX < 0) p.seekerDir *= -1;
            }
          });

          // Sub-steps reduce tunneling and improve corner handling.
          const steps = Math.max(
            1,
            Math.ceil(
              Math.max(Math.abs(player.vx), Math.abs(player.vy), maxPlatformDelta) /
                8,
            ),
          );
          const stepX = player.vx / steps;
          const stepY = player.vy / steps;
          let resolvedX = player.x;
          let resolvedY = player.y;
          let inheritedLandingMove = false;

          // Carry player with moving platforms when standing on top.
          if (wasGrounded && player.vy >= 0) {
            let carryPlatform = null;
            if (
              player.standPlatform &&
              player.standPlatform.isSolidNow &&
              platforms.includes(player.standPlatform)
            ) {
              carryPlatform = player.standPlatform;
            } else {
              for (let p of platforms) {
                if (!p.isSolidNow) continue;
                if (
                  Math.abs(player.y + player.h - p.y) < 10 &&
                  player.x + player.w > p.x + 1 &&
                  player.x < p.x + p.w - 1
                ) {
                  carryPlatform = p;
                  break;
                }
              }
            }
            if (carryPlatform) {
              resolvedX += carryPlatform.deltaX || 0;
              resolvedY += carryPlatform.deltaY || 0;
            }
          }

          for (let i = 0; i < steps; i++) {
            let nextX = resolvedX + stepX;
            for (let p of platforms) {
              if (!p.isSolidNow) continue;
              if (
                nextX < p.x + p.w &&
                nextX + player.w > p.x &&
                resolvedY < p.y + p.h &&
                resolvedY + player.h > p.y
              ) {
                if (stepX > 0) {
                  nextX = p.x - player.w;
                } else if (stepX < 0) {
                  nextX = p.x + p.w;
                } else {
                  // Resolve stationary penetrations (e.g., platform moving into player).
                  const pushLeft = p.x - player.w - nextX;
                  const pushRight = p.x + p.w - nextX;
                  nextX +=
                    Math.abs(pushLeft) <= Math.abs(pushRight)
                      ? pushLeft
                      : pushRight;
                }
                player.vx = 0;
                player.momentumX = 0;
              }
            }
            resolvedX = nextX;

            let nextY = resolvedY + stepY;
            for (let p of platforms) {
              if (!p.isSolidNow) continue;
              if (
                resolvedX < p.x + p.w &&
                resolvedX + player.w > p.x &&
                nextY < p.y + p.h &&
                nextY + player.h > p.y
              ) {
                if (stepY >= 0 && resolvedY + player.h <= p.y + 1) {
                  nextY = p.y - player.h;
                  player.vy = 0;
                  player.grounded = true;
                  player.hasAirJump = true; // restore air jump on landing
                  if (!wasGrounded && !inheritedLandingMove && p.deltaX) {
                    resolvedX += p.deltaX;
                    resolvedY += p.deltaY || 0;
                    inheritedLandingMove = true;
                  }
                  if (p.isSinking) p.isTouched = true;
                  player.standPlatform = p;
                  if (!wasGrounded) {
                    player.stretchX = 1.5;
                    player.stretchY = 0.5;
                  }
                } else if (stepY < 0 && resolvedY >= p.y + p.h - 1) {
                  nextY = p.y + p.h;
                  player.vy = 0;
                }
              }
            }
            resolvedY = nextY;
          }

          nX = resolvedX;
          nY = resolvedY;

          if (shieldItem && !shieldItem.collected) {
            if (
              nX < shieldItem.x + shieldItem.w &&
              nX + player.w > shieldItem.x &&
              nY < shieldItem.y + shieldItem.h &&
              nY + player.h > shieldItem.y
            ) {
              shieldItem.collected = true;
              player.hasShield = true;
              play.wn();
            }
          }
          if (player.invincibleTimer <= 0 && !dead && !infiniteInvincibility) {
            for (let h of hazards) {
              if (
                nX < h.x + h.w &&
                nX + player.w > h.x &&
                nY < h.y + h.h &&
                nY + player.h > h.y
              ) {
                dead = true;
                break;
              }
            }
            for (let p of platforms) {
              if (p.hasSpike || p.hasSeeker) {
                let sx = p.hasSpike ? p.x + p.spikeX : p.x + p.seekerX;
                let sw = p.hasSpike ? p.spikeW : p.seekerW;
                let sh = p.hasSpike ? p.spikeH : p.seekerH;
                if (
                  nX + player.w > sx &&
                  nX < sx + sw &&
                  nY + player.h > p.y - sh &&
                  nY < p.y
                ) {
                  dead = true;
                  break;
                }
              }
            }
          }
          if (nY > 400) {
            if (player.hasShield || infiniteInvincibility) {
              player.hasShield = false;
              player.isBeingRescued = true;
              player.rescueTarget = findSafePlatform();
              play.grab();
              return;
            } else {
              die();
              return;
            }
          }
          if (dead) {
            if (player.hasShield && !suckedIn) {
              player.hasShield = false;
              player.invincibleTimer = 120;
              player.vy = -8;
              play.di();
            } else if (suckedIn) {
              player.spaghettified = true;
              play.well();
              return;
            } else {
              die();
              return;
            }
          }
          player.x = nX;
          player.y = nY;
          if (Math.abs(player.x - noMoveStartX) > 1.5) {
            noMoveStartMoved = true;
          }
          if (tutorialMode) updateTutorialHint();
          if (player.grounded) player.hasAirJump = true; // always restore while touching ground
          if (!player.grounded) player.standPlatform = null;
          if (!wasGrounded && player.grounded) {
            if (currentTheme === "pirate") {
              emitPlatformChips();
            } else {
              emitJumpDust();
            }
          }
          if (
            player.x + player.w > goal.x &&
            player.x < goal.x + goal.w &&
            player.y + player.h > goal.y &&
            player.y < goal.y + goal.h
          ) {
            win();
            return;
          }
        }
        // Render player sprite/shape based on current theme and status effects (shield, rescue, spaghettified)
        function drawPlayer(x, y, c) {
          ctx.save();
          ctx.translate(x + player.w / 2, y + player.h);
          ctx.scale(player.stretchX, player.stretchY);
          ctx.translate(-(x + player.w / 2), -(y + player.h));
          if (player.spaghettified) {
            let tw = wells.find((w) => Math.abs(w.x - (player.x + 10)) < w.r);
            if (tw) {
              let camX = player.x - 150;
              ctx.translate(tw.x - camX, tw.y);
              ctx.rotate(player.deathRotate);
              ctx.scale(player.deathScale, player.deathScale * 3);
              x = -10;
              y = -10;
            }
          }
          if (player.invincibleTimer > 0 || infiniteInvincibility) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#fff";
            ctx.globalAlpha = 0.5 + Math.sin(frameCount / 5) * 0.3;
          }
          if (player.isBeingRescued) {
            ctx.fillStyle = "#e0ac69";
            let hX = x - 5,
              hY = y - 5;
            ctx.fillRect(hX + 10, hY + 25, 10, 20);
            ctx.fillRect(hX + 2, hY + 10, 26, 15);
            ctx.fillStyle = "#d29958";
            ctx.fillRect(hX - 2, hY + 15, 6, 6);
            ctx.fillRect(hX + 4, hY - 4, 4, 14);
            ctx.fillRect(hX + 10, hY - 8, 4, 18);
            ctx.fillRect(hX + 16, hY - 6, 4, 16);
            ctx.fillRect(hX + 22, hY, 4, 10);
          }
          if (currentTheme === "moony") {
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(x + 10, y + 10, 10, 0, Math.PI * 2);
            ctx.fill();
          } else if (currentTheme === "sunny") {
            ctx.fillStyle = c;
            const cX = x + 10,
              cY = y + 10;
            ctx.beginPath();
            ctx.arc(cX, cY, 7, 0, Math.PI * 2);
            ctx.fill();
            for (let i = 0; i < 8; i++) {
              ctx.beginPath();
              let a = (i / 8) * (Math.PI * 2);
              ctx.moveTo(cX + Math.cos(a) * 7, cY + Math.sin(a) * 7);
              ctx.lineTo(cX + Math.cos(a) * 11, cY + Math.sin(a) * 11);
              ctx.lineWidth = 2;
              ctx.strokeStyle = c;
              ctx.stroke();
            }
          } else if (currentTheme === "toybox") {
            ctx.fillStyle = c;
            ctx.fillRect(x + 2, y + 6, 16, 14);
            ctx.fillRect(x + 5, y + 1, 10, 5);
            ctx.fillRect(x + 9, y, 2, 2);
            ctx.fillStyle = "#fff";
            ctx.fillRect(x + 7, y + 2, 2, 2);
            ctx.fillRect(x + 11, y + 2, 2, 2);
          } else if (currentTheme === "deepsea") {
            ctx.fillStyle = c;
            ctx.fillRect(x, y + 5, 20, 12);
            ctx.fillRect(x + 12, y + 1, 2, 4);
            ctx.fillRect(x + 12, y + 1, 4, 2);
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(x + 8, y + 11, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (currentTheme === "glitchworld") {
            const jitterX = Math.sin(frameCount * 0.25 + y) * 1.3;
            const jitterY = Math.cos(frameCount * 0.18 + x) * 0.9;
            ctx.fillStyle = c;
            ctx.fillRect(x - 1 + jitterX, y + jitterY, 22, 20);
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = "#ff3bb5";
            ctx.fillRect(x - 3 + jitterX, y + 2 + jitterY, 20, 16);
            ctx.fillStyle = "#52e3ff";
            ctx.fillRect(x + 2 + jitterX, y - 2 + jitterY, 16, 16);
            ctx.restore();
            ctx.fillStyle = "#0a0a14";
            ctx.fillRect(x + 6 + jitterX, y + 6 + jitterY, 8, 8);
          } else if (currentTheme === "easter") {
            // Classic cube body with bunny ears and a small basket.
            ctx.fillStyle = c;
            ctx.fillRect(x, y, player.w, player.h);

            // Bunny ears.
            ctx.fillStyle = "#fff";
            ctx.fillRect(x + 4, y - 10, 4, 10);
            ctx.fillRect(x + 12, y - 10, 4, 10);
            ctx.fillStyle = "#ffb7d8";
            ctx.fillRect(x + 5, y - 8, 2, 7);
            ctx.fillRect(x + 13, y - 8, 2, 7);

            // Basket held in front.
            ctx.fillStyle = "#9c6a3a";
            ctx.fillRect(x + 11, y + 9, 9, 7);
            ctx.strokeStyle = "#74471f";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + 15.5, y + 9, 4, Math.PI, 0);
            ctx.stroke();
            ctx.fillStyle = "#ffd27f";
            ctx.fillRect(x + 12, y + 11, 2, 2);
            ctx.fillStyle = "#9de4c9";
            ctx.fillRect(x + 15, y + 12, 2, 2);
          } else if (currentTheme === "aprilfools") {
            const wobble = Math.sin(frameCount * 0.3 + y * 0.1) * 1.4;
            ctx.fillStyle = c;
            ctx.fillRect(x - 1, y + wobble, player.w + 2, player.h);

            // Layered pastel offset blocks sell the intentionally chaotic look.
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = "#b5f1ff";
            ctx.fillRect(x + 2, y - 2 + wobble, 15, 14);
            ctx.fillStyle = "#ffe39a";
            ctx.fillRect(x - 2, y + 4 + wobble, 14, 12);
            ctx.fillStyle = "#ffc1e2";
            ctx.fillRect(x + 6, y + 7 + wobble, 13, 11);
            ctx.restore();

            // Tiny party hat.
            ctx.fillStyle = "#ff86c5";
            ctx.beginPath();
            ctx.moveTo(x + 10, y - 11 + wobble);
            ctx.lineTo(x + 4, y - 1 + wobble);
            ctx.lineTo(x + 16, y - 1 + wobble);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#fff7b8";
            ctx.fillRect(x + 9, y - 12 + wobble, 2, 2);
          } else if (currentTheme === "tjtheme") {
            const tjPlayerImage = getThemePlayerImage("tjtheme");
            if (tjPlayerImage && tjPlayerImage.complete && tjPlayerImage.naturalWidth > 0) {
              ctx.drawImage(tjPlayerImage, x - 3, y - 2, player.w + 6, player.h + 6);
            } else {
              const bob = Math.sin(frameCount * 0.08 + x * 0.05) * 0.7;
              ctx.save();
              ctx.translate(0, bob);

              // Round yellow rubber duck body.
              ctx.fillStyle = "#ffd94d";
              ctx.beginPath();
              ctx.ellipse(x + 10, y + 12, 11, 9, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#f8cb2d";
              ctx.beginPath();
              ctx.ellipse(x + 10, y + 12, 8.5, 6.8, 0, 0, Math.PI * 2);
              ctx.fill();

              // Head and cheek highlight.
              ctx.fillStyle = "#ffd94d";
              ctx.beginPath();
              ctx.ellipse(x + 10, y + 9, 8.5, 7, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "rgba(255,255,255,0.16)";
              ctx.beginPath();
              ctx.ellipse(x + 6.5, y + 11.5, 3.2, 2.1, -0.25, 0, Math.PI * 2);
              ctx.fill();

              // Orange beak.
              ctx.fillStyle = "#ff7a1a";
              ctx.beginPath();
              ctx.ellipse(x + 10, y + 12, 6.8, 4.2, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#ff9b3b";
              ctx.beginPath();
              ctx.ellipse(x + 10, y + 11.5, 5.4, 2.4, 0, 0, Math.PI * 2);
              ctx.fill();

              // Beak lip and nostril line.
              ctx.strokeStyle = "rgba(220,90,20,0.8)";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(x + 5.6, y + 12);
              ctx.lineTo(x + 14.6, y + 12);
              ctx.stroke();

              // Eyes.
              ctx.fillStyle = "#111";
              ctx.beginPath();
              ctx.arc(x + 7.5, y + 7.5, 1.7, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(x + 13, y + 7.5, 1.7, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#fff8d8";
              ctx.beginPath();
              ctx.arc(x + 8.1, y + 6.8, 0.45, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(x + 13.6, y + 6.8, 0.45, 0, Math.PI * 2);
              ctx.fill();

              // Tiny wing bumps.
              ctx.fillStyle = "#f0c71a";
              ctx.beginPath();
              ctx.ellipse(x + 3, y + 13.5, 2.5, 3.5, -0.55, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(x + 17, y + 13.5, 2.5, 3.5, 0.55, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }
          } else if (currentTheme === "pirate") {
            // Draw pirate body
            ctx.fillStyle = c;
            ctx.fillRect(x, y, player.w, player.h);
            
            // Draw beard
            ctx.fillStyle = "#3d3d3d";
            // Beard shape - triangular
            ctx.beginPath();
            ctx.moveTo(x + 4, y + 12);
            ctx.lineTo(x + 16, y + 12);
            ctx.lineTo(x + 10, y + 18);
            ctx.closePath();
            ctx.fill();
            
            // Beard texture lines
            ctx.strokeStyle = "#2a2a2a";
            ctx.lineWidth = 1;
            for (let i = 1; i < 5; i++) {
              let progress = i / 5;
              let startX = 4 + (16 - 4) * progress;
              let endX = 10;
              let startY = 12 + (18 - 12) * progress;
              let endY = 18;
              // Deterministic offset so beard does not flicker between frames
              const beardSeed = Math.sin(x * 12.9898 + y * 78.233 + i * 37.719) * 10000;
              const offset = (beardSeed - Math.floor(beardSeed) - 0.5) * 2;
              ctx.beginPath();
              ctx.moveTo(x + startX, y + startY);
              ctx.lineTo(x + endX + offset, y + endY);
              ctx.stroke();
            }
            
            // Draw pirate hat (tricorn/bicorne style)
            // Hat brim
            ctx.fillStyle = "#1a1a1a";
            ctx.beginPath();
            ctx.ellipse(x + 10, y - 3, 12, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Hat crown (pointed top)
            ctx.fillStyle = "#2a2a2a";
            ctx.beginPath();
            ctx.moveTo(x + 10, y - 8);
            ctx.lineTo(x + 4, y - 2);
            ctx.lineTo(x + 16, y - 2);
            ctx.closePath();
            ctx.fill();
            
            // Skull and crossbones on hat
            ctx.fillStyle = "#ffd700";
            // Skull
            ctx.beginPath();
            ctx.arc(x + 10, y - 5, 2, 0, Math.PI * 2);
            ctx.fill();
            // Crossbones
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 8, y - 5);
            ctx.lineTo(x + 12, y - 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 9, y - 4.5);
            ctx.lineTo(x + 11, y - 5.5);
            ctx.stroke();
          } else if (currentTheme === "jungle") {
            // Square monkey-style model that still matches the blocky player style.
            const monkeyColor = "#7a452d";
            const bellyColor = "#d7b58d";
            ctx.fillStyle = monkeyColor;
            ctx.fillRect(x + 2, y + 2, player.w - 4, player.h - 4);
            ctx.fillStyle = bellyColor;
            ctx.fillRect(x + 5, y + 6, player.w - 10, player.h - 10);
            ctx.strokeStyle = monkeyColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + player.w - 4, y + player.h - 6);
            ctx.quadraticCurveTo(
              x + player.w + 4,
              y + player.h - 12,
              x + player.w + 2,
              y + player.h - 2,
            );
            ctx.stroke();
          } else if (currentTheme === "catmodel") {
            const solPlayerImage = getThemePlayerImage("catmodel");
            if (
              solPlayerImage &&
              solPlayerImage.complete &&
              solPlayerImage.naturalWidth > 0
            ) {
              const maxW = player.w + 10;
              const maxH = player.h + 12;
              const scale = Math.min(
                maxW / solPlayerImage.naturalWidth,
                maxH / solPlayerImage.naturalHeight,
              );
              const drawW = solPlayerImage.naturalWidth * scale;
              const drawH = solPlayerImage.naturalHeight * scale;
              const drawX = x + (player.w - drawW) / 2;
              const drawY = y + (player.h - drawH) / 2;
              ctx.drawImage(solPlayerImage, drawX, drawY, drawW, drawH);
            } else {
              // Sol fallback if image is unavailable.
              const body = "#c393e8";
              const face = "#e7cffc";
              const earOuter = "#a860c7";
              const earInner = "#f8d7ff";
              const eyeWhite = "#ffffff";
              const eyeIris = "#f5d44a";
              const eyePupil = "#291e1a";
              const nose = "#ff8fba";
              const gem = "#ff61ab";
              const whisker = "#814887";

              // Body base
              ctx.fillStyle = body;
              ctx.fillRect(x, y, player.w, player.h);

              // Face piece
              ctx.fillStyle = face;
              ctx.fillRect(x + 2, y + 3, player.w - 4, player.h - 8);

              // Ears
              ctx.fillStyle = earOuter;
              ctx.beginPath();
              ctx.moveTo(x + 2, y);
              ctx.lineTo(x + 9, y - 12);
              ctx.lineTo(x + 15, y);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(x + 10, y);
              ctx.lineTo(x + 17, y - 12);
              ctx.lineTo(x + 23, y);
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = earInner;
              ctx.beginPath();
              ctx.moveTo(x + 4, y - 1);
              ctx.lineTo(x + 9, y - 8);
              ctx.lineTo(x + 13, y - 1);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(x + 12, y - 1);
              ctx.lineTo(x + 17, y - 8);
              ctx.lineTo(x + 21, y - 1);
              ctx.closePath();
              ctx.fill();

              // Gem
              ctx.fillStyle = gem;
              ctx.beginPath();
              ctx.moveTo(x + 10, y + 2);
              ctx.lineTo(x + 12, y - 1);
              ctx.lineTo(x + 14, y + 2);
              ctx.closePath();
              ctx.fill();

              // Eyes
              const leftEyeX = x + 5;
              const rightEyeX = x + 12;
              const eyeY = y + 8;
              ctx.fillStyle = eyeWhite;
              ctx.fillRect(leftEyeX, eyeY, 5, 6);
              ctx.fillRect(rightEyeX, eyeY, 5, 6);

              ctx.fillStyle = eyeIris;
              ctx.fillRect(leftEyeX + 1, eyeY + 1, 3, 5);
              ctx.fillRect(rightEyeX + 1, eyeY + 1, 3, 5);

              ctx.fillStyle = eyePupil;
              ctx.fillRect(leftEyeX + 2, eyeY + 2, 1, 3);
              ctx.fillRect(rightEyeX + 2, eyeY + 2, 1, 3);

              ctx.fillStyle = "rgba(255,255,255,0.85)";
              ctx.fillRect(leftEyeX + 2, eyeY + 2, 1, 1);
              ctx.fillRect(rightEyeX + 2, eyeY + 2, 1, 1);

              // Nose and mouth
              ctx.fillStyle = nose;
              ctx.fillRect(x + 10, y + 12, 2, 2);
              ctx.strokeStyle = whisker;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(x + 11, y + 14);
              ctx.lineTo(x + 9, y + 16);
              ctx.moveTo(x + 11, y + 14);
              ctx.lineTo(x + 13, y + 16);
              ctx.stroke();

              // Whiskers
              ctx.strokeStyle = whisker;
              ctx.beginPath();
              ctx.moveTo(x + 5, y + 13);
              ctx.lineTo(x + 2, y + 13);
              ctx.moveTo(x + 5, y + 15);
              ctx.lineTo(x + 2, y + 15);
              ctx.moveTo(x + 15, y + 13);
              ctx.lineTo(x + 18, y + 13);
              ctx.moveTo(x + 15, y + 15);
              ctx.lineTo(x + 18, y + 15);
              ctx.stroke();

              // Tail accent
              ctx.strokeStyle = "#a373b8";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x + player.w, y + player.h - 4);
              ctx.quadraticCurveTo(
                x + player.w + 7,
                y + player.h - 12,
                x + player.w + 4,
                y + player.h - 19,
              );
              ctx.stroke();
            }
          } else if (currentTheme === "zelda") {
            const zeldaPlayerImage = getThemePlayerImage("zelda");
            if (
              zeldaPlayerImage &&
              zeldaPlayerImage.complete &&
              zeldaPlayerImage.naturalWidth > 0
            ) {
              const maxW = player.w + 8;
              const maxH = player.h + 10;
              const scale = Math.min(
                maxW / zeldaPlayerImage.naturalWidth,
                maxH / zeldaPlayerImage.naturalHeight,
              );
              const drawW = zeldaPlayerImage.naturalWidth * scale;
              const drawH = zeldaPlayerImage.naturalHeight * scale;
              const drawX = x + (player.w - drawW) / 2;
              const drawY = y + (player.h - drawH) / 2;
              ctx.drawImage(zeldaPlayerImage, drawX, drawY, drawW, drawH);
            } else {
              // Keep the core block body but add Link-inspired hat details.
              ctx.fillStyle = c;
              ctx.fillRect(x, y, player.w, player.h);

              // Hat brim.
              ctx.fillStyle = "#1f8b3f";
              ctx.fillRect(x + 2, y + 1, 16, 4);

              // Hat crown and trailing tail.
              ctx.beginPath();
              ctx.moveTo(x + 3, y + 2);
              ctx.lineTo(x + 13, y - 8);
              ctx.lineTo(x + 19, y + 2);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(x + 15, y + 2);
              ctx.lineTo(x + 22, y + 6);
              ctx.lineTo(x + 14, y + 7);
              ctx.closePath();
              ctx.fill();

              // Hair under the cap.
              ctx.fillStyle = "#b67d2e";
              ctx.fillRect(x + 3, y + 9, 2, 5);
              ctx.fillRect(x + 15, y + 9, 2, 5);
            }
          } else {
            ctx.fillStyle = c;
            ctx.fillRect(x, y, player.w, player.h);
          }
          if (player.speedZoneTimer > 0) {
            const pulse = 0.45 + Math.sin(frameCount / 8) * 0.25;
            if (player.speedZoneType === "boost") {
              ctx.strokeStyle = `rgba(80,255,210,${0.55 + pulse})`;
              ctx.lineWidth = 2;
              ctx.strokeRect(x - 4, y - 4, player.w + 8, player.h + 8);
              ctx.fillStyle = `rgba(120,255,230,${0.3 + pulse * 0.25})`;
              ctx.fillRect(x - 8, y + 4, 3, 3);
              ctx.fillRect(x - 12, y + 9, 2, 2);
            } else if (player.speedZoneType === "slow") {
              ctx.strokeStyle = `rgba(255,190,90,${0.55 + pulse})`;
              ctx.lineWidth = 2;
              ctx.strokeRect(x - 4, y - 4, player.w + 8, player.h + 8);
              ctx.fillStyle = `rgba(255,210,130,${0.28 + pulse * 0.22})`;
              ctx.fillRect(x + player.w + 5, y + 5, 3, 3);
              ctx.fillRect(x + player.w + 10, y + 10, 2, 2);
            }
          }
          ctx.restore();
        }

        function drawGoalTriangle(ctx, cx, cy, size) {
          const h = size * 1.15;
          ctx.beginPath();
          ctx.moveTo(cx, cy - h / 2);
          ctx.lineTo(cx - size, cy + h / 2);
          ctx.lineTo(cx + size, cy + h / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Core world rendering in current theme
        function drawScene() {
          const t = themes[currentTheme];
          ctx.save();
          if (shake > 0)
            ctx.translate(
              (Math.random() - 0.5) * shake,
              (Math.random() - 0.5) * shake,
            );
          const camX = player.x - 150;
          if (t.aurora) {
            let s = Math.sin(frameCount / 100) * 20;
            let g = ctx.createLinearGradient(0, 0, 0, 400);
            g.addColorStop(0, "#000033");
            g.addColorStop(1, "#660099");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 800, 400);
          } else if (t.bgImage) {
            const bgImage = getThemeBackgroundImage(currentTheme);
            if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
              ctx.drawImage(bgImage, 0, 0, 800, 400);
              ctx.fillStyle = "rgba(11, 61, 46, 0.12)";
              ctx.fillRect(0, 0, 800, 400);
            } else {
              ctx.fillStyle = t.bg;
              ctx.fillRect(0, 0, 800, 400);
            }
          } else if (currentTheme === "sunny") {
            let g = ctx.createLinearGradient(0, 0, 0, 400);
            g.addColorStop(0, "#87CEEB");
            g.addColorStop(1, "#e0f6ff");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 800, 400);
            // Draw clouds
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.globalAlpha = 0.8;
            const cloudOffset = (camX * 0.3) % 800;
            sunnyClouds.forEach((cloud) => {
              const cx = cloud.x - cloudOffset;
              if (cx > -cloud.w && cx < 800) {
                const r = cloud.h * 0.5;
                const midR = cloud.h * 0.62;
                ctx.beginPath();
                ctx.arc(cx, cloud.y, r, 0, Math.PI * 2);
                ctx.arc(cx + cloud.w * 0.3, cloud.y - cloud.h * 0.25, midR, 0, Math.PI * 2);
                ctx.arc(cx + cloud.w * 0.6, cloud.y, r, 0, Math.PI * 2);
                ctx.fill();
              }
            });
            ctx.globalAlpha = 1;
          } else if (currentTheme === "toybox") {
            let g = ctx.createLinearGradient(0, 0, 0, 400);
            g.addColorStop(0, "#ffeb3b");
            g.addColorStop(1, "#fbc02d");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 800, 400);
          } else if (currentTheme === "deepsea") {
            let g = ctx.createLinearGradient(0, 0, 0, 400);
            g.addColorStop(0, "#0077be");
            g.addColorStop(1, "#001a33");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 800, 400);
          } else if (currentTheme === "cyber") {
            let g = ctx.createLinearGradient(0, 0, 0, 400);
            g.addColorStop(0, "#2a0a4a");
            g.addColorStop(0.5, "#4a105a");
            g.addColorStop(1, "#6a1a7a");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 800, 400);
          } else if (currentTheme === "glitchworld") {
            const base = ctx.createLinearGradient(0, 0, 800, 400);
            base.addColorStop(0, "#04010e");
            base.addColorStop(0.45, "#12062c");
            base.addColorStop(1, "#020307");
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, 800, 400);

            const drift = frameCount * 1.35;
            for (let i = 0; i < 16; i++) {
              const bandY = (i * 29 + drift) % 420;
              const width = 260 + ((i % 4) * 70);
              const startX = ((i * 93 - camX * 0.2) % 1000) - 120;
              const color = i % 2 === 0 ? "rgba(255,50,170,0.12)" : "rgba(80,255,245,0.1)";
              ctx.fillStyle = color;
              ctx.fillRect(startX, bandY, width, 2);
            }

            for (let y = 0; y < 400; y += 5) {
              const alpha = 0.06 + Math.sin((frameCount + y) * 0.08) * 0.03;
              ctx.fillStyle = `rgba(150,140,255,${alpha})`;
              ctx.fillRect(0, y, 800, 1);
            }

            for (let i = 0; i < 14; i++) {
              const shardX = ((i * 171 + frameCount * (0.9 + (i % 3) * 0.25)) % 980) - 90;
              const shardY = (i * 51 + Math.sin(frameCount * 0.03 + i) * 18 + 20) % 380;
              const len = 12 + (i % 5) * 6;
              ctx.strokeStyle = i % 2 === 0 ? "rgba(255,70,190,0.45)" : "rgba(90,250,255,0.45)";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(shardX, shardY);
              ctx.lineTo(shardX + len, shardY - len * 0.5);
              ctx.stroke();
            }
          } else if (currentTheme === "easter") {
            let g = ctx.createLinearGradient(0, 0, 0, 400);
            g.addColorStop(0, "#f9f3ff");
            g.addColorStop(0.55, "#e8f7ff");
            g.addColorStop(1, "#fef1d7");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 800, 400);

            // Soft horizontal color ribbons.
            const bands = ["rgba(255,190,220,0.25)", "rgba(180,240,225,0.22)", "rgba(255,230,160,0.22)"];
            for (let i = 0; i < 7; i++) {
              const y = 28 + i * 50 + Math.sin(frameCount * 0.02 + i) * 8;
              ctx.fillStyle = bands[i % bands.length];
              ctx.fillRect(0, y, 800, 18);
            }

            // Floating egg confetti.
            for (let i = 0; i < 18; i++) {
              const px = ((i * 123 + frameCount * (0.35 + (i % 4) * 0.08)) % 940) - 70;
              const py = 25 + ((i * 41 + Math.sin(frameCount * 0.015 + i) * 30) % 330);
              const hue = i % 3;
              ctx.fillStyle =
                hue === 0
                  ? "rgba(255,166,201,0.55)"
                  : hue === 1
                    ? "rgba(151,230,203,0.55)"
                    : "rgba(255,218,138,0.55)";
              ctx.beginPath();
              ctx.ellipse(px, py, 4, 6, Math.sin(i + frameCount * 0.01) * 0.5, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (currentTheme === "tjtheme") {
            const sky = ctx.createLinearGradient(0, 0, 0, 400);
            sky.addColorStop(0, "#d9c1ef");
            sky.addColorStop(0.55, "#bf94e4");
            sky.addColorStop(1, "#8f5ab9");
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, 800, 400);

            for (let i = 0; i < 14; i++) {
              const sx = ((i * 147 + frameCount * (0.35 + (i % 4) * 0.12)) % 980) - 110;
              const sy = 30 + i * 18 + Math.sin(frameCount * 0.03 + i) * 16;
              ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,220,140,0.09)";
              ctx.beginPath();
              ctx.arc(sx, sy, 16 + (i % 4) * 7, 0, Math.PI * 2);
              ctx.fill();
            }

            const cityScroll = (camX * 0.12) % 220;
            for (let i = 0; i < 12; i++) {
              const bx = i * 78 - cityScroll - 40;
              const bh = 70 + (i % 5) * 28 + (i % 3) * 12;
              const by = 400 - bh;
              ctx.fillStyle = i % 2 === 0 ? "#34254f" : "#493062";
              ctx.fillRect(bx, by, 56, bh);
              ctx.fillStyle = "rgba(255,255,255,0.18)";
              for (let w = 0; w < 4; w++) {
                for (let h = 0; h < 6; h++) {
                  if ((w + h + i + frameCount) % 3 === 0) {
                    ctx.fillRect(bx + 8 + w * 10, by + 8 + h * 14, 4, 6);
                  }
                }
              }
            }

            for (let i = 0; i < 16; i++) {
              const dx = ((i * 97 + frameCount * 1.6) % 920) - 60;
              const dy = 180 + Math.sin(frameCount * 0.05 + i) * 16 + (i % 4) * 6;
              ctx.fillStyle = i % 2 === 0 ? "rgba(255,220,120,0.28)" : "rgba(255,140,140,0.28)";
              ctx.fillRect(dx, dy, 14 + (i % 3) * 5, 6 + (i % 2) * 3);
            }

            for (let i = 0; i < 6; i++) {
              const puffX = ((i * 185 + frameCount * (0.28 + i * 0.03)) % 950) - 70;
              const puffY = 64 + Math.sin(frameCount * 0.025 + i) * 22 + i * 4;
              ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,230,170,0.07)";
              ctx.beginPath();
              ctx.arc(puffX, puffY, 24 + i * 3, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (currentTheme === "aprilfools") {
            const pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.055);
            let g = ctx.createLinearGradient(0, 0, 800, 400);
            g.addColorStop(0, "#fff1f8");
            g.addColorStop(0.3, "#e6fbff");
            g.addColorStop(0.6, "#f9ecff");
            g.addColorStop(1, "#fff6d8");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 800, 400);

            // Fast moving pastel stripes with phase offsets for chaotic motion.
            for (let i = 0; i < 17; i++) {
              const y =
                ((i * 31 + frameCount * (1.8 + (i % 4) * 0.4)) % 470) - 35 +
                Math.sin(frameCount * 0.09 + i * 1.9) * 12;
              const h = 10 + (i % 3) * 6;
              ctx.fillStyle =
                i % 3 === 0
                  ? `rgba(255,167,226,${0.15 + pulse * 0.2})`
                  : i % 3 === 1
                    ? `rgba(174,241,255,${0.15 + (1 - pulse) * 0.2})`
                    : `rgba(255,237,156,${0.16 + pulse * 0.17})`;
              ctx.fillRect(0, y, 800, h);
            }

            // Rotating checker confetti chunks.
            for (let i = 0; i < 46; i++) {
              const speed = 0.9 + (i % 6) * 0.17;
              const x = ((i * 83 + frameCount * speed) % 1000) - 100;
              const y =
                12 + ((i * 41 + frameCount * (0.38 + (i % 5) * 0.11)) % 368);
              const size = 4 + (i % 5) * 3;
              const rot = frameCount * (0.04 + (i % 4) * 0.015) + i * 0.7;
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(rot);
              ctx.fillStyle =
                i % 4 === 0
                  ? "rgba(255,147,213,0.62)"
                  : i % 4 === 1
                    ? "rgba(149,233,255,0.62)"
                    : i % 4 === 2
                      ? "rgba(255,228,129,0.62)"
                      : "rgba(207,184,255,0.62)";
              ctx.fillRect(-size * 0.5, -size * 0.5, size, size);
              ctx.fillStyle = "rgba(255,255,255,0.35)";
              ctx.fillRect(-size * 0.2, -size * 0.2, size * 0.4, size * 0.4);
              ctx.restore();
            }

            // Sine-wave scanlines with horizontal drift.
            for (let y = 0; y < 400; y += 6) {
              const drift = Math.sin(frameCount * 0.12 + y * 0.08) * 18;
              const alpha = 0.03 + (Math.sin(frameCount * 0.2 + y * 0.11) + 1) * 0.03;
              ctx.fillStyle = `rgba(255,255,255,${alpha})`;
              ctx.fillRect(drift, y, 820, 2);
            }

            // Big drifting pastel blobs for extra visual chaos depth.
            for (let i = 0; i < 20; i++) {
              const bx = ((i * 157 - camX * 0.22 + frameCount * (0.7 + (i % 3) * 0.24)) % 1080) - 140;
              const by =
                24 + i * 17 + Math.sin(frameCount * (0.04 + (i % 4) * 0.008) + i) * 22;
              const r = 12 + (i % 5) * 8;
              ctx.fillStyle =
                i % 2 === 0
                  ? `rgba(255,196,232,${0.16 + pulse * 0.12})`
                  : `rgba(188,242,255,${0.16 + (1 - pulse) * 0.12})`;
              ctx.beginPath();
              ctx.arc(bx, by, r, 0, Math.PI * 2);
              ctx.fill();
            }

            // Brief flicker bars to make the scene feel intentionally unstable.
            for (let i = 0; i < 8; i++) {
              const jitterY = (i * 53 + frameCount * 4.2) % 420;
              const jitterW = 180 + (i % 3) * 120;
              const jitterX = ((i * 149 + frameCount * (2.4 + i * 0.08)) % 980) - 120;
              ctx.fillStyle =
                i % 2 === 0
                  ? "rgba(255,150,220,0.13)"
                  : "rgba(150,240,255,0.13)";
              ctx.fillRect(jitterX, jitterY, jitterW, 3);
            }
          } else if (currentTheme === "pirate") {
            // Sky gradient (day sky)
            let g = ctx.createLinearGradient(0, 0, 0, 250);
            g.addColorStop(0, "#4a7a9a");
            g.addColorStop(1, "#8ab4d5");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 800, 250);
            
            // Water gradient
            let wg = ctx.createLinearGradient(0, 250, 0, 400);
            wg.addColorStop(0, "#1a4f7a");
            wg.addColorStop(1, "#0a2a4a");
            ctx.fillStyle = wg;
            ctx.fillRect(0, 250, 800, 150);
            
            // Water waves effect - more rough and dramatic with shading
            for (let w = 0; w < 5; w++) {
              let waveY = 250 + w * 25 + Math.sin((frameCount + w * 20) / 15) * 12;
              
              // Draw wave fill with shading
              ctx.fillStyle = "rgba(20,60,120,0.15)";
              ctx.beginPath();
              for (let x = 0; x <= 800; x += 30) {
                let y = waveY + Math.sin((x + frameCount * 1.5) / 25 + w) * 6;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.lineTo(800, 400);
              ctx.lineTo(0, 400);
              ctx.closePath();
              ctx.fill();
              
              // Draw wave outline
              ctx.strokeStyle = "rgba(100,150,200,0.5)";
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              for (let x = 0; x <= 800; x += 30) {
                let y = waveY + Math.sin((x + frameCount * 1.5) / 25 + w) * 6;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.stroke();
              
              // Draw shadow under wave crest for depth
              ctx.strokeStyle = "rgba(0,30,80,0.3)";
              ctx.lineWidth = 3;
              ctx.beginPath();
              for (let x = 0; x <= 800; x += 30) {
                let y = waveY + Math.sin((x + frameCount * 1.5) / 25 + w) * 6 + 8;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.stroke();
            }
            
            // Draw pirate ship in background with bobbing animation.
            // Render two copies offset by 800px so the ship tiles seamlessly as the parallax scrolls.
            let shipXBase = ((300 - camX * 0.2) % 800 + 800) % 800;
            let bobbing = Math.sin(frameCount / 25) * 12 + Math.sin(frameCount / 18) * 8; // More dramatic bobbing
            let shipY = 230 + bobbing; // Sits lower in the water

            for (const shipOffset of [0, -800]) {
            let shipX = shipXBase + shipOffset;
            // Ship shadow underwater
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            ctx.beginPath();
            ctx.ellipse(shipX, shipY + 65, 100, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Ship hull (larger)
            ctx.fillStyle = "#5a3a2a";
            ctx.beginPath();
            ctx.moveTo(shipX - 100, shipY);
            ctx.lineTo(shipX + 100, shipY);
            ctx.lineTo(shipX + 90, shipY + 50);
            ctx.lineTo(shipX - 90, shipY + 50);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#3a2a1a";
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Hull planks detail
            ctx.strokeStyle = "rgba(60,40,20,0.4)";
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
              ctx.beginPath();
              ctx.moveTo(shipX - 85, shipY + 12 + i * 10);
              ctx.lineTo(shipX + 85, shipY + 12 + i * 10);
              ctx.stroke();
            }
            
            // Portholes in hull
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            for (let ph = 0; ph < 3; ph++) {
              ctx.beginPath();
              ctx.arc(shipX - 50 + ph * 50, shipY + 25, 6, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Ship deck
            ctx.fillStyle = "#8a6a5a";
            ctx.fillRect(shipX - 95, shipY - 8, 190, 10);
            
            // Deck planks
            ctx.strokeStyle = "rgba(60,40,20,0.3)";
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
              ctx.beginPath();
              ctx.moveTo(shipX - 90 + i * 25, shipY - 6);
              ctx.lineTo(shipX - 90 + i * 25, shipY + 2);
              ctx.stroke();
            }
            
            // Barrels on deck
            ctx.fillStyle = "#7a5a4a";
            ctx.beginPath();
            ctx.ellipse(shipX - 60, shipY - 15, 10, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(shipX + 60, shipY - 15, 10, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#4a3a2a";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(shipX - 60, shipY - 15, 10, 8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(shipX + 60, shipY - 15, 10, 8, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            // Ship cabin/castle (main structure)
            ctx.fillStyle = "#6a4a3a";
            ctx.fillRect(shipX - 50, shipY - 45, 100, 40);
            ctx.strokeStyle = "#3a2a1a";
            ctx.lineWidth = 2;
            ctx.strokeRect(shipX - 50, shipY - 45, 100, 40);
            
            // Cabin roof/peaked
            ctx.fillStyle = "#7a5a4a";
            ctx.beginPath();
            ctx.moveTo(shipX - 50, shipY - 45);
            ctx.lineTo(shipX, shipY - 60);
            ctx.lineTo(shipX + 50, shipY - 45);
            ctx.closePath();
            ctx.fill();
            
            // Windows on cabin
            ctx.fillStyle = "#ffd700";
            ctx.fillRect(shipX - 35, shipY - 35, 12, 12);
            ctx.fillRect(shipX + 10, shipY - 35, 12, 12);
            ctx.fillRect(shipX - 10, shipY - 20, 12, 12);
            
            // Window panes
            ctx.strokeStyle = "#aa8800";
            ctx.lineWidth = 1;
            for (let win of [[-35, -35], [10, -35], [-10, -20]]) {
              ctx.beginPath();
              ctx.moveTo(shipX + win[0] + 6, shipY + win[1]);
              ctx.lineTo(shipX + win[0] + 6, shipY + win[1] + 12);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(shipX + win[0], shipY + win[1] + 6);
              ctx.lineTo(shipX + win[0] + 12, shipY + win[1] + 6);
              ctx.stroke();
            }
            
            // Front mast (taller)
            ctx.strokeStyle = "#4a3a2a";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(shipX - 30, shipY - 8);
            ctx.lineTo(shipX - 30, shipY - 110);
            ctx.stroke();
            
            // Back mast (rear mast)
            ctx.strokeStyle = "#4a3a2a";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(shipX + 20, shipY - 8);
            ctx.lineTo(shipX + 20, shipY - 70);
            ctx.stroke();
            
            // Rigging lines
            ctx.strokeStyle = "rgba(100,80,60,0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(shipX - 30, shipY - 110);
            ctx.lineTo(shipX - 80, shipY + 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(shipX - 30, shipY - 110);
            ctx.lineTo(shipX + 80, shipY + 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(shipX + 20, shipY - 70);
            ctx.lineTo(shipX - 80, shipY + 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(shipX + 20, shipY - 70);
            ctx.lineTo(shipX + 80, shipY + 5);
            ctx.stroke();
            
            // Animated sails (billowing effect)
            let sway = Math.sin(frameCount / 40) * 15;
            ctx.fillStyle = "rgba(200,150,100,0.7)";
            
            // Front sail
            ctx.beginPath();
            ctx.moveTo(shipX - 30, shipY - 100);
            ctx.lineTo(shipX - 30 - 80 - sway, shipY + 30);
            ctx.lineTo(shipX - 30 - 60 - sway, shipY - 90);
            ctx.closePath();
            ctx.fill();
            
            // Back sail
            ctx.beginPath();
            ctx.moveTo(shipX + 20, shipY - 60);
            ctx.lineTo(shipX + 20 - 50 - sway * 0.7, shipY + 20);
            ctx.lineTo(shipX + 20 - 35 - sway * 0.7, shipY - 50);
            ctx.closePath();
            ctx.fill();
            
            // Pirate flag (animated fluttering)
            let flagWave = Math.sin(frameCount / 20) * 3;
            ctx.fillStyle = "#2a1a0a";
            ctx.beginPath();
            ctx.moveTo(shipX - 30, shipY - 105);
            ctx.lineTo(shipX - 30 + 50 + flagWave, shipY - 90);
            ctx.lineTo(shipX - 30 + 50 + flagWave, shipY - 75);
            ctx.lineTo(shipX - 30, shipY - 90);
            ctx.closePath();
            ctx.fill();
            
            // Skull and crossbones on flag
            ctx.fillStyle = "#ffd700";
            // Skull
            ctx.beginPath();
            ctx.arc(shipX - 10, shipY - 90, 6, 0, Math.PI * 2);
            ctx.fill();
            // Eye sockets
            ctx.fillStyle = "#2a1a0a";
            ctx.beginPath();
            ctx.arc(shipX - 13, shipY - 92, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(shipX - 7, shipY - 92, 2, 0, Math.PI * 2);
            ctx.fill();
            // Crossbones on flag
            ctx.fillStyle = "#ffd700";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(shipX - 15, shipY - 88);
            ctx.lineTo(shipX - 5, shipY - 88);
            ctx.stroke();
            } // end ship offset loop
          } else if (currentTheme === "jungle") {
            let g = ctx.createLinearGradient(0, 0, 0, 400);
            g.addColorStop(0, "#0f3f20");
            g.addColorStop(0.5, "#1f5e30");
            g.addColorStop(1, "#163b1b");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 800, 400);

            // Far canopy silhouettes.
            for (let i = 0; i < 8; i++) {
              const cx = ((i * 110 - camX * 0.08 + frameCount * 0.2) % 900) - 80;
              const scale = 0.6 + (i % 3) * 0.13;
              ctx.fillStyle = "rgba(20,55,25,0.7)";
              ctx.beginPath();
              ctx.moveTo(cx, 300);
              ctx.bezierCurveTo(
                cx + 50 * scale,
                240 * scale,
                cx + 90 * scale,
                260 * scale,
                cx + 130 * scale,
                220 * scale,
              );
              ctx.bezierCurveTo(
                cx + 180 * scale,
                260 * scale,
                cx + 220 * scale,
                240 * scale,
                cx + 270 * scale,
                300,
              );
              ctx.closePath();
              ctx.fill();
            }

            // Mid-layer vines.
            ctx.strokeStyle = "rgba(98,160,80,0.64)";
            ctx.lineWidth = 3;
            for (let i = 0; i < 5; i++) {
              const vx = (i * 150 + frameCount * 0.18) % 870;
              ctx.beginPath();
              ctx.moveTo(vx, 0);
              ctx.quadraticCurveTo(
                vx - 6,
                150 + Math.sin(frameCount * 0.015 + i) * 12,
                vx + 2,
                340,
              );
              ctx.stroke();
              for (let li = 0; li < 3; li++) {
                const ly = 30 + li * 60 + Math.sin(frameCount * 0.02 + i + li) * 8;
                const lx = vx + (li % 2 === 0 ? -8 : 8);
                ctx.fillStyle = "rgba(160,220,130,0.82)";
                ctx.beginPath();
                ctx.ellipse(lx, ly, 3, 5, li * 0.3, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // Far tree trunks and crowns.
            for (let i = 0; i < 14; i++) {
              const tx = ((i * 70 - camX * 0.1 + frameCount * 0.06) % 900) - 60;
              const verticalOffset = (i % 4) * 12;
              const treeHeight =
                120 + ((i * 7) % 60) + Math.sin(frameCount * 0.013 + i) * 10 + verticalOffset;
              const treeWidth = 8 + (i % 4) * 3;
              const trunkY = 220 - verticalOffset;
              ctx.fillStyle = "rgba(18,40,20,0.86)";
              ctx.fillRect(tx, trunkY, treeWidth, treeHeight);

              const leafColors = ["rgba(32,98,30,0.94)", "rgba(58,120,44,0.88)"];
              for (let j = 0; j < 3; j++) {
                ctx.fillStyle = leafColors[j % leafColors.length];
                const yBase = trunkY - j * 20 + 16;
                const width = 34 + (j % 2) * 8;
                const height = 16 + (j % 2) * 4;
                ctx.beginPath();
                ctx.ellipse(
                  tx + treeWidth / 2,
                  yBase,
                  width,
                  height,
                  Math.sin(frameCount * 0.01 + j) * 0.1,
                  0,
                  Math.PI * 2,
                );
                ctx.fill();
              }
            }

            // Fireflies.
            for (let i = 0; i < 20; i++) {
              const fx = ((i * 43 + frameCount * 1.2) % 860) - 30;
              const fy = 80 + ((i * 37) % 220) + Math.sin(frameCount * 0.02 + i) * 12;
              const glow = 0.35 + 0.25 * Math.sin(frameCount * 0.08 + i);
              const r = 1 + 0.9 * (0.5 + Math.sin(frameCount * 0.03 + i) * 0.45);
              ctx.fillStyle = `rgba(255,255,190,${glow})`;
              ctx.beginPath();
              ctx.arc(fx, fy, r, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            ctx.fillStyle = t.bg;
            ctx.fillRect(0, 0, 800, 400);
          }
          if (
            t.stars ||
            currentTheme === "moony" ||
            currentTheme === "stardust" ||
            currentTheme === "deepsea" ||
            currentTheme === "cyber" ||
            currentTheme === "glitchworld" ||
            currentTheme === "aprilfools"
          ) {
            stars.forEach((s) => {
              if (currentTheme === "deepsea") {
                s.x -= 0.8;
                if (s.x < -10) s.x = canvas.width + 10;
                ctx.fillStyle = "rgba(255,255,255,0.2)";
                ctx.fillRect(s.x, s.y, 4, 2);
                ctx.fillRect(s.x - 2, s.y - 1, 2, 4);
              } else if (currentTheme === "aprilfools") {
                const twinkle = 0.2 + (Math.sin(frameCount * 0.11 + s.x * 0.05 + s.y * 0.07) + 1) * 0.22;
                ctx.fillStyle =
                  s.s % 3 === 0
                    ? `rgba(255,165,222,${twinkle})`
                    : s.s % 3 === 1
                      ? `rgba(172,243,255,${twinkle})`
                      : `rgba(255,238,163,${twinkle})`;
                ctx.fillRect(s.x, s.y, s.s + 1, s.s + 1);
              } else {
                ctx.fillStyle =
                  currentTheme === "moony" ||
                  currentTheme === "stardust" ||
                  currentTheme === "cyber" ||
                  currentTheme === "glitchworld"
                    ? "#FFF"
                    : "rgba(255,255,255,0.2)";
                ctx.fillRect(s.x, s.y, s.s, s.s);
              }
            });
          }
          if (currentTheme === "stardust") {
            fallingStars.forEach((fs, i) => {
              fs.x -= fs.s * 0.4;
              fs.y += fs.s * 0.4;
              if (fs.x < -100 || fs.y > 500) {
                fs.x = 400 + Math.random() * 800;
                fs.y = Math.random() * -400;
              }
              let g = ctx.createLinearGradient(
                fs.x,
                fs.y,
                fs.x + fs.l,
                fs.y - fs.l,
              );
              g.addColorStop(0, "rgba(255,255,255,0.8)");
              g.addColorStop(1, "transparent");
              ctx.strokeStyle = g;
              ctx.lineWidth = fs.w;
              ctx.beginPath();
              ctx.moveTo(fs.x, fs.y);
              ctx.lineTo(fs.x + fs.l, fs.y - fs.l);
              ctx.stroke();
              ctx.fillStyle = "white";
              ctx.beginPath();
              ctx.arc(fs.x, fs.y, fs.w + 1, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 10;
              ctx.shadowColor = "white";
              ctx.fill();
              ctx.shadowBlur = 0;
            });
          }
          if (currentTheme === "moony") {
            moonTreeTops.forEach((tree, i) => {
              let tx = (tree.x - camX * tree.parallax) % 2600;
              if (tx < -220) tx += 2600;
              const sway =
                Math.sin(frameCount / 95 + tree.sway + i * 0.12) * tree.swayAmp;
              const topY = tree.baseY - tree.h;

              ctx.save();
              ctx.translate(tx + sway, 0);
              ctx.fillStyle = tree.tone;

              // Tall conifer silhouette made from stacked triangular layers.
              for (let layer = 0; layer < 4; layer++) {
                const p = layer / 3;
                const yTop = topY + p * tree.h * 0.62;
                const yBottom = yTop + tree.h * (0.35 - layer * 0.03);
                const halfW = tree.w * (0.32 + p * 0.72);
                ctx.beginPath();
                ctx.moveTo(0, yTop);
                ctx.lineTo(halfW, yBottom);
                ctx.lineTo(-halfW, yBottom);
                ctx.closePath();
                ctx.fill();
              }
              ctx.restore();
            });

            let mist = ctx.createLinearGradient(0, 300, 0, 400);
            mist.addColorStop(0, "rgba(32,42,72,0)");
            mist.addColorStop(1, "rgba(4,8,18,0.48)");
            ctx.fillStyle = mist;
            ctx.fillRect(0, 300, 800, 100);
          }
          if (currentTheme === "toybox") {
            fallingToys.forEach((toy, i) => {
              toy.y += toy.vy;
              toy.x += toy.drift + Math.sin((frameCount + i * 7) / 28) * 0.25;
              toy.rot += toy.rotSpeed;

              if (toy.y > 440) {
                toy.y = -30 - Math.random() * 220;
                toy.x = Math.random() * 860 - 30;
                toy.size = 10 + Math.random() * 18;
                toy.vy = 0.45 + Math.random() * 1.2;
                toy.drift = (Math.random() - 0.5) * 0.6;
                toy.rotSpeed = (Math.random() - 0.5) * 0.035;
                toy.shape = ["block", "duck", "ball", "spinner"][
                  Math.floor(Math.random() * 4)
                ];
                toy.color = [
                  "#f44336",
                  "#2196f3",
                  "#4caf50",
                  "#ff9800",
                  "#9c27b0",
                ][Math.floor(Math.random() * 5)];
              }

              ctx.save();
              ctx.translate(toy.x, toy.y);
              ctx.rotate(toy.rot);
              ctx.globalAlpha = 0.45;
              if (toy.shape === "block") {
                ctx.fillStyle = toy.color;
                ctx.fillRect(-toy.size / 2, -toy.size / 2, toy.size, toy.size);
                ctx.fillStyle = "rgba(255,255,255,0.4)";
                ctx.fillRect(
                  -toy.size * 0.32,
                  -toy.size * 0.32,
                  toy.size * 0.64,
                  toy.size * 0.64,
                );
              } else if (toy.shape === "duck") {
                ctx.fillStyle = toy.color;
                ctx.beginPath();
                ctx.arc(0, 0, toy.size * 0.32, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(toy.size * 0.24, -toy.size * 0.2, toy.size * 0.18, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffcc66";
                ctx.fillRect(toy.size * 0.34, -toy.size * 0.2, toy.size * 0.16, toy.size * 0.1);
              } else if (toy.shape === "ball") {
                ctx.fillStyle = toy.color;
                ctx.beginPath();
                ctx.arc(0, 0, toy.size * 0.34, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "rgba(255,255,255,0.65)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, toy.size * 0.18, 0, Math.PI * 2);
                ctx.stroke();
              } else {
                ctx.strokeStyle = toy.color;
                ctx.lineWidth = Math.max(2, toy.size * 0.14);
                ctx.beginPath();
                ctx.moveTo(-toy.size * 0.4, 0);
                ctx.lineTo(toy.size * 0.4, 0);
                ctx.moveTo(0, -toy.size * 0.4);
                ctx.lineTo(0, toy.size * 0.4);
                ctx.stroke();
                ctx.fillStyle = "rgba(255,255,255,0.75)";
                ctx.beginPath();
                ctx.arc(0, 0, toy.size * 0.12, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            });
          }
          if (currentTheme === "cyber") {
            ctx.fillStyle = "#ffffaa";
            ctx.beginPath();
            ctx.arc(200, 60, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#ffffaa";
            ctx.fill();
            ctx.shadowBlur = 0;
            cyberBldgs.forEach((b, i) => {
              let bx = (b.x - camX * b.s) % 1200;
              if (bx < -b.w) bx += 1200;
              ctx.fillStyle = "#0f0f1c";
              ctx.fillRect(bx, 400 - b.h, b.w, b.h);
              ctx.fillStyle = b.neon;
              ctx.fillRect(bx + b.w / 2 - 10, 400 - b.h + 20, 20, 30);
              ctx.fillStyle =
                (Math.floor(frameCount / 30) + i) % 2 === 0
                  ? b.neon + "66"
                  : b.neon + "22";
              for (let wx = 0; wx < b.w - 10; wx += 20) {
                for (let wy = 60; wy < b.h - 20; wy += 40) {
                  ctx.fillRect(bx + 5 + wx, 400 - b.h + wy, 10, 15);
                }
              }
            });
            hoverCars.forEach((c) => {
              c.x -= c.s;
              if (c.x < -20) c.x = 820;
              ctx.fillStyle = c.c;
              ctx.fillRect(c.x, c.y, c.w, 4);
              ctx.shadowBlur = 10;
              ctx.shadowColor = c.c;
              ctx.fillRect(c.x, c.y, c.w, 4);
              ctx.shadowBlur = 0;
            });
            for (let i = 0; i < 10; i++) {
              let px = i * 100 - ((camX * 0.4) % 100);
              ctx.fillStyle = "#0f0f1c";
              ctx.fillRect(px, 350, 15, 50);
              ctx.fillStyle = "#f0f";
              ctx.fillRect(px + 2, 350, 11, 2);
            }
          }
          if (currentTheme === "magma") {
            let vxBase = 500 - camX * 0.1;
            volcanoes.forEach((v) => {
              let vx = (v.x + vxBase) % 1600;
              if (vx < -400) vx += 1600;
              if (v.type === 0) {
                ctx.fillStyle = "#2d1414";
                ctx.beginPath();
                ctx.moveTo(vx - 400, 400);
                ctx.lineTo(vx - 150, 220);
                ctx.lineTo(vx + 100, 400);
                ctx.fill();
              } else {
                ctx.fillStyle = "#1a0808";
                ctx.beginPath();
                ctx.moveTo(vx - 250, 400);
                ctx.lineTo(vx - 30, 140);
                ctx.lineTo(vx + 30, 140);
                ctx.lineTo(vx + 250, 400);
                ctx.fill();
                ctx.strokeStyle = "#ff4500";
                ctx.lineWidth = 5;
                [-12, 5, 18].forEach((off, i) => {
                  let flowY = 140 + Math.sin(frameCount / 25 + i) * 20;
                  ctx.beginPath();
                  ctx.moveTo(vx + off, 140);
                  ctx.bezierCurveTo(
                    vx + off * 2,
                    200,
                    vx + off * 3,
                    300,
                    vx + off * 4,
                    400,
                  );
                  ctx.stroke();
                });
                ctx.fillStyle = "#555";
                for (let i = 0; i < 4; i++) {
                  let ashX =
                    (vx + Math.sin(frameCount / 40 + i + v.x) * 50) % 800;
                  if (ashX < 0) ashX += 800;
                  let ashY = 120 - ((frameCount + i * 60) % 200);
                  ctx.beginPath();
                  ctx.arc(ashX, ashY, 15 + i * 5, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            });
            ctx.fillStyle = "#ff4500";
            ctx.globalAlpha = 0.6 + Math.sin(frameCount / 15) * 0.2;
            ctx.fillRect(0, 370, 800, 30);
            ctx.globalAlpha = 1;
          }
          if (speedRunMode && !speedRunGameOverMode) {
            const wallScreenX = speedRunGlitchWallX - camX;
            if (wallScreenX < canvas.width + 24 && wallScreenX + speedRunGlitchWallW > -24) {
              const band = ctx.createLinearGradient(
                wallScreenX,
                0,
                wallScreenX + speedRunGlitchWallW,
                0,
              );
              band.addColorStop(0, "rgba(255, 0, 200, 0.65)");
              band.addColorStop(0.5, "rgba(80, 255, 245, 0.7)");
              band.addColorStop(1, "rgba(255, 0, 140, 0.6)");
              ctx.fillStyle = band;
              ctx.fillRect(wallScreenX, 0, speedRunGlitchWallW, canvas.height);
              for (let y = 0; y < canvas.height; y += 12) {
                ctx.fillStyle = y % 24 === 0 ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.15)";
                ctx.fillRect(wallScreenX - 2, y + ((frameCount + y) % 5), speedRunGlitchWallW + 4, 2);
              }
            }
          }
          if (t.glitch) ctx.globalAlpha = 0.8;
          const glitchFrontX =
            speedRunMode && !speedRunGameOverMode
              ? speedRunGlitchWallX + speedRunGlitchWallW
              : -Infinity;

          function getWallGlitchAmount(worldX, worldW = 0) {
            if (!speedRunMode || speedRunGameOverMode) return 0;
            const center = worldX + worldW * 0.5;
            if (center >= glitchFrontX) return 0;
            return Math.min(1, (glitchFrontX - center) / 280);
          }

          function drawWallGlitchOverlay(x, y, w, h, amount) {
            if (amount <= 0) return;
            const layers = 1 + Math.floor(amount * 3);
            for (let i = 0; i < layers; i++) {
              const rowY = y + ((frameCount * (2 + i) + i * 17) % Math.max(1, h));
              const bandH = 1 + ((frameCount + i) % 3);
              const shift = (Math.sin(frameCount * 0.2 + i * 1.7) * 6) * amount;
              ctx.fillStyle =
                i % 2 === 0
                  ? `rgba(255,40,190,${0.2 + amount * 0.3})`
                  : `rgba(90,255,245,${0.18 + amount * 0.25})`;
              ctx.fillRect(x + shift, rowY, w, bandH);
            }
            ctx.strokeStyle = `rgba(255,255,255,${0.08 + amount * 0.2})`;
            ctx.strokeRect(x, y, w, h);
          }

          function getObjectGlitchOffset(amount, seed) {
            if (amount <= 0) return { x: 0, y: 0 };
            const baseShake = 1 + amount * 3.5;
            const time = frameCount + seed * 11.37;
            let x = Math.round(Math.sin(time * 0.67) * baseShake);
            let y = Math.round(Math.cos(time * 0.53) * baseShake * 0.65);

            // Occasional pop to sell a teleport-like glitch without displacing objects too far.
            const popTick = Math.floor((frameCount + seed * 17) * 0.08);
            if (popTick % 9 === 0) {
              x += Math.round((Math.sin(seed * 29 + frameCount) * (5 + amount * 8)));
              y += Math.round((Math.cos(seed * 41 + frameCount * 0.9) * (3 + amount * 6)));
            }
            return { x, y };
          }

          const wellFx = getWellFx(currentTheme);
          wells.forEach((w) => {
            const wellGlitch = getWallGlitchAmount(w.x - w.r, w.r * 2);
            const wellOffset = getObjectGlitchOffset(
              wellGlitch,
              (w.x + w.y + w.r) * 0.01,
            );
            ctx.save();
            ctx.translate(wellOffset.x, wellOffset.y);
            ctx.beginPath();
            ctx.arc(w.x - camX, w.y, w.r, 0, Math.PI * 2);
            let g = ctx.createRadialGradient(
              w.x - camX,
              w.y,
              0,
              w.x - camX,
              w.y,
              w.r,
            );
            if (w.core > 0) {
              g.addColorStop(0, wellFx.coreInner);
              g.addColorStop(0.3, wellFx.coreMid);
            } else {
              g.addColorStop(0, wellFx.normalInner);
              g.addColorStop(0.3, wellFx.normalMid);
            }
            g.addColorStop(1, "transparent");
            ctx.fillStyle = g;
            ctx.fill();
            if (w.core > 0) {
              ctx.beginPath();
              ctx.arc(
                w.x - camX,
                w.y,
                w.core + Math.sin(frameCount / 5) * 2,
                0,
                Math.PI * 2,
              );
              ctx.fillStyle = wellFx.coreFill || "#000";
              ctx.fill();
              ctx.strokeStyle = wellFx.coreStroke;
              ctx.lineWidth = 3;
              ctx.stroke();
            }
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.arc(
                w.x - camX,
                w.y,
                (w.core || 10) + 10 + i * 15,
                frameCount / 20 + i,
                frameCount / 20 + i + 1,
              );
              ctx.strokeStyle =
                w.core > 0 ? wellFx.coreRing : wellFx.normalRing;
              ctx.stroke();
            }
            drawWallGlitchOverlay(
              w.x - camX - w.r,
              w.y - w.r,
              w.r * 2,
              w.r * 2,
              wellGlitch,
            );
            ctx.restore();
          });
          if (shieldItem && !shieldItem.collected) {
            const shieldGlitch = getWallGlitchAmount(shieldItem.x, shieldItem.w);
            const shieldOffset = getObjectGlitchOffset(
              shieldGlitch,
              (shieldItem.x + shieldItem.y) * 0.01,
            );
            ctx.save();
            ctx.translate(shieldOffset.x, shieldOffset.y);
            ctx.strokeStyle = "#0cf";
            ctx.lineWidth = 3;
            ctx.strokeRect(shieldItem.x - camX, shieldItem.y, 20, 20);
            ctx.fillStyle = "rgba(0,200,255,0.5)";
            ctx.fillRect(shieldItem.x - camX + 5, shieldItem.y + 5, 10, 10);
            drawWallGlitchOverlay(
              shieldItem.x - camX,
              shieldItem.y,
              shieldItem.w,
              shieldItem.h,
              shieldGlitch,
            );
            ctx.restore();
          }
          if (player.hasShield && !player.spaghettified) {
            ctx.beginPath();
            ctx.arc(
              150 + player.w / 2,
              player.y + player.h / 2,
              25,
              0,
              Math.PI * 2,
            );
            ctx.strokeStyle =
              "rgba(0,255,255," + (0.5 + Math.sin(frameCount / 10) * 0.2) + ")";
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = "rgba(0,255,255,0.1)";
            ctx.fill();
          }
          // Jump dust particles
          for (let i = jumpDust.length - 1; i >= 0; i--) {
            const p = jumpDust[i];
            ctx.fillStyle = `rgba(168,168,168,${p.alpha})`;
            ctx.fillRect(p.x - camX, p.y, p.size, p.size);
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.alpha = Math.max(0, p.alpha - 0.04);
            p.life--; if (p.life <= 0 || p.alpha <= 0) jumpDust.splice(i, 1);
          }

          // Lava rim particles
          for (let i = lavaParticles.length - 1; i >= 0; i--) {
            const p = lavaParticles[i];
            const fade = Math.max(0, p.life / 35);
            const particleA = p.particleA || [255, 140, 30];
            const particleB = p.particleB || [255, 210, 80];
            const tintMix = typeof p.tintMix === "number" ? p.tintMix : 0.5;
            const style = p.style || "ember";
            const r = Math.floor(
              particleA[0] * (1 - tintMix) + particleB[0] * tintMix,
            );
            const g = Math.floor(
              particleA[1] * (1 - tintMix) + particleB[1] * tintMix,
            );
            const b = Math.floor(
              particleA[2] * (1 - tintMix) + particleB[2] * tintMix,
            );
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${fade})`;
            if (style === "bubble") {
              ctx.beginPath();
              ctx.arc(p.x - camX, p.y, p.size, 0, Math.PI * 2);
              ctx.fill();
            } else if (style === "spark") {
              ctx.fillRect(p.x - camX, p.y, p.size + 1, p.size * 0.8);
              ctx.fillRect(
                p.x - camX + p.size * 0.3,
                p.y - p.size * 0.4,
                p.size * 0.4,
                p.size * 1.4,
              );
            } else {
              ctx.fillRect(p.x - camX, p.y, p.size, p.size);
            }
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.life--;
            if (p.life <= 0) lavaParticles.splice(i, 1);
          }
          const gx = goal.x - camX;
          const gy = goal.y;
          const gw = goal.w;
          const gh = goal.h;
          const goalGlitch = getWallGlitchAmount(goal.x, goal.w);
          const goalOffset = getObjectGlitchOffset(
            goalGlitch,
            (goal.x + goal.y + goal.w) * 0.01,
          );
          const goalTheme =
            currentTheme === "aprilfools"
              ? [
                  "classic",
                  "sunny",
                  "moony",
                  "toybox",
                  "deepsea",
                  "magma",
                  "cyber",
                  "glitchworld",
                  "easter",
                  "stardust",
                  "pirate",
                  "jungle",
                ][Math.floor(frameCount / 8) % 12]
              : currentTheme;
          ctx.save();
          ctx.translate(goalOffset.x, goalOffset.y);
          ctx.save();
          if (goalTheme === "sunny") {
            ctx.fillStyle = "#ffeb3b";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#fff05a";
            ctx.fillRect(gx, gy, gw, gh);
            ctx.strokeStyle = "#f2c200";
            ctx.lineWidth = 3;
            ctx.strokeRect(gx, gy, gw, gh);
          } else if (goalTheme === "moony") {
            ctx.save();
            ctx.translate(gx + gw / 2, gy + gh / 2);
            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(255,255,255,0.8)";
            ctx.fillStyle = "rgba(200,180,255,0.6)";
            ctx.fillRect(-gw / 2, -gh / 2, gw, gh);
            ctx.strokeStyle = "#d0c0ff";
            ctx.lineWidth = 3;
            ctx.strokeRect(-gw / 2, -gh / 2, gw, gh);
            ctx.restore();
          } else if (goalTheme === "toybox") {
            ctx.fillStyle = "#f44336";
            ctx.fillRect(gx, gy, gw, gh);
            ctx.fillStyle = "#fff";
            ctx.fillRect(gx + 4, gy + 4, gw - 8, gh - 8);
            ctx.fillStyle = "#2196f3";
            ctx.fillRect(gx + 8, gy + 8, gw - 16, gh - 16);
          } else if (goalTheme === "deepsea") {
            ctx.fillStyle = "#6b4c2d";
            ctx.fillRect(gx, gy + gh * 0.6, gw, gh * 0.4);
            ctx.fillStyle = "#a77b5f";
            for (let i = 0; i < 4; i++) {
              ctx.fillRect(gx + i * 12, gy + gh * 0.55, 6, gh * 0.45);
            }
            ctx.fillStyle = "#00bcd4";
            ctx.globalAlpha = 0.6;
            ctx.fillRect(gx, gy, gw, gh);
            ctx.globalAlpha = 1;
          } else if (goalTheme === "magma") {
            ctx.save();
            ctx.translate(gx + gw / 2, gy + gh / 2);
            const flame = 0.8 + Math.sin(frameCount / 10) * 0.2;
            ctx.fillStyle = `rgba(${255},${Math.floor(80 + 120*flame)},0,1)`;
            ctx.beginPath();
            ctx.moveTo(0, -gh * 0.4);
            ctx.lineTo(gw * 0.25, gh * 0.4);
            ctx.lineTo(-gw * 0.25, gh * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          } else if (goalTheme === "cyber") {
            ctx.save();
            ctx.translate(gx + gw / 2, gy + gh / 2);
            ctx.rotate(frameCount * 0.07);
            ctx.strokeStyle = "#0ff";
            ctx.lineWidth = 3;
            ctx.fillStyle = "rgba(0,255,255,0.4)";
            ctx.beginPath();
            ctx.moveTo(0, -gh * 0.5);
            ctx.lineTo(gw * 0.5, 0);
            ctx.lineTo(0, gh * 0.5);
            ctx.lineTo(-gw * 0.5, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          } else if (goalTheme === "glitchworld") {
            ctx.save();
            ctx.translate(gx + gw / 2, gy + gh / 2);
            const pulse = 0.7 + Math.sin(frameCount * 0.18) * 0.2;
            ctx.rotate(frameCount * 0.045);
            ctx.fillStyle = `rgba(98,255,240,${0.35 + pulse * 0.2})`;
            ctx.strokeStyle = "#ff2ec3";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -gh * 0.55);
            ctx.lineTo(gw * 0.35, -gh * 0.1);
            ctx.lineTo(gw * 0.55, gh * 0.1);
            ctx.lineTo(0, gh * 0.55);
            ctx.lineTo(-gw * 0.55, gh * 0.1);
            ctx.lineTo(-gw * 0.35, -gh * 0.1);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          } else if (goalTheme === "easter") {
            ctx.save();
            ctx.translate(gx + gw / 2, gy + gh / 2);
            const bob = Math.sin(frameCount * 0.08) * 2;
            ctx.translate(0, bob);
            ctx.fillStyle = "#fff6ce";
            ctx.strokeStyle = "#f2b6d8";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, 0, gw * 0.45, gh * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#9de4c9";
            ctx.fillRect(-6, -3, 4, 4);
            ctx.fillStyle = "#ffd27f";
            ctx.fillRect(2, 1, 4, 4);
            ctx.restore();
          } else if (goalTheme === "tjtheme") {
            const tjGoalImage = getThemeGoalImage("tjtheme");
            if (tjGoalImage && tjGoalImage.complete && tjGoalImage.naturalWidth > 0) {
              ctx.drawImage(tjGoalImage, gx, gy, gw, gh);
            } else {
              ctx.save();
              ctx.translate(gx + gw / 2, gy + gh / 2);
              const wobble = Math.sin(frameCount * 0.09) * 0.06;
              ctx.rotate(wobble);
              ctx.fillStyle = "#4b2a1a";
              ctx.fillRect(-gw * 0.35, -gh * 0.18, gw * 0.7, gh * 0.36);
              ctx.fillRect(-gw * 0.12, -gh * 0.55, gw * 0.24, gh * 0.42);
              ctx.fillRect(-gw * 0.55, -gh * 0.02, gw * 0.22, gh * 0.2);
              ctx.fillRect(gw * 0.33, -gh * 0.04, gw * 0.22, gh * 0.2);
              ctx.fillStyle = "#6f4629";
              ctx.fillRect(-gw * 0.15, -gh * 0.08, gw * 0.3, gh * 0.16);
              ctx.fillStyle = "#8fd16a";
              ctx.beginPath();
              ctx.moveTo(-gw * 0.16, -gh * 0.34);
              ctx.lineTo(gw * 0.05, -gh * 0.48);
              ctx.lineTo(gw * 0.18, -gh * 0.24);
              ctx.lineTo(gw * 0.02, -gh * 0.12);
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = "#ffe089";
              ctx.beginPath();
              ctx.arc(gw * 0.42, -gh * 0.28, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          } else if (goalTheme === "stardust") {
            let pulse = 0.7 + 0.3 * Math.sin(frameCount / 15);
            let rad = (gw / 2) * (1 + pulse * 0.15);
            let g = ctx.createRadialGradient(
              gx + gw / 2,
              gy + gh / 2,
              0,
              gx + gw / 2,
              gy + gh / 2,
              rad,
            );
            g.addColorStop(0, "rgba(255,255,255,0.9)");
            g.addColorStop(0.7, "rgba(180,220,255,0.7)");
            g.addColorStop(1, "rgba(80,180,255,0.1)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(gx + gw / 2, gy + gh / 2, rad, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(gx + gw / 2, gy + gh / 2, gw * 0.25, 0, Math.PI * 2);
            ctx.fill();
          } else if (goalTheme === "pirate") {
            ctx.save();
            ctx.translate(gx + gw / 2, gy + gh / 2);

            // Open chest lid.
            ctx.fillStyle = "#7f4f24";
            ctx.strokeStyle = "#3b230f";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-gw * 0.42, -gh * 0.1);
            ctx.lineTo(gw * 0.42, -gh * 0.1);
            ctx.lineTo(gw * 0.32, -gh * 0.55);
            ctx.lineTo(-gw * 0.32, -gh * 0.55);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Gold inside chest.
            ctx.fillStyle = "#ffd24a";
            ctx.fillRect(-gw * 0.32, -gh * 0.05, gw * 0.64, gh * 0.2);
            ctx.fillStyle = "#ffec8a";
            for (let i = 0; i < 5; i++) {
              const cx = -gw * 0.25 + i * (gw * 0.13);
              const cy = -gh * 0.08;
              ctx.beginPath();
              ctx.arc(cx, cy, 3, 0, Math.PI * 2);
              ctx.fill();
            }

            // Chest body.
            ctx.fillStyle = "#9b6535";
            ctx.fillRect(-gw * 0.45, -gh * 0.02, gw * 0.9, gh * 0.62);
            ctx.strokeStyle = "#4a2d15";
            ctx.strokeRect(-gw * 0.45, -gh * 0.02, gw * 0.9, gh * 0.62);

            // Metal straps and lock.
            ctx.fillStyle = "#d8a73b";
            ctx.fillRect(-gw * 0.42, gh * 0.1, gw * 0.84, 3);
            ctx.fillRect(-gw * 0.42, gh * 0.34, gw * 0.84, 3);
            ctx.fillStyle = "#f2c14e";
            ctx.fillRect(-3, gh * 0.18, 6, 8);

            // Soft treasure glow.
            ctx.globalAlpha = 0.35 + Math.sin(frameCount * 0.08) * 0.1;
            ctx.fillStyle = "#ffe17a";
            ctx.beginPath();
            ctx.ellipse(0, -gh * 0.1, gw * 0.45, gh * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else if (goalTheme === "jungle") {
            // Leaf-trophy style goal block for jungle.
            ctx.save();
            ctx.translate(gx + gw / 2, gy + gh / 2);
            ctx.rotate(Math.sin(frameCount * 0.03) * 0.05);
            ctx.fillStyle = "#8abe6c";
            ctx.fillRect(-gw / 2, -gh / 2, gw, gh);
            ctx.fillStyle = "#5d8c40";
            ctx.beginPath();
            ctx.moveTo(-gw / 2, 0);
            ctx.lineTo(0, -gh / 2);
            ctx.lineTo(gw / 2, 0);
            ctx.lineTo(0, gh / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          } else if (goalTheme === "zelda") {
            // Triforce objective marker.
            ctx.save();
            ctx.translate(gx + gw / 2, gy + gh / 2);
            const pulse = 0.85 + Math.sin(frameCount * 0.09) * 0.15;
            const triSize = gw * 0.28;

            ctx.shadowBlur = 18;
            ctx.shadowColor = "rgba(255, 214, 64, 0.95)";
            ctx.fillStyle = "rgba(255, 206, 61, 0.95)";
            ctx.strokeStyle = "#9b6e14";
            ctx.lineWidth = 2;

            drawGoalTriangle(ctx, 0, -gh * 0.12, triSize * pulse);
            drawGoalTriangle(ctx, -triSize, gh * 0.26, triSize * pulse);
            drawGoalTriangle(ctx, triSize, gh * 0.26, triSize * pulse);

            // Small center glint.
            ctx.fillStyle = "rgba(255, 248, 180, 0.85)";
            ctx.beginPath();
            ctx.arc(0, gh * 0.02, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else {
            ctx.fillStyle = "#0f0";
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#0f0";
            ctx.fillRect(gx, gy, gw, gh);
          }
          ctx.restore();
          drawWallGlitchOverlay(gx, gy, gw, gh, goalGlitch);
          ctx.restore();
          winParticles.forEach((p) => {
            ctx.fillStyle = `rgba(0,255,0,${p.l / 40})`;
            ctx.fillRect(p.x - camX, p.y, 5, 5);
          });
          if (t.glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = t.hazards;
          }
          const lavaFx = getLavaFx(currentTheme);
          hazards.forEach((h) => {
            const hazardGlitch = getWallGlitchAmount(h.x, h.w);
            const hazardOffset = getObjectGlitchOffset(
              hazardGlitch,
              (h.x + h.y + h.w) * 0.01,
            );
            ctx.save();
            ctx.translate(hazardOffset.x, hazardOffset.y);
            if (h.type === "lava") {
              if (currentTheme === "pirate") {
                // Water wall effect for pirate theme
                let waterGlow = ctx.createRadialGradient(
                  h.x - camX + h.w / 2,
                  h.y + h.h / 2,
                  0,
                  h.x - camX + h.w / 2,
                  h.y + h.h / 2,
                  Math.max(20, h.h),
                );
                waterGlow.addColorStop(0, "rgba(100, 200, 255, 0.8)");
                waterGlow.addColorStop(0.45, "rgba(150, 220, 255, 0.6)");
                waterGlow.addColorStop(1, "rgba(200, 240, 255, 0.3)");
                ctx.fillStyle = waterGlow;
                ctx.fillRect(h.x - camX - 16, h.y - 16, h.w + 32, h.h + 32);
                
                // Water base
                ctx.fillStyle = "rgba(50, 150, 255, 0.8)";
                ctx.fillRect(h.x - camX, h.y, h.w, h.h);
                
                // Water surface waves
                ctx.strokeStyle = "rgba(100, 200, 255, 0.9)";
                ctx.lineWidth = 2;
                const waveOffset = frameCount * 0.05;
                for (let i = 0; i < 3; i++) {
                  const y = h.y + i * 4 + Math.sin((h.x - camX) * 0.1 + waveOffset + i) * 2;
                  ctx.beginPath();
                  ctx.moveTo(h.x - camX, y);
                  ctx.lineTo(h.x - camX + h.w, y);
                  ctx.stroke();
                }
                
                // Water droplets/reflection effect - use deterministic positions to avoid frame flicker
                ctx.fillStyle = "rgba(150, 220, 255, 0.4)";
                const dropBaseSeed = h.x * 374761 + h.y * 668265263;
                for (let i = 0; i < 5; i++) {
                  const rx = Math.abs(Math.sin(dropBaseSeed + i * 12.9898)) % 1;
                  const ry = Math.abs(Math.sin(dropBaseSeed + i * 78.233)) % 1;
                  const rr = Math.abs(Math.sin(dropBaseSeed + i * 37.719)) % 1;
                  const dropletX = h.x - camX + rx * h.w;
                  const dropletY = h.y + ry * h.h;
                  const radius = 1 + rr * 2;
                  ctx.beginPath();
                  ctx.arc(dropletX, dropletY, radius, 0, Math.PI * 2);
                  ctx.fill();
                }
              } else {
                let glow = ctx.createRadialGradient(
                  h.x - camX + h.w / 2,
                  h.y + h.h / 2,
                  0,
                  h.x - camX + h.w / 2,
                  h.y + h.h / 2,
                  Math.max(20, h.h),
                );
                glow.addColorStop(0, lavaFx.glowInner);
                glow.addColorStop(0.45, lavaFx.glowMid);
                glow.addColorStop(1, lavaFx.glowOuter);
                ctx.fillStyle = glow;
                ctx.fillRect(h.x - camX - 16, h.y - 16, h.w + 32, h.h + 32);
                ctx.fillStyle = lavaFx.fill;
                ctx.fillRect(h.x - camX, h.y, h.w, h.h);
                ctx.strokeStyle = lavaFx.stroke;
                ctx.lineWidth = 2;
                ctx.strokeRect(h.x - camX, h.y, h.w, h.h);
              }
            } else {
              ctx.fillStyle = t.hazards;
              ctx.fillRect(h.x - camX, h.y, h.w, h.h);
            }
            drawWallGlitchOverlay(h.x - camX, h.y, h.w, h.h, hazardGlitch);
            ctx.restore();
          });
          ctx.shadowBlur = 0;
          const isEasterTheme = currentTheme === "easter";
          platforms.forEach((p) => {
            const platformGlitch = getWallGlitchAmount(p.x, p.w);
            const platformOffset = getObjectGlitchOffset(
              platformGlitch,
              (p.x + p.y + p.w) * 0.01,
            );
            ctx.save();
            ctx.translate(platformOffset.x, platformOffset.y);
            let cy = frameCount % 300,
              sol = !p.isPhase || cy < 240;
            ctx.globalAlpha = sol ? 1 : 0.1;
            if (p.isSinking) {
              if (currentTheme === "pirate") {
                ctx.fillStyle = p.isTouched ? "#664" : "#885";
                ctx.fillRect(p.x - camX, p.y, p.w, p.h);
                ctx.strokeStyle = "rgba(100,60,40,0.8)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p.x - camX + 5, p.y + p.h / 2);
                ctx.lineTo(p.x - camX + p.w - 5, p.y + p.h / 2);
                ctx.stroke();
              } else {
                ctx.fillStyle = isEasterTheme
                  ? p.isTouched
                    ? "#f6bcd9"
                    : "#ffd7eb"
                  : p.isTouched
                    ? "#444"
                    : "#888";
                ctx.fillRect(p.x - camX, p.y, p.w, p.h);
                ctx.strokeStyle = isEasterTheme
                  ? "rgba(255,255,255,0.55)"
                  : "rgba(255,255,255,0.3)";
                ctx.beginPath();
                ctx.moveTo(p.x - camX + 10, p.y);
                ctx.lineTo(p.x - camX + 20, p.y + 8);
                ctx.moveTo(p.x - camX + 80, p.y + 2);
                ctx.lineTo(p.x - camX + 70, p.y + 12);
                ctx.stroke();
              }
            } else {
              if (currentTheme === "pirate") {
                const base = p.moveRange > 0 ? "#6d4c3c" : "#7a5a45";
                ctx.fillStyle = base;
                ctx.fillRect(p.x - camX, p.y, p.w, p.h);

                // Add wood grain/splinter details - use deterministic positions based on platform coords
                ctx.strokeStyle = "rgba(80,50,30,0.5)";
                ctx.lineWidth = 1;
                let plankCount = Math.max(3, Math.floor(p.w / 30));
                for (let i = 1; i < plankCount; i++) {
                  const grainSeed = Math.sin(p.x * 12.9898 + i * 78.233) * 43758.5453;
                  const grainOff = (grainSeed - Math.floor(grainSeed) - 0.5) * 3;
                  let px = p.x - camX + (p.w / plankCount) * i + grainOff;
                  ctx.beginPath();
                  ctx.moveTo(px, p.y + 2);
                  ctx.lineTo(px, p.y + p.h - 2);
                  ctx.stroke();
                }

                for (let i = 0; i < 4; i++) {
                  const s1 = Math.abs(Math.sin(p.x * 37.719 + p.y * 12.9898 + i * 100)) % 1;
                  const s2 = Math.abs(Math.sin(p.x * 78.233 + p.y * 37.719 + i * 200)) % 1;
                  const s3 = Math.abs(Math.sin(p.x * 21.533 + p.y * 43.758 + i * 300)) % 1;
                  const s4 = Math.abs(Math.sin(p.x * 65.438 + p.y * 21.533 + i * 400)) % 1;
                  let sx = p.x - camX + s1 * p.w;
                  let sy = p.y + s2 * p.h;
                  let ex = sx + (s3 - 0.5) * 10;
                  let ey = sy + (s4 - 0.5) * 6;
                  ctx.beginPath();
                  ctx.moveTo(sx, sy);
                  ctx.lineTo(ex, ey);
                  ctx.stroke();
                }

                ctx.strokeStyle = "rgba(255,230,180,0.2)";
                for (let i = 0; i < 2; i++) {
                  let sx = p.x - camX + 5 + i * 20;
                  ctx.beginPath();
                  ctx.moveTo(sx, p.y + 4);
                  ctx.lineTo(sx + 4, p.y + p.h - 6);
                  ctx.stroke();
                }
              } else {
                ctx.fillStyle =
                  isEasterTheme
                    ? p.isPhase &&
                      cy >= 120 &&
                      cy < 240 &&
                      Math.floor(frameCount / 10) % 2
                      ? "#ffeaf4"
                      : "#ffd7eb"
                    : p.isPhase &&
                        cy >= 120 &&
                        cy < 240 &&
                        Math.floor(frameCount / 10) % 2
                      ? "#fff"
                      : p.isPhase
                        ? "#08f"
                        : p.moveRange > 0
                          ? "#555"
                          : t.plat;
                ctx.fillRect(p.x - camX, p.y, p.w, p.h);
              }
            }
            if (p.hasSpeedZone) {
              const zoneX = p.x + p.speedZoneX - camX;
              const zoneY = p.y + 1;
              const pulse = 0.55 + Math.sin(frameCount / 8 + p.x * 0.01) * 0.25;
              ctx.fillStyle =
                p.speedZoneType === "boost"
                  ? `rgba(0,255,180,${0.45 + pulse * 0.2})`
                  : `rgba(255,170,40,${0.45 + pulse * 0.2})`;
              ctx.fillRect(zoneX, zoneY, p.speedZoneW, p.h - 2);
              ctx.strokeStyle =
                p.speedZoneType === "boost"
                  ? "rgba(180,255,240,0.8)"
                  : "rgba(255,240,170,0.8)";
              ctx.lineWidth = 1;
              ctx.strokeRect(zoneX, zoneY, p.speedZoneW, p.h - 2);
              ctx.strokeStyle =
                p.speedZoneType === "boost"
                  ? "rgba(20,180,140,0.7)"
                  : "rgba(180,120,30,0.7)";
              for (let zx = 0; zx < p.speedZoneW; zx += 6) {
                ctx.beginPath();
                ctx.moveTo(zoneX + zx, zoneY);
                ctx.lineTo(zoneX + zx - 4, zoneY + p.h - 2);
                ctx.stroke();
              }
            }
            if (p.hasSpike || p.hasSeeker) {
              ctx.fillStyle = t.hazards;
              let sx = p.hasSpike ? p.x + p.spikeX : p.x + p.seekerX;
              let sw = p.hasSpike ? p.spikeW : p.seekerW;
              let sh = p.hasSpike ? p.spikeH : p.seekerH;
              let ss = p.hasSpike ? p.spikeShape : p.seekerShape;
              drawSpike(sx, p.y, sw, sh, ss, camX);
            }
            if (p.hasFakeHazard) {
              const fx = p.x + p.fakeX;
              ctx.save();
              ctx.globalAlpha = 0.35 + Math.sin(frameCount / 12 + p.x * 0.01) * 0.15;
              ctx.fillStyle = currentTheme === "cyber" ? "#0ff" : "#fff";
              ctx.strokeStyle = currentTheme === "cyber" ? "#f0f" : "#88f";
              if (p.fakeType === "ghostSpike") {
                drawSpike(fx, p.y, p.fakeW, p.fakeH, "triangle", camX);
              } else {
                const bx = fx - camX;
                const by = p.y - p.fakeH;
                ctx.fillRect(bx, by, p.fakeW, p.fakeH);
                ctx.strokeRect(bx, by, p.fakeW, p.fakeH);
              }
              ctx.restore();
            }
            drawWallGlitchOverlay(p.x - camX, p.y - 2, p.w, p.h + 4, platformGlitch);
            ctx.restore();
          });
          ctx.globalAlpha = 1;
          if (!player.spaghettified)
            player.trail.forEach((tr, i) => {
              ctx.globalAlpha = i / 15;
              drawPlayer(150 - (player.x - tr.x), tr.y, t.player);
            });
          ctx.globalAlpha = 1;
          drawPlayer(150, player.y, t.player);
          if (flashAlpha > 0) {
            ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.restore();
        }

        // Top-level draw entry - handles retro scaling wrapper
        // Converts main rendering to low-res offscreen buffer when 8-bit mode is enabled.
        function draw() {
          const isRetro = isRetro8bit;
          if (isRetro) {
            retroCtx.setTransform(1, 0, 0, 1, 0, 0);
            retroCtx.imageSmoothingEnabled = false;
            retroCtx.clearRect(0, 0, retroCanvas.width, retroCanvas.height);
            ctx = retroCtx;
            ctx.save();
            ctx.scale(0.2, 0.2);
            drawScene();
            ctx.restore();
            ctx = mainCtx;
            ctx.imageSmoothingEnabled = false;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(
              retroCanvas,
              0,
              0,
              retroCanvas.width,
              retroCanvas.height,
              0,
              0,
              canvas.width,
              canvas.height,
            );
          } else {
            ctx = mainCtx;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawScene();
          }
        }

        // Pause/resume and menu toggling (also handles music pause/resume)
        function toggle() {
          // Speed Running Mode: pause menu disabled during speed runs (no pausing allowed)
          if (!running || speedRunGameOverMode || speedRunMode) return;
          isPaused = !isPaused;
          const m = document.getElementById("bgMusic");
          if (m) {
            if (isPaused) {
              m.pause();
            } else if (themes[currentTheme] && themes[currentTheme].music) {
              m.play().catch(() => {});
            }
          }
          document.getElementById("pauseMenu").style.display = isPaused
            ? "flex"
            : "none";
          document.getElementById("mainPausePage").style.display = "flex";
          document.getElementById("settingsPage").style.display = "none";
          document.getElementById("audioPage").style.display = "none";
          document.getElementById("themePage").style.display = "none";
          document.getElementById("mobileSupportPage").style.display = "none";
          document.getElementById("screenSizePage").style.display = "none";
          document.getElementById("tutorialNotesPage").style.display = "none";
          document.getElementById("cheatsPage").style.display = "none";
          document.getElementById("achievementsPage").style.display = "none";
          document.getElementById("exitTutorialBtn").style.display =
            tutorialMode ? "block" : "none";
        }

        function clearPostTutorialTour() {
          for (const timerId of postTutorialTourTimers) clearTimeout(timerId);
          postTutorialTourTimers = [];
        }

        function queuePostTutorialTourStep(delay, action) {
          const timerId = setTimeout(action, delay);
          postTutorialTourTimers.push(timerId);
        }

        function showPauseTourPage(pageId) {
          const pageIds = [
            "mainPausePage",
            "settingsPage",
            "audioPage",
            "themePage",
            "tutorialNotesPage",
            "cheatsPage",
          ];
          for (const id of pageIds) {
            document.getElementById(id).style.display = id === pageId ? "flex" : "none";
          }
        }

        function runPostTutorialSettingsTour() {
          clearPostTutorialTour();
          showingPostTutorialSettings = true;
          running = false;
          isPaused = true;
          currentLevel = 1;
          lastCheckpoint = 1;
          setLevelDisplay();
          setTopControlsVisible(false);
          document.getElementById("pauseMenu").style.display = "flex";

          const steps = [
            {
              page: "settingsPage",
              text: "Settings tour: this menu leads to Audio, Theme, and Tutorial Notes.",
            },
            {
              page: "audioPage",
              text: "Audio: Master controls all sound, Music controls soundtrack, SFX controls effects.",
            },
            {
              page: "audioPage",
              text: "Mute buttons let you instantly toggle Music and SFX.",
            },
            {
              page: "themePage",
              text: "Theme changes visuals and music. 8-bit filter.",
            },
            {
              page: "cheatsPage",
              text: "Cheats/Debug includes Invincibility and Warp for testing.",
            },
            {
              page: "cheatsPage",
              text: "Using debug tools marks score as CHEATS USED and blocks normal high score progress.",
            },
            {
              page: "tutorialNotesPage",
              text: "Tutorial Notes has the full recap. Reopen it anytime from Settings.",
            },
          ];

          let elapsed = 120;
          const stepDuration = 3500;
          for (const step of steps) {
            queuePostTutorialTourStep(elapsed, () => {
              if (!showingPostTutorialSettings) return;
              showPauseTourPage(step.page);
              tourExplainEl.textContent = step.text;
              tourExplainEl.style.display = "block";
            });
            elapsed += stepDuration;
          }

          queuePostTutorialTourStep(elapsed + 700, () => {
            if (!showingPostTutorialSettings) return;
            tourExplainEl.style.display = "none";
            returnToStartMenu();
          });
        }

        function returnToStartMenu() {
          clearPostTutorialTour();
          tutorialMode = false;
          speedRunMode = false;
          speedRunGameOverMode = false;
          updateHudModeUi();
          showingPostTutorialSettings = false;
          setTutorialUiVisible(false);
          running = false;
          isPaused = false;
          currentLevel = 1;
          lastCheckpoint = 1;
          setLevelDisplay();
          const m = document.getElementById("bgMusic");
          if (m) m.pause();
          cpNotif.textContent = "Checkpoint Reached";
          cpNotif.style.opacity = "0";
          tourExplainEl.textContent = "";
          tourExplainEl.style.display = "none";
          document.getElementById("topControls").style.display = "none";
          document.getElementById("pauseMenu").style.display = "none";
          document.getElementById("modeMenu").style.display = "none";
          document.getElementById("changelogMenu").style.display = "none";
          document.getElementById("speedRunMenu").style.display = "none";
          document.getElementById("speedRunTimer").classList.remove("active");
          document.getElementById("startMenu").style.display = "flex";
        }

        function showSpeedRunMenu() {
          document.getElementById("startMenu").style.display = "none";
          document.getElementById("modeMenu").style.display = "none";
          document.getElementById("speedRunMenu").style.display = "flex";
          updateSpeedRunThemeUi();
          updateSpeedRunBestTimeUi();
        }

        function hideSpeedRunMenu() {
          document.getElementById("speedRunMenu").style.display = "none";
          document.getElementById("modeMenu").style.display = "flex";
        }

        function updateSpeedRunThemeUi() {
          updateThemeButtonsUi();
        }

        function setTopControlsVisible(visible) {
          document.getElementById("topControls").style.display = visible ? "flex" : "none";
        }

        function showPauseMenuPage(pageId) {
          const pageIds = [
            "mainPausePage",
            "settingsPage",
            "audioPage",
            "themePage",
            "mobileSupportPage",
            "screenSizePage",
            "tutorialNotesPage",
            "cheatsPage",
            "achievementsPage",
          ];
          for (const id of pageIds) {
            document.getElementById(id).style.display = id === pageId ? "flex" : "none";
          }
        }

        function openPauseShortcut(pageId) {
          if (!running || speedRunMode || speedRunGameOverMode) return;
          isPaused = true;
          const m = document.getElementById("bgMusic");
          if (m) m.pause();
          document.getElementById("pauseMenu").style.display = "flex";
          showPauseMenuPage(pageId);
          document.getElementById("exitTutorialBtn").style.display =
            tutorialMode ? "block" : "none";
        }

        function ensureAudioContext() {
          try {
            if (!audioCtx)
              audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === "suspended") audioCtx.resume();
          } catch (e) {}
        }

        function startSelectedMode(isTutorial) {
          ensureAudioContext();
          clearPostTutorialTour();
          tutorialMode = isTutorial;
          speedRunMode = false;
          updateHudModeUi();
          showingPostTutorialSettings = false;
          setTutorialUiVisible(tutorialMode);
          currentLevel = 1;
          lastCheckpoint = 1;
          setLevelDisplay();
          document.getElementById("startMenu").style.display = "none";
          document.getElementById("modeMenu").style.display = "none";
          setTopControlsVisible(true);
          document.getElementById("speedRunTimer").classList.remove("active");

          if (tutorialMode) {
            generateTutorialLevel();
          } else {
            generateLevel();
          }
          resetPlayerForRun(330);

          const m = document.getElementById("bgMusic");
          if (m && themes[currentTheme] && themes[currentTheme].music) {
            m.src = themes[currentTheme].music;
            m.volume = musicMuted ? 0 : musicVol * masterVol;
            m.play().catch(() => {});
          }
          running = true;
          if (!loopStarted) {
            loopStarted = true;
            (function loop() {
              update();
              draw();
              requestAnimationFrame(loop);
            })();
          }
        };

        document.getElementById("startBtn").onclick = () => {
          ensureAudioContext();
          document.getElementById("startMenu").style.display = "none";
          document.getElementById("modeMenu").style.display = "flex";
        };
        const code1 = "test";
        const secretThemeCode = "zelda";
        const secretThemeUnlockKey = "void_secret_theme_zelda_unlocked";
        const tjThemeCode = "tj_theme";
        const tjThemeUnlockKey = "void_secret_theme_tjtheme_unlocked";
        let secretThemeUnlocked = localStorage.getItem(secretThemeUnlockKey) === "1";
        let tjThemeUnlocked = localStorage.getItem(tjThemeUnlockKey) === "1";
        const codeEntryModal = document.getElementById("codeEntryModal");
        const codeEntryInput = document.getElementById("codeEntryInput");
        const codeEntrySubmitBtn = document.getElementById("codeEntrySubmitBtn");
        const codeEntryCancelBtn = document.getElementById("codeEntryCancelBtn");
        const aprilFoolsWarningModal = document.getElementById("aprilFoolsWarningModal");
        const aprilFoolsConfirmBtn = document.getElementById("aprilFoolsConfirmBtn");
        const aprilFoolsBackBtn = document.getElementById("aprilFoolsBackBtn");

        function updateSecretThemeButtonUi() {
          const buttonSpecs = [
            {
              container: document.getElementById("themeButtons"),
              theme: "zelda",
              label: "Zelda",
              unlocked: secretThemeUnlocked,
            },
            {
              container: document.getElementById("themeButtons"),
              theme: "tjtheme",
              label: "TJ's Theme",
              unlocked: tjThemeUnlocked,
            },
            {
              container: document.getElementById("speedRunThemeButtons"),
              theme: "tjtheme",
              label: "TJ's Theme",
              unlocked: tjThemeUnlocked,
            },
          ];

          for (const spec of buttonSpecs) {
            if (!spec.container) continue;
            let themeBtn = spec.container.querySelector(`[data-theme="${spec.theme}"]`);
            if (!themeBtn) {
              themeBtn = document.createElement("button");
              themeBtn.type = "button";
              themeBtn.className = "theme-btn";
              themeBtn.dataset.theme = spec.theme;
              themeBtn.textContent = spec.label;
              themeBtn.onclick = () => setTheme(spec.theme);
              spec.container.appendChild(themeBtn);
            }
            themeBtn.style.display = spec.unlocked ? "" : "none";
          }
        }

        function closeCodeEntryModal() {
          codeEntryModal.style.display = "none";
          codeEntryInput.value = "";
        }

        function openAprilFoolsWarningModal() {
          aprilFoolsWarningModal.style.display = "flex";
        }

        function closeAprilFoolsWarningModal() {
          aprilFoolsWarningModal.style.display = "none";
        }

        function submitCodeEntry() {
          const entered = codeEntryInput.value;
          if (!entered) {
            closeCodeEntryModal();
            return;
          }
          const normalized = entered.trim().toLowerCase();
          if (normalized === code1) {
            flashCodeMessage("test done");
          } else if (normalized === secretThemeCode) {
            if (!secretThemeUnlocked) {
              secretThemeUnlocked = true;
              localStorage.setItem(secretThemeUnlockKey, "1");
              updateSecretThemeButtonUi();
            }
            flashCodeMessage("zelda theme unlocked");
          } else if (normalized === tjThemeCode) {
            if (!tjThemeUnlocked) {
              tjThemeUnlocked = true;
              localStorage.setItem(tjThemeUnlockKey, "1");
              updateSecretThemeButtonUi();
            }
            flashCodeMessage("tj's theme unlocked");
          }
          closeCodeEntryModal();
        }

        function openCodeEntryModal() {
          codeEntryModal.style.display = "flex";
          codeEntryInput.value = "";
          codeEntryInput.focus();
        }

        function flashCodeMessage(text) {
          const flashEl = document.getElementById("codeFlashMessage");
          flashEl.textContent = text;
          flashEl.classList.remove("active");
          void flashEl.offsetWidth;
          flashEl.classList.add("active");
        }
        document.getElementById("menuCodesBtn").onclick = () => {
          openCodeEntryModal();
        };
        codeEntrySubmitBtn.onclick = submitCodeEntry;
        codeEntryCancelBtn.onclick = closeCodeEntryModal;
        codeEntryInput.addEventListener("keydown", (e) => {
          if (e.code === "Enter") {
            e.preventDefault();
            submitCodeEntry();
          } else if (e.code === "Escape") {
            e.preventDefault();
            closeCodeEntryModal();
          }
        });
        document.getElementById("openChangelogBtn").onclick = () => {
          document.getElementById("startMenu").style.display = "none";
          document.getElementById("changelogMenu").style.display = "flex";
        };
        document.getElementById("changelogBackBtn").onclick = () => {
          document.getElementById("changelogMenu").style.display = "none";
          document.getElementById("startMenu").style.display = "flex";
        };
        document.getElementById("modeBackBtn").onclick = () => {
          document.getElementById("modeMenu").style.display = "none";
          document.getElementById("startMenu").style.display = "flex";
        };
        document.getElementById("runModeBtn").onclick = () => startSelectedMode(false);
        document.getElementById("tutorialBtn").onclick = () => startSelectedMode(true);
        // Mode menu entry point for Speed Running mode
        document.getElementById("speedRunModeBtn").onclick = () => showSpeedRunMenu();
        document.getElementById("speedRunBackBtn").onclick = () => hideSpeedRunMenu();
        document.getElementById("speedRunStartBtn").onclick = () => startSpeedRunMode();

        // Speed Running Mode: Initialize and start a new speed run attempt
        // Sets all vars to level 1, records start time, fully resets game state, begins main loop
        // Goal: reach level 100 as quickly as possible without dying (any death = game over)
        function startSpeedRunMode() {
          ensureAudioContext();
          clearPostTutorialTour();
          speedRunMode = true;
          updateHudModeUi();
          tutorialMode = false;
          speedRunGameOverMode = false;
          // Record exact start time (milliseconds) for accurate timer
          speedRunStartTime = Date.now();
          resetSpeedRunGlitchWall();
          showingPostTutorialSettings = false;
          setTutorialUiVisible(false);
          currentLevel = 1;
          lastCheckpoint = 1;
          deathCount = 0;
          // Reset visual effects and counters from any previous attempt
          shake = 0;
          flashAlpha = 0;
          winParticles = [];
          document.getElementById("deaths").textContent = deathCount;
          setLevelDisplay();
          document.getElementById("startMenu").style.display = "none";
          document.getElementById("modeMenu").style.display = "none";
          document.getElementById("speedRunMenu").style.display = "none";
          setTopControlsVisible(false);
          // Show timer UI and reset stopwatch display
          document.getElementById("speedRunTimer").classList.add("active");
          document.getElementById("speedRunTimer").textContent = "00:00.000";
          document.getElementById("speedRunGameOver").style.display = "none";
          document.getElementById("pauseMenu").style.display = "none";
          // Keep pause state off because pausing is disabled in this mode
          isPaused = false;

          // Fully reset generated world state before creating level 1
          platforms = [];
          hazards = [];
          wells = [];
          shieldItem = null;
          
          generateLevel();
          resetPlayerForRun(330);

          const m = document.getElementById("bgMusic");
          if (m && themes[currentTheme] && themes[currentTheme].music) {
            m.src = themes[currentTheme].music;
            m.volume = musicMuted ? 0 : musicVol * masterVol;
            m.play().catch(() => {});
          }
          running = true;
          if (!loopStarted) {
            loopStarted = true;
            (function loop() {
              update();
              draw();
              requestAnimationFrame(loop);
            })();
          }
        }

        // Speed Running Mode: Converts milliseconds to MM:SS.mmm format for timer display and game over screen
        // Args: ms - elapsed time in milliseconds since speed run started
        // Returns: formatted string like "01:23.456" (1 minute, 23 seconds, 456 milliseconds)
        function formatSpeedRunTime(ms) {
          const minutes = Math.floor(ms / 60000);
          const seconds = Math.floor((ms % 60000) / 1000);
          const milliseconds = ms % 1000;
          return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
        }

        function updateSpeedRunBestTimeUi() {
          const display = speedRunBestTime > 0 ? formatSpeedRunTime(speedRunBestTime) : "--:--.---";
          const menuLabel = document.getElementById("speedRunBestTimeLabel");
          const gameOverLabel = document.getElementById("speedRunGameOverBestTime");
          if (menuLabel) menuLabel.textContent = display;
          if (gameOverLabel) gameOverLabel.textContent = display;
        }

        // Speed Running Mode: Display game over screen showing level reached and elapsed time
        // Called when player dies (any death = instant game over, no respawn or checkpoint)
        // Shows final level and formatted time, offers restart or return to menu
        function showSpeedRunGameOver() {
          if (!speedRunMode) return;
          speedRunGameOverMode = true;
          // Stop game and lock input
          running = false;
          isPaused = true;
          // Calculate final time for display
          const elapsedTime = Date.now() - speedRunStartTime;
          if (elapsedTime > 0 && (speedRunBestTime === 0 || elapsedTime < speedRunBestTime)) {
            speedRunBestTime = elapsedTime;
            localStorage.setItem("core_speedrun_best_time_v1", String(speedRunBestTime));
          }
          document.getElementById("speedRunGameOverLevel").textContent = currentLevel;
          document.getElementById("speedRunGameOverTime").textContent = formatSpeedRunTime(elapsedTime);
          updateSpeedRunBestTimeUi();
          // Show game over overlay and hide pause button  
          document.getElementById("speedRunGameOver").style.display = "flex";
          setTopControlsVisible(false);
        }

        document.getElementById("speedRunRestartBtn").onclick = () => {
          // Restart launches a brand-new speed run from level 1
          startSpeedRunMode();
        };

        document.getElementById("speedRunMenuBtn").onclick = () => {
          // Return to the Speed Run submenu from game over
          speedRunMode = false;
          speedRunGameOverMode = false;
          document.getElementById("speedRunGameOver").style.display = "none";
          document.getElementById("speedRunTimer").classList.remove("active");
          showSpeedRunMenu();
        };

        document.getElementById("speedRunMainMenuBtn").onclick = () => {
          // Exit speed run flow and return to main menu
          speedRunMode = false;
          speedRunGameOverMode = false;
          document.getElementById("speedRunGameOver").style.display = "none";
          document.getElementById("speedRunTimer").classList.remove("active");
          setTheme("classic");
          returnToStartMenu();
        };
        document.getElementById("exitTutorialBtn").onclick = () => {
          returnToStartMenu();
          document.getElementById("startMenu").style.display = "none";
          document.getElementById("modeMenu").style.display = "flex";
        };

        document.getElementById("pauseBtn").onclick = toggle;
        document.getElementById("topAchBtn").onclick = () => {
          openPauseShortcut("achievementsPage");
          renderAchievements();
        };
        document.getElementById("topMobileBtn").onclick = () => {
          openPauseShortcut("mobileSupportPage");
        };
        document.getElementById("topThemeBtn").onclick = () => {
          openPauseShortcut("themePage");
        };
        document.getElementById("topCheatsBtn").onclick = () => {
          openPauseShortcut("cheatsPage");
        };
        document.getElementById("resumeBtn").onclick = toggle;
        document.getElementById("settingsBtn").onclick = () => {
          document.getElementById("mainPausePage").style.display = "none";
          document.getElementById("settingsPage").style.display = "flex";
          document.getElementById("audioPage").style.display = "none";
          document.getElementById("themePage").style.display = "none";
          document.getElementById("mobileSupportPage").style.display = "none";
          document.getElementById("screenSizePage").style.display = "none";
          document.getElementById("tutorialNotesPage").style.display = "none";
          document.getElementById("achievementsPage").style.display = "none";
          document.getElementById("cheatsPage").style.display = "none";
        };
        document.getElementById("openAudioBtn").onclick = () => {
          document.getElementById("settingsPage").style.display = "none";
          document.getElementById("audioPage").style.display = "flex";
        };
        document.getElementById("openThemeBtn").onclick = () => {
          document.getElementById("settingsPage").style.display = "none";
          document.getElementById("themePage").style.display = "flex";
        };
        document.getElementById("openMobileSupportBtn").onclick = () => {
          document.getElementById("settingsPage").style.display = "none";
          document.getElementById("mobileSupportPage").style.display = "flex";
        };
        document.getElementById("openControlLayoutBtn").onclick = () => {
          // Start button customization mode - keep game paused
          buttonCustomizationActive = true;
          document.getElementById("pauseMenu").style.display = "none";
          document.getElementById("mobileControls").classList.add("customizing");
          document.getElementById("customizeConfirmBar").classList.add("active");
          showCustomizeGrid = false;
          document.getElementById("mobileControls").classList.remove("show-grid");
          const gridBtn = document.getElementById("customizeGridBtn");
          if (gridBtn) {
            gridBtn.classList.remove("active");
            gridBtn.textContent = "Show Grid";
          }
          
          // Position buttons absolutely based on saved positions
          updateButtonPositions();
        };
        document.getElementById("openScreenSizeBtn").onclick = () => {
          document.getElementById("mobileSupportPage").style.display = "none";
          document.getElementById("screenSizePage").style.display = "flex";
        };
        document.getElementById("openTutorialNotesBtn").onclick = () => {
          document.getElementById("settingsPage").style.display = "none";
          document.getElementById("tutorialNotesPage").style.display = "flex";
        };
        document.getElementById("settingsBackBtn").onclick = () => {
          if (showingPostTutorialSettings) {
            returnToStartMenu();
            return;
          }
          document.getElementById("settingsPage").style.display = "none";
          document.getElementById("mainPausePage").style.display = "flex";
        };
        document.getElementById("audioBackBtn").onclick = () => {
          document.getElementById("audioPage").style.display = "none";
          document.getElementById("settingsPage").style.display = "flex";
        };
        document.getElementById("themeBackBtn").onclick = () => {
          document.getElementById("themePage").style.display = "none";
          document.getElementById("settingsPage").style.display = "flex";
        };
        document.getElementById("mobileSupportBackBtn").onclick = () => {
          document.getElementById("mobileSupportPage").style.display = "none";
          document.getElementById("settingsPage").style.display = "flex";
        };
        document.getElementById("screenSizeBackBtn").onclick = () => {
          document.getElementById("screenSizePage").style.display = "none";
          document.getElementById("mobileSupportPage").style.display = "flex";
        };
        document.getElementById("tutorialNotesBackBtn").onclick = () => {
          document.getElementById("tutorialNotesPage").style.display = "none";
          document.getElementById("settingsPage").style.display = "flex";
        };
        const openCheatsPage = () => {
          showPauseMenuPage("cheatsPage");
        };
        document.getElementById("cheatsBtn").onclick = () => {
          openCheatsPage();
        };
        document.getElementById("cheatBackBtn").onclick = () => {
          document.getElementById("cheatsPage").style.display = "none";
          document.getElementById("mainPausePage").style.display = "flex";
        };
        document.getElementById("achievementsBtn").onclick = () => {
          showPauseMenuPage("achievementsPage");
          renderAchievements();
        };
        document.getElementById("achievementsBackBtn").onclick = () => {
          document.getElementById("achievementsPage").style.display = "none";
          document.getElementById("mainPausePage").style.display = "flex";
        };

        function hideResetPrompt() {
          document.getElementById("resetConfirm").style.display = "none";
          document.getElementById("mainPausePage").style.display = "flex";
        }

        function hideFullRestartPrompt(shouldResume = true) {
          document.getElementById("fullRestartConfirm").style.display = "none";
          if (shouldResume && fullRestartResumeOnCancel) {
            fullRestartResumeOnCancel = false;
            isPaused = false;
            const m = document.getElementById("bgMusic");
            if (m && themes[currentTheme] && themes[currentTheme].music) {
              m.play().catch(() => {});
            }
          }
          if (fullRestartOpenedFromResetPrompt) {
            document.getElementById("resetConfirm").style.display = "flex";
          }
          fullRestartOpenedFromResetPrompt = false;
        }

        function showResetPrompt() {
          document.getElementById("mainPausePage").style.display = "none";
          document.getElementById("fullRestartConfirm").style.display = "none";
          document.getElementById("resetConfirm").style.display = "flex";
        }

        function showFullRestartPrompt() {
          fullRestartOpenedFromResetPrompt =
            document.getElementById("resetConfirm").style.display === "flex";
          fullRestartResumeOnCancel = running && !isPaused;
          if (fullRestartResumeOnCancel) {
            isPaused = true;
            const m = document.getElementById("bgMusic");
            if (m) m.pause();
          }
          document.getElementById("resetConfirm").style.display = "none";
          document.getElementById("mainPausePage").style.display = "none";
          document.getElementById("fullRestartConfirm").style.display = "flex";
        }

        function respawnPlayer() {
          resetPlayerForRun(200);
          player.hasShield = false;
          player.spaghettified = false;
          player.deathScale = 1;
          player.deathRotate = 0;
        }

        function warpToLevel(targetLevel, markCheat = true) {
          const level = Math.max(1, Math.floor(targetLevel));
          if (!Number.isFinite(level)) return;

          tutorialMode = false;
          setTutorialUiVisible(false);
          currentLevel = level;
          lastCheckpoint = level;
          setLevelDisplay();
          generateLevel();
          resetPlayerForRun(330);
          player.hasShield = false;
          player.spaghettified = false;
          player.deathScale = 1;
          player.deathRotate = 0;
          player.speedZoneTimer = 0;
          player.speedZoneType = null;
          player.speedZoneMul = 1;
          player.standPlatform = null;

          isPaused = false;
          document.getElementById("pauseMenu").style.display = "none";

          const m = document.getElementById("bgMusic");
          if (m && running && themes[currentTheme] && themes[currentTheme].music) {
            m.play().catch(() => {});
          }

          if (markCheat) {
            useCheat();
          }
        }

        function applyDefaults() {
          masterVol = 0.5;
          musicVol = 0.5;
          sfxVol = 0.5;
          musicMuted = false;
          sfxMuted = false;
          isRetro8bit = false;
          infiniteInvincibility = false;
          tutorialMode = false;
          showingPostTutorialSettings = false;
          clearPostTutorialTour();
          setTutorialUiVisible(false);
          currentTheme = "classic";
          document.getElementById("masterSlider").value = 50;
          document.getElementById("musicSlider").value = 50;
          document.getElementById("sfxSlider").value = 50;
          document.getElementById("masterValue").textContent = "50%";
          document.getElementById("musicValue").textContent = "50%";
          document.getElementById("sfxValue").textContent = "50%";
          setTheme("classic");
          document.getElementById("retroToggleBtn").textContent = "8-bit: OFF";
          document.getElementById("invincibleBtn").textContent = "Invincibility: OFF";
          mobileSupportEnabled = false;
          resetMobileButtonLayout();
          screenScale = 100;
          buttonCustomizationActive = false;
          document.getElementById("screenSizeSlider").value = screenScale;
          updateControlLayoutUi();
          updateScreenSizeUi();
          updateMobileSupportUi();
          updateAudioButtonsUi();
          const m = document.getElementById("bgMusic");
          if (m) {
            if (themes[currentTheme].music) {
              m.src = themes[currentTheme].music;
              m.volume = musicVol * masterVol;
              m.play().catch(() => {});
            } else {
              m.pause();
            }
          }
        }

        function runRewindAnimation(fromLevel) {
          const overlay = document.getElementById("timeTravelAnimation");
          const clockHand = document.getElementById("clockHand");
          const levelLabel = document.getElementById("timeLevelLabel");
          const progressBar = document.getElementById("rewindProgress");

          const duration = Math.min(3500, 1100 + fromLevel * 90);
          const startTime = performance.now();
          const startAngle = 0;
          const endAngle = -360;
          const startLevel = Math.max(1, fromLevel);
          let currentLevel = startLevel;

          levelLabel.textContent = `Rewinding from Level ${currentLevel}`;
          progressBar.style.width = "0%";
          clockHand.style.transform = `rotate(${startAngle}deg)`;
          overlay.style.display = "flex";

          function animate(now) {
            const t = Math.min(1, (now - startTime) / duration);
            const angle = startAngle + (endAngle - startAngle) * t;
            clockHand.style.transform = `rotate(${angle}deg)`;
            progressBar.style.width = `${(t * 100).toFixed(2)}%`;

            const targetLevel = Math.max(
              1,
              Math.round(startLevel - (startLevel - 1) * t),
            );
            if (targetLevel !== currentLevel) {
              currentLevel = targetLevel;
              levelLabel.textContent =
                currentLevel === 1
                  ? "Rewind complete"
                  : `Rewinding to Level ${currentLevel}`;
            }

            if (t < 1) {
              requestAnimationFrame(animate);
            } else {
              setTimeout(() => {
                overlay.style.display = "none";
              }, 450);
            }
          }

          requestAnimationFrame(animate);
        }

        function checkpointRestart() {
          hideFullRestartPrompt(false);
          if (!tutorialMode) {
            currentLevel = lastCheckpoint;
            generateLevel();
          } else {
            generateTutorialLevel();
          }
          setLevelDisplay();
          respawnPlayer();
          isPaused = false;
          document.getElementById("pauseMenu").style.display = "none";
          hideResetPrompt();
        }

        function fullRestart() {
          hideFullRestartPrompt(false);
          fullRestartResumeOnCancel = false;
          const fromLevel = currentLevel;
          const wasTutorial = tutorialMode;

          deathCount = 0;
          document.getElementById("deaths").textContent = deathCount;

          localStorage.removeItem("void_achievements");
          storedAchievements = {};
          for (let key in achievements) {
            achievements[key].unlocked = false;
          }
          totalRunModeJumps = 0;
          localStorage.removeItem("void_total_run_jumps");
          mainMenuIdleMs = 0;
          mainMenuIdleDirty = false;
          mainMenuIdleLastPersist = Date.now();
          localStorage.removeItem("void_main_menu_idle_ms");
          renderAchievements();

          if (wasTutorial) {
            // In tutorial, full restart should restart tutorial from its start.
            applyDefaults();
            tutorialMode = true;
            showingPostTutorialSettings = false;
            setTutorialUiVisible(true);
            lastCheckpoint = 1;
            currentLevel = 1;
            setLevelDisplay();
            generateTutorialLevel();
            respawnPlayer();
            isPaused = false;
            document.getElementById("pauseMenu").style.display = "none";
            hideResetPrompt();
            play.rewind();
            runRewindAnimation(fromLevel);
            return;
          }

          tutorialMode = false;
          setTutorialUiVisible(false);
          lastCheckpoint = 1;
          currentLevel = 1;
          bestLevel = 1;
          speedRunBestLevel = 1;
          localStorage.setItem("core_best_v20", 1);
          localStorage.setItem("core_speedrun_best_level_v1", 1);
          localStorage.removeItem("void_secret_theme_zelda_unlocked");
          localStorage.removeItem("void_secret_theme_tjtheme_unlocked");
          secretThemeUnlocked = false;
          tjThemeUnlocked = false;
          updateSecretThemeButtonUi();
          setLevelDisplay();
          updateBestLevelUi();
          applyDefaults();
          generateLevel();
          respawnPlayer();
          isPaused = false;
          document.getElementById("pauseMenu").style.display = "none";
          hideResetPrompt();
          play.rewind();
          runRewindAnimation(fromLevel);
        }

        document.getElementById("restartBtn").onclick = showResetPrompt;
        document.getElementById("pauseMainMenuBtn").onclick = returnToStartMenu;
        document.getElementById("cancelResetBtn").onclick = hideResetPrompt;
        document.getElementById("checkpointRestartBtn").onclick = checkpointRestart;
        document.getElementById("fullRestartBtn").onclick = showFullRestartPrompt;
        document.getElementById("confirmFullRestartBtn").onclick = fullRestart;
        document.getElementById("cancelFullRestartBtn").onclick = () =>
          hideFullRestartPrompt(true);

        let lastSliderPreviewAt = 0;
        function playSliderPreview(kind, value) {
          const now = performance.now();
          if (now - lastSliderPreviewAt < 85) return;
          lastSliderPreviewAt = now;
          ensureAudioContext();
          if (!audioCtx) return;
          try {
            const normalized = Math.max(0, Math.min(1, value / 100));
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type =
              kind === "sfx"
                ? "square"
                : kind === "music"
                  ? "sine"
                  : "triangle";
            const baseFreq = kind === "sfx" ? 320 : kind === "music" ? 220 : 270;
            osc.frequency.setValueAtTime(
              baseFreq + normalized * 420,
              audioCtx.currentTime,
            );
            const previewVol = (0.012 + normalized * 0.045) * Math.max(0.2, masterVol);
            gain.gain.setValueAtTime(previewVol, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
              0.0001,
              audioCtx.currentTime + 0.075,
            );
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
          } catch (_err) {}
        }

        document.getElementById("masterSlider").oninput = (e) => {
          masterVol = e.target.value / 100;
          document.getElementById("masterValue").textContent =
            e.target.value + "%";
          const m = document.getElementById("bgMusic");
          if (m) {
            m.volume = musicMuted ? 0 : musicVol * masterVol;
          }
          playSliderPreview("master", Number(e.target.value));
        };
        document.getElementById("musicSlider").oninput = (e) => {
          musicVol = e.target.value / 100;
          document.getElementById("musicValue").textContent =
            e.target.value + "%";
          const m = document.getElementById("bgMusic");
          if (m) {
            m.volume = musicMuted ? 0 : musicVol * masterVol;
          }
          if (musicMuted && musicVol > 0 && masterVol > 0) {
            // auto-unmute if user adjusts the music slider
            musicMuted = false;
            document.getElementById("musicMuteBtn").textContent = "Music: ON";
            updateAudioButtonsUi();
          }
          playSliderPreview("music", Number(e.target.value));
        };
        document.getElementById("sfxSlider").oninput = (e) => {
          sfxVol = e.target.value / 100;
          document.getElementById("sfxValue").textContent =
            e.target.value + "%";
          if (sfxMuted && sfxVol > 0 && masterVol > 0) {
            sfxMuted = false;
            document.getElementById("sfxMuteBtn").textContent = "SFX: ON";
            updateAudioButtonsUi();
          }
          playSliderPreview("sfx", Number(e.target.value));
        };
        document.getElementById("musicMuteBtn").onclick = () => {
          musicMuted = !musicMuted;
          const m = document.getElementById("bgMusic");
          if (m) {
            m.volume = musicMuted ? 0 : musicVol * masterVol;
          }
          updateAudioButtonsUi();
        };
        document.getElementById("sfxMuteBtn").onclick = () => {
          sfxMuted = !sfxMuted;
          updateAudioButtonsUi();
        };
        document.getElementById("muteAllBtn").onclick = () => {
          const shouldMute = !(musicMuted && sfxMuted);
          musicMuted = shouldMute;
          sfxMuted = shouldMute;
          const m = document.getElementById("bgMusic");
          if (m) {
            m.volume = musicMuted ? 0 : musicVol * masterVol;
          }
          updateAudioButtonsUi();
        };
        function updateThemeButtonsUi() {
          const themeButtons = document.querySelectorAll(".theme-btn");
          for (const btn of themeButtons) {
            btn.classList.toggle("active", btn.dataset.theme === currentTheme);
          }
        }

        function setTheme(themeName) {
          currentTheme = themeName;
          updateThemeButtonsUi();
          
          // Adjust stat colors for better visibility on dark theme backgrounds
          const levelStat = document.querySelector('#ui-left > .stat:first-child');
          if (themeName === "zelda") {
            if (levelStat) {
              levelStat.style.color = "#ffd54a";
              levelStat.style.borderColor = "#ffd54a";
            }
          } else {
            if (levelStat) {
              levelStat.style.color = "";
              levelStat.style.borderColor = "";
            }
          }
          
          const m = document.getElementById("bgMusic");
          if (m && themes[currentTheme] && themes[currentTheme].music) {
            m.src = themes[currentTheme].music;
            m.volume = musicMuted ? 0 : musicVol * masterVol;
            if (running || currentTheme === "sunny") {
              m.play().catch(() => {});
            } else {
              m.pause();
            }
          } else if (m) {
            m.pause();
          }
        }

        function trySetTheme(themeName) {
          if (themeName === "aprilfools") {
            openAprilFoolsWarningModal();
            return;
          }
          setTheme(themeName);
        }

        document.querySelectorAll(".theme-btn").forEach((btn) => {
          btn.onclick = () => {
            trySetTheme(btn.dataset.theme);
          };
        });
        aprilFoolsConfirmBtn.onclick = () => {
          closeAprilFoolsWarningModal();
          setTheme("aprilfools");
        };
        aprilFoolsBackBtn.onclick = () => {
          closeAprilFoolsWarningModal();
          setTheme("classic");
        };
        updateSecretThemeButtonUi();
        document.getElementById("retroToggleBtn").onclick = () => {
          isRetro8bit = !isRetro8bit;
          document.getElementById("retroToggleBtn").textContent =
            "8-bit: " + (isRetro8bit ? "ON" : "OFF");
        };
        document.getElementById("invincibleBtn").onclick = () => {
          infiniteInvincibility = !infiniteInvincibility;
          document.getElementById("invincibleBtn").textContent =
            "Invincibility: " + (infiniteInvincibility ? "ON" : "OFF");
          useCheat();
          play.wn();
        };
        document.getElementById("warpBtn").onclick = () => {
          let v = parseInt(document.getElementById("warpInput").value);
          if (v > 0) {
            warpToLevel(v, true);
          }
        };
        function submenuBack() {
          const settingsPage = document.getElementById("settingsPage");
          const audioPage = document.getElementById("audioPage");
          const themePage = document.getElementById("themePage");
          const mobileSupportPage = document.getElementById("mobileSupportPage");
          const screenSizePage = document.getElementById("screenSizePage");
          const tutorialNotesPage = document.getElementById("tutorialNotesPage");
          const cheatsPage = document.getElementById("cheatsPage");

          if (
            audioPage.style.display === "flex" ||
            themePage.style.display === "flex" ||
            mobileSupportPage.style.display === "flex" ||
            tutorialNotesPage.style.display === "flex"
          ) {
            audioPage.style.display = "none";
            themePage.style.display = "none";
            mobileSupportPage.style.display = "none";
            tutorialNotesPage.style.display = "none";
            settingsPage.style.display = "flex";
            return true;
          }

          if (screenSizePage.style.display === "flex") {
            screenSizePage.style.display = "none";
            mobileSupportPage.style.display = "flex";
            return true;
          }

          if (cheatsPage.style.display === "flex") {
            cheatsPage.style.display = "none";
            settingsPage.style.display = "flex";
            return true;
          }

          if (settingsPage.style.display === "flex") {
            if (showingPostTutorialSettings) {
              returnToStartMenu();
              return true;
            }
            settingsPage.style.display = "none";
            document.getElementById("mainPausePage").style.display = "flex";
            return true;
          }

          return false;
        }

        function updateMobileSupportUi() {
          const toggleBtn = document.getElementById("mobileSupportToggleBtn");
          const controls = document.getElementById("mobileControls");
          const customizeBtn = document.getElementById("openControlLayoutBtn");
          const resetBtn = document.getElementById("resetControlLayoutBtn");
          const screenBtn = document.getElementById("openScreenSizeBtn");
          toggleBtn.textContent =
            "Mobile Support: " + (mobileSupportEnabled ? "ON" : "OFF");
          if (mobileSupportEnabled) controls.classList.add("active");
          else controls.classList.remove("active");
          customizeBtn.style.display = mobileSupportEnabled ? "block" : "none";
          if (resetBtn) resetBtn.style.display = mobileSupportEnabled ? "block" : "none";
          screenBtn.style.display = mobileSupportEnabled ? "block" : "none";
        }

        function resetMobileButtonLayout() {
          buttonPositions = JSON.parse(JSON.stringify(defaultButtonPositions));
          buttonSizes = JSON.parse(JSON.stringify(defaultButtonSizes));
          mobileBtnSize = 64;
          mobileBtnBottom = 10;
          mobileBtnLeft = 14;
          for (const btn of document.querySelectorAll(".mobile-btn.customizing")) {
            btn.classList.remove("customizing");
          }
          currentCustomizingButton = null;
          customizeStartData = null;
        }

        function snapMobileButtonLayout(gridSize = 8) {
          for (const btnId of Object.keys(buttonPositions)) {
            buttonPositions[btnId].x = Math.round(buttonPositions[btnId].x / gridSize) * gridSize;
            buttonPositions[btnId].y = Math.round(buttonPositions[btnId].y / gridSize) * gridSize;
          }
          for (const btnId of Object.keys(buttonSizes)) {
            buttonSizes[btnId] = Math.max(40, Math.round(buttonSizes[btnId] / gridSize) * gridSize);
          }
        }

        function updateAudioButtonsUi() {
          document.getElementById("musicMuteBtn").textContent =
            "Music: " + (musicMuted ? "OFF" : "ON");
          document.getElementById("sfxMuteBtn").textContent =
            "SFX: " + (sfxMuted ? "OFF" : "ON");
          const muteAllBtn = document.getElementById("muteAllBtn");
          if (muteAllBtn) {
            muteAllBtn.textContent = musicMuted && sfxMuted ? "Unmute All" : "Mute All";
          }
        }

        function updateControlLayoutUi() {
          const controls = document.getElementById("mobileControls");
          controls.style.bottom = mobileBtnBottom + "px";
          controls.style.left = mobileBtnLeft + "px";
          for (const btn of document.querySelectorAll("#mobileControls .mobile-btn")) {
            btn.style.height = mobileBtnSize + "px";
            btn.style.fontSize = Math.round(mobileBtnSize * 0.28) + "px";
            if (btn.classList.contains("wide")) {
              btn.style.width = Math.round(mobileBtnSize * 1.35) + "px";
              btn.style.borderRadius = Math.round(mobileBtnSize * 0.5) + "px";
              btn.style.fontSize = Math.max(11, Math.round(mobileBtnSize * 0.22)) + "px";
            } else {
              btn.style.width = mobileBtnSize + "px";
              btn.style.borderRadius = Math.round(mobileBtnSize * 0.5) + "px";
            }
          }
        }

        function updateScreenSizeUi() {
          document.getElementById("screenSizeValue").textContent =
            screenScale + "%";
          document.getElementById("gameShell").style.transform =
            `scale(${screenScale / 100})`;
        }

        document.getElementById("mobileSupportToggleBtn").onclick = () => {
          mobileSupportEnabled = !mobileSupportEnabled;
          updateMobileSupportUi();
        };

        document.getElementById("snapControlLayoutBtn").onclick = () => {
          snapMobileButtonLayout();
          updateButtonPositions();
        };

        document.getElementById("customizeGridBtn").onclick = () => {
          showCustomizeGrid = !showCustomizeGrid;
          const controls = document.getElementById("mobileControls");
          const gridBtn = document.getElementById("customizeGridBtn");
          controls.classList.toggle("show-grid", showCustomizeGrid);
          gridBtn.classList.toggle("active", showCustomizeGrid);
          gridBtn.textContent = showCustomizeGrid ? "Hide Grid" : "Show Grid";
        };

        document.getElementById("resetControlLayoutBtn").onclick = () => {
          resetMobileButtonLayout();
          updateButtonPositions();
        };

        document.getElementById("confirmCustomizeBtn").onclick = () => {
          snapMobileButtonLayout();
          // Exit customization mode and return to mobile settings
          forceReleaseAllMobileInputs();
          buttonCustomizationActive = false;
          currentCustomizingButton = null;
          document.getElementById("mobileControls").classList.remove("customizing");
          document.getElementById("mobileControls").classList.remove("show-grid");
          document.getElementById("customizeConfirmBar").classList.remove("active");
          showCustomizeGrid = false;
          const gridBtn = document.getElementById("customizeGridBtn");
          if (gridBtn) {
            gridBtn.classList.remove("active");
            gridBtn.textContent = "Show Grid";
          }
          
          // Remove customizing highlight from all buttons
          for (const btn of document.querySelectorAll(".mobile-btn.customizing")) {
            btn.classList.remove("customizing");
          }
          
          // Return to mobile support settings page
          document.getElementById("pauseMenu").style.display = "flex";
          document.getElementById("mainPausePage").style.display = "none";
            document.getElementById("settingsPage").style.display = "none";
          document.getElementById("mobileSupportPage").style.display = "flex";
        };

        function updateButtonPositions() {
          const controlsContainer = document.getElementById("mobileControls");
          const containerHeight = controlsContainer.getBoundingClientRect().height;
          const buttons = document.querySelectorAll("#mobileControls .mobile-btn");
          buttons.forEach(btn => {
            const btnId = btn.id;
            const pos = buttonPositions[btnId];
            const size = buttonSizes[btnId];
            
            btn.style.position = "absolute";
            btn.style.left = pos.x + "px";
            btn.style.bottom = (containerHeight - pos.y - size) + "px";
            btn.style.width = (btn.classList.contains("wide") ? size * 1.35 : size) + "px";
            btn.style.height = size + "px";
            if (btn.id === "btn-jump") {
              btn.style.fontSize = Math.max(11, Math.round(size * 0.22)) + "px";
            } else {
              btn.style.fontSize = Math.round(size * 0.28) + "px";
            }
            btn.style.borderRadius = Math.round(size * 0.5) + "px";
            btn.style.transition = "none";
          });
        }

        // Individual button click handling for customization selection
        document.querySelectorAll("#mobileControls .mobile-btn").forEach(btn => {
          btn.addEventListener("click", (e) => {
            if (!buttonCustomizationActive) {
              // Normal button operation outside customization
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            
            // Remove previous custom styling
            if (currentCustomizingButton && currentCustomizingButton !== btn) {
              currentCustomizingButton.classList.remove("customizing");
            }
            
            // Add custom styling to selected button
            btn.classList.add("customizing");
            currentCustomizingButton = btn;
          });
        });

        // Touch/mouse drag handling for button repositioning
        let isDragging = false;
        let draggedButton = null;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        document.addEventListener("mousedown", (e) => {
          if (!buttonCustomizationActive) return;
          const btn = e.target.closest("#mobileControls .mobile-btn");
          if (!btn) return;
          draggedButton = btn;
          isDragging = true;
          dragOffsetX = e.clientX - btn.getBoundingClientRect().left;
          dragOffsetY = e.clientY - btn.getBoundingClientRect().top;
          e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
          if (!isDragging || !draggedButton || !buttonCustomizationActive) return;
          const container = document.getElementById("mobileControls");
          const containerRect = container.getBoundingClientRect();
          let newX = e.clientX - containerRect.left - dragOffsetX;
          let newY = e.clientY - containerRect.top - dragOffsetY;
          
          // Clamp to container bounds
          newX = Math.max(0, Math.min(newX, containerRect.width - draggedButton.offsetWidth));
          newY = Math.max(0, Math.min(newY, containerRect.height - draggedButton.offsetHeight));
          
          draggedButton.style.left = newX + "px";
          draggedButton.style.bottom = (containerRect.height - newY - draggedButton.offsetHeight) + "px";
          
          // Update saved position
          buttonPositions[draggedButton.id].x = newX;
          buttonPositions[draggedButton.id].y = newY;
        });

        document.addEventListener("mouseup", () => {
          isDragging = false;
          draggedButton = null;
        });

        document.addEventListener("touchstart", (e) => {
          if (!buttonCustomizationActive) return;
          const btn = e.target.closest("#mobileControls .mobile-btn");
          if (!btn) return;
          if (e.touches.length === 1) {
            draggedButton = btn;
            isDragging = true;
            dragOffsetX = e.touches[0].clientX - btn.getBoundingClientRect().left;
            dragOffsetY = e.touches[0].clientY - btn.getBoundingClientRect().top;
          } else if (e.touches.length === 2 && draggedButton) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            touchStartDistance = Math.sqrt(dx * dx + dy * dy);
            customizeStartData = {
              buttonId: draggedButton.id,
              startSize: buttonSizes[draggedButton.id]
            };
          }
        }, { passive: false });

        document.addEventListener("touchmove", (e) => {
          if (!buttonCustomizationActive) return;
          if (e.touches.length === 1 && isDragging && draggedButton) {
            const container = document.getElementById("mobileControls");
            const containerRect = container.getBoundingClientRect();
            let newX = e.touches[0].clientX - containerRect.left - dragOffsetX;
            let newY = e.touches[0].clientY - containerRect.top - dragOffsetY;
            
            newX = Math.max(0, Math.min(newX, containerRect.width - draggedButton.offsetWidth));
            newY = Math.max(0, Math.min(newY, containerRect.height - draggedButton.offsetHeight));
            
            draggedButton.style.left = newX + "px";
            draggedButton.style.bottom = (containerRect.height - newY - draggedButton.offsetHeight) + "px";
            
            buttonPositions[draggedButton.id].x = newX;
            buttonPositions[draggedButton.id].y = newY;
            e.preventDefault();
          } else if (e.touches.length === 2 && draggedButton && customizeStartData) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDistance = Math.sqrt(dx * dx + dy * dy);
            if (touchStartDistance > 0) {
              const scale = currentDistance / touchStartDistance;
              let newSize = Math.round(customizeStartData.startSize * scale);
              newSize = Math.max(40, Math.min(100, newSize));
              buttonSizes[customizeStartData.buttonId] = newSize;
              updateButtonPositions();
              e.preventDefault();
            }
          }
        }, { passive: false });

        document.addEventListener("touchend", () => {
          isDragging = false;
          draggedButton = null;
          touchStartDistance = 0;
          customizeStartData = null;
        });

        document.getElementById("screenSizeSlider").oninput = (e) => {
          screenScale = parseInt(e.target.value, 10);
          updateScreenSizeUi();
        };

        updateControlLayoutUi();
        updateScreenSizeUi();
        updateMobileSupportUi();
        updateThemeButtonsUi();
        updateAudioButtonsUi();

        const activePointerToCode = new Map();
        function forceReleaseAllMobileInputs() {
          for (const activeCode of activePointerToCode.values()) {
            keys[activeCode] = 0;
          }
          activePointerToCode.clear();
          for (const btn of document.querySelectorAll("#mobileControls [data-code]")) {
            const code = btn.dataset.code;
            if (code) keys[code] = 0;
          }
        }
        const releasePointerFallback = (ev) => {
          const activeCode = activePointerToCode.get(ev.pointerId);
          if (!activeCode) return;
          keys[activeCode] = 0;
          activePointerToCode.delete(ev.pointerId);
        };
        window.addEventListener("pointerup", releasePointerFallback);
        window.addEventListener("pointercancel", releasePointerFallback);

        for (const btn of document.querySelectorAll("#mobileControls [data-code]")) {
          const code = btn.dataset.code;
          const press = (ev) => {
            ev.preventDefault();
            keys[code] = 1;
            activePointerToCode.set(ev.pointerId, code);
            if (btn.setPointerCapture) {
              try {
                btn.setPointerCapture(ev.pointerId);
              } catch (_err) {
                // Some browsers can throw if capture is not allowed for this event target.
              }
            }
          };
          const release = (ev) => {
            ev.preventDefault();
            keys[code] = 0;
            activePointerToCode.delete(ev.pointerId);
            if (btn.hasPointerCapture && btn.hasPointerCapture(ev.pointerId)) {
              try {
                btn.releasePointerCapture(ev.pointerId);
              } catch (_err) {
                // Ignore release errors for already-released or invalid captures.
              }
            }
          };
          btn.addEventListener("pointerdown", press);
          btn.addEventListener("pointerup", release);
          btn.addEventListener("pointercancel", release);
          btn.addEventListener("pointerleave", release);
          btn.addEventListener("contextmenu", (ev) => ev.preventDefault());
        }

        window.onkeydown = (e) => {
          const activeTag = document.activeElement
            ? document.activeElement.tagName
            : "";
          const typingInField =
            activeTag === "INPUT" ||
            activeTag === "TEXTAREA" ||
            activeTag === "SELECT" ||
            (document.activeElement && document.activeElement.isContentEditable);

          const isPauseShortcut = e.code === "KeyP" || e.code === "Escape";
          if (isPauseShortcut) {
            if (codeEntryModal.style.display === "flex") {
              e.preventDefault();
              closeCodeEntryModal();
              return;
            }

            if (aprilFoolsWarningModal.style.display === "flex") {
              e.preventDefault();
              closeAprilFoolsWarningModal();
              setTheme("classic");
              return;
            }

            if (versionPickerMenu.style.display === "flex") {
              e.preventDefault();
              closeVersionPicker();
              return;
            }

            if (document.getElementById("fullRestartConfirm").style.display === "flex") {
              e.preventDefault();
              hideFullRestartPrompt();
              return;
            }

            if (document.getElementById("pauseMenu").style.display === "flex") {
              e.preventDefault();
              if (submenuBack()) return;
            }

            e.preventDefault();
            toggle();
            return;
          }

          if (typingInField) {
            return;
          }

          keys[e.code] = 1;

          if (e.code === "KeyR" && !typingInField) {
            if (
              document.getElementById("fullRestartConfirm").style.display ===
              "flex"
            ) {
              e.preventDefault();
              return;
            }
            if (e.repeat) {
              e.preventDefault();
              return;
            }
            // Hotkey restarts only while actively playing (not while paused/in pause UI)
            if (
              running &&
              !isPaused &&
              document.getElementById("pauseMenu").style.display !== "flex" &&
              !speedRunMode &&
              !speedRunGameOverMode
            ) {
              e.preventDefault();
              if (e.shiftKey) {
                // Quick keybind: Shift+R opens confirmation popup for full restart
                showFullRestartPrompt();
              } else {
                // Quick keybind: R restarts from checkpoint immediately
                checkpointRestart();
              }
              return;
            }
          }

          if (
            [
              "ArrowUp",
              "ArrowDown",
              "ArrowLeft",
              "ArrowRight",
              "ShiftLeft",
              "ShiftRight",
              "KeyW",
              "KeyA",
              "KeyS",
              "KeyD",
              "Space",
            ].includes(e.code)
          )
            e.preventDefault();
        };
        window.onkeyup = (e) => (keys[e.code] = 0);
      };
