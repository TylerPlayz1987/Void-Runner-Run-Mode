(function () {
  const hiddenHudIds = ["ui-left", "ui-right", "speedRunTimer"];
  const hudDisplayCache = {};
  const gameplayLayerDisplayCache = {};
  const chapterOneLevelCode = "eyJ0YWciOiJ2b2lkLXJ1bm5lci1jdXN0b20tbGV2ZWwiLCJ2IjoxLCJkYXRhIjp7Im5hbWUiOiIxLTEiLCJ0aGVtZSI6ImNsYXNzaWNyZXZhbXBlZCIsIndpZHRoIjoyNjAwLCJzcGF3biI6eyJ4Ijo2MCwieSI6MzAwfSwiZ29hbCI6eyJ4IjoyMzgwLCJ5IjoyNjAsInciOjQwLCJoIjo0MH0sInBsYXRmb3JtcyI6W3sieCI6MCwieSI6MzUwLCJ3Ijo0ODAsImgiOjUwLCJraW5kIjoibm9ybWFsIiwiaXNQaGFzZSI6ZmFsc2UsImlzU2lua2luZyI6ZmFsc2UsIm1vdmVSYW5nZSI6MCwibW92ZVNwZWVkIjoxLjcsImhhc1NwZWVkWm9uZSI6ZmFsc2UsInNwZWVkWm9uZVR5cGUiOiJib29zdCIsInNwZWVkWm9uZVgiOjIwLCJzcGVlZFpvbmVXIjo5MCwic3BlZWRab25lRHVyYXRpb24iOjYwMCwic3BlZWRab25lTXVsIjoxLjUsImhhc0Zha2VIYXphcmQiOmZhbHNlLCJmYWtlVHlwZSI6Imdob3N0U3Bpa2UiLCJmYWtlVyI6MjQsImZha2VIIjoxNCwiZmFrZVgiOjB9LHsieCI6MjI5MCwieSI6MzEwLCJ3IjoxNDAsImgiOjE4LCJraW5kIjoibm9ybWFsIiwiaXNQaGFzZSI6ZmFsc2UsImlzU2lua2luZyI6ZmFsc2UsIm1vdmVSYW5nZSI6MCwibW92ZVNwZWVkIjoxLjcsImhhc1NwZWVkWm9uZSI6ZmFsc2UsInNwZWVkWm9uZVR5cGUiOiJib29zdCIsInNwZWVkWm9uZVgiOjIwLCJzcGVlZFpvbmVXIjo5MCwic3BlZWRab25lRHVyYXRpb24iOjYwMCwic3BlZWRab25lTXVsIjoxLjYsImhhc0Zha2VIYXphcmQiOmZhbHNlLCJmYWtlVHlwZSI6Imdob3N0U3Bpa2UiLCJmYWtlVyI6MjQsImZha2VIIjoxNCwiZmFrZVgiOjMwfSx7IngiOjIxNzAsInkiOjI2MCwidyI6MTQwLCJoIjoxOCwia2luZCI6Im5vcm1hbCIsImlzUGhhc2UiOmZhbHNlLCJpc1NpbmtpbmciOmZhbHNlLCJtb3ZlUmFuZ2UiOjAsIm1vdmVTcGVlZCI6MS43LCJoYXNTcGVlZFpvbmUiOmZhbHNlLCJzcGVlZFpvbmVUeXBlIjoiYm9vc3QiLCJzcGVlZFpvbmVYIjoyMCwic3BlZWRab25lVyI6OTAsInNwZWVkWm9uZUR1cmF0aW9uIjo2MDAsInNwZWVkWm9uZU11bCI6MS42LCJoYXNGYWtlSGF6YXJkIjpmYWxzZSwiZmFrZVR5cGUiOiJnaG9zdFNwaWtlIiwiZmFrZVciOjI0LCJmYWtlSCI6MTQsImZha2VYIjozMH0seyJ4IjoxODgwLCJ5IjoyMzAsInciOjE0MCwiaCI6MTgsImtpbmQiOiJub3JtYWwiLCJpc1BoYXNlIjpmYWxzZSwiaXNTaW5raW5nIjpmYWxzZSwibW92ZVJhbmdlIjowLCJtb3ZlU3BlZWQiOjEuNywiaGFzU3BlZWRab25lIjpmYWxzZSwic3BlZWRab25lVHlwZSI6ImJvb3N0Iiwic3BlZWRab25lWCI6MjAsInNwZWVkWm9uZVciOjkwLCJzcGVlZFpvbmVEdXJhdGlvbiI6NjAwLCJzcGVlZFpvbmVNdWwiOjEuNiwiaGFzRmFrZUhhemFyZCI6ZmFsc2UsImZha2VUeXBlIjoiZ2hvc3RTcGlrZSIsImZha2VXIjoyNCwiZmFrZUgiOjE0LCJmYWtlWCI6MzB9LHsieCI6MTU0MCwieSI6MzAwLCJ3IjoxNDAsImgiOjE4LCJraW5kIjoibm9ybWFsIiwiaXNQaGFzZSI6ZmFsc2UsImlzU2lua2luZyI6ZmFsc2UsIm1vdmVSYW5nZSI6MCwibW92ZVNwZWVkIjoxLjcsImhhc1NwZWVkWm9uZSI6ZmFsc2UsInNwZWVkWm9uZVR5cGUiOiJib29zdCIsInNwZWVkWm9uZVgiOjIwLCJzcGVlZFpvbmVXIjo5MCwic3BlZWRab25lRHVyYXRpb24iOjYwMCwic3BlZWRab25lTXVsIjoxLjYsImhhc0Zha2VIYXphcmQiOmZhbHNlLCJmYWtlVHlwZSI6Imdob3N0U3Bpa2UiLCJmYWtlVyI6MjQsImZha2VIIjoxNCwiZmFrZVgiOjMwfSx7IngiOjExMDAsInkiOjIyMCwidyI6MTQwLCJoIjoxOCwia2luZCI6Im5vcm1hbCIsImlzUGhhc2UiOmZhbHNlLCJpc1NpbmtpbmciOmZhbHNlLCJtb3ZlUmFuZ2UiOjAsIm1vdmVTcGVlZCI6MS43LCJoYXNTcGVlZFpvbmUiOmZhbHNlLCJzcGVlZFpvbmVUeXBlIjoiYm9vc3QiLCJzcGVlZFpvbmVYIjoyMCwic3BlZWRab25lVyI6OTAsInNwZWVkWm9uZUR1cmF0aW9uIjo2MDAsInNwZWVkWm9uZU11bCI6MS42LCJoYXNGYWtlSGF6YXJkIjpmYWxzZSwiZmFrZVR5cGUiOiJnaG9zdFNwaWtlIiwiZmFrZVciOjI0LCJmYWtlSCI6MTQsImZha2VYIjozMH0seyJ4Ijo3NzAsInkiOjMwMCwidyI6MTQwLCJoIjoxOCwia2luZCI6Im5vcm1hbCIsImlzUGhhc2UiOmZhbHNlLCJpc1NpbmtpbmciOmZhbHNlLCJtb3ZlUmFuZ2UiOjAsIm1vdmVTcGVlZCI6MS43LCJoYXNTcGVlZFpvbmUiOmZhbHNlLCJzcGVlZFpvbmVUeXBlIjoiYm9vc3QiLCJzcGVlZFpvbmVYIjoyMCwic3BlZWRab25lVyI6OTAsInNwZWVkWm9uZUR1cmF0aW9uIjo2MDAsInNwZWVkWm9uZU11bCI6MS42LCJoYXNGYWtlSGF6YXJkIjpmYWxzZSwiZmFrZVR5cGUiOiJnaG9zdFNwaWtlIiwiZmFrZVciOjI0LCJmYWtlSCI6MTQsImZha2VYIjozMH0seyJ4Ijo1MTAsInkiOjM0MCwidyI6MTQwLCJoIjoxOCwia2luZCI6Im5vcm1hbCIsImlzUGhhc2UiOmZhbHNlLCJpc1NpbmtpbmciOmZhbHNlLCJtb3ZlUmFuZ2UiOjAsIm1vdmVTcGVlZCI6MS43LCJoYXNTcGVlZFpvbmUiOmZhbHNlLCJzcGVlZFpvbmVUeXBlIjoiYm9vc3QiLCJzcGVlZFpvbmVYIjoyMCwic3BlZWRab25lVyI6OTAsInNwZWVkWm9uZUR1cmF0aW9uIjo2MDAsInNwZWVkWm9uZU11bCI6MS42LCJoYXNGYWtlSGF6YXJkIjpmYWxzZSwiZmFrZVR5cGUiOiJnaG9zdFNwaWtlIiwiZmFrZVciOjI0LCJmYWtlSCI6MTQsImZha2VYIjozMH1dLCJvYnN0YWNsZXMiOlt7InR5cGUiOiJzcGlrZSIsIngiOjc5MCwieSI6MjkwLCJ3IjoyNCwiaCI6MTIsInNoYXBlIjoidHJpYW5nbGUifSx7InR5cGUiOiJzcGlrZSIsIngiOjg5MCwieSI6MjkwLCJ3IjoyNCwiaCI6MTIsInNoYXBlIjoidHJpYW5nbGUifSx7InR5cGUiOiJsYXZhV2FsbCIsIngiOjExNjAsInciOjMwLCJoIjoxOTAsInNwZWVkIjoyLCJob2xkTWF4Ijo1MH0seyJ0eXBlIjoic2Vla2VyIiwieCI6MTU3MCwieSI6MjkwLCJ3IjoyMCwiaCI6MTQsInJhbmdlIjo0NSwic3BlZWQiOjIuMiwic2hhcGUiOiJzcGxpdCJ9LHsidHlwZSI6IndlbGwiLCJ4IjoyMTMwLCJ5IjoxMzAsInIiOjc1LCJjb3JlIjoxMH1dLCJwb3dlcnVwcyI6W119fQ";
  const chapters = [
    {
      label: "Chapter 1",
      title: "Into The Rift",
      description: "A strange force is tearing the void apart. Enter the rift and find the source.",
      buttonText: "Start Chapter 1",
      playable: true,
    },
    {
      label: "Chapter 2",
      title: "???",
      description: "???",
      buttonText: "Coming Soon",
      playable: false,
    },
    {
      label: "Chapter 3",
      title: "???",
      description: "???",
      buttonText: "Coming Soon",
      playable: false,
    },
    {
      label: "Chapter 4",
      title: "???",
      description: "???",
      buttonText: "Coming Soon",
      playable: false,
    },
    {
      label: "Chapter 5",
      title: "???",
      description: "???",
      buttonText: "Coming Soon",
      playable: false,
    },
  ];
  const storyStateStorageKey = "vr_story_mode_map_state_v1";
  const worlds = [
    createWorld("World 1", "The Fractured Lands", "Explore the tear in the fabric of reality.", "#7e0087", 12),
    createWorld("World 2", "Neon Tide", "City lights, moving platforms, and brighter hazards.", "#53c8ff", 10),
    createWorld("World 3", "Clockwork Summit", "Tight timing, shifting gears, and layered routes.", "#ffd166", 13),
    createWorld("World 4", "Moonfall Wilds", "Moonlit caves and longer routes through the dark.", "#c18dff", 11),
    createWorld("World 5", "Final Spiral", "The last stretch before the chapter one finale.", "#ff7b6b", 15),
  ];
  let currentView = "chapter";
  let currentChapterIndex = 0;
  let currentWorldIndex = 0;
  let currentLevelIndex = 0;
  let statusResetTimer = null;

  function createWorld(label, title, description, accent, levelCount) {
    const levels = [];

    for (let index = 0; index < levelCount; index += 1) {
      const levelNumber = index + 1;
      const isFirst = index === 0;
      const isLast = index === levelCount - 1;

      levels.push({
        label: `${label.replace(/[^0-9]/g, "")}-${levelNumber}`,
        title: label === "World 1" && isFirst ? "1-1" : isFirst ? "Opening Route" : isLast ? "World Gate" : `Stage ${levelNumber}`,
        description: label === "World 1" && isFirst
          ? "Your custom 1-1 level is ready to play."
          : isFirst
            ? "Placeholder slot for the first stage and opening cutscene."
          : isLast
            ? "Placeholder slot for the world finale and boss exit."
            : "Placeholder stage slot ready for your level layout and cutscene notes.",
        kind: isFirst ? "start" : isLast ? "finale" : levelNumber % 4 === 0 ? "checkpoint" : "stage",
      });
    }

    return {
      label,
      title,
      description,
      accent,
      levelCount,
      levels,
    };
  }

  function safeReadStoryState() {
    try {
      const raw = window.localStorage.getItem(storyStateStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function saveStoryState() {
    try {
      window.localStorage.setItem(
        storyStateStorageKey,
        JSON.stringify({
          currentWorldIndex,
          currentLevelIndex,
        })
      );
    } catch (err) {
      // Ignore storage failures and keep the menu usable.
    }
  }

  function loadStoryState() {
    const stored = safeReadStoryState();
    if (!stored) return;

    if (typeof stored.currentWorldIndex === "number" && stored.currentWorldIndex >= 0 && stored.currentWorldIndex < worlds.length) {
      currentWorldIndex = stored.currentWorldIndex;
    }

    const world = worlds[currentWorldIndex];
    if (!world) return;

    if (typeof stored.currentLevelIndex === "number" && stored.currentLevelIndex >= 0 && stored.currentLevelIndex < world.levels.length) {
      currentLevelIndex = stored.currentLevelIndex;
    }
  }

  function getCurrentWorld() {
    return worlds[currentWorldIndex] || worlds[0] || null;
  }

  function getCurrentLevel() {
    const world = getCurrentWorld();
    if (!world) return null;
    return world.levels[currentLevelIndex] || world.levels[0] || null;
  }

  function getCurrentLevelLabel() {
    const world = getCurrentWorld();
    const level = getCurrentLevel();
    if (!world || !level) return "";
    return `${world.label} - ${level.label}`;
  }

  function getMapBoardPoints(levelCount) {
    const rows = Math.ceil(levelCount / 4);
    const rowYs = rows === 4 ? [18, 38, 58, 78] : rows === 3 ? [22, 47, 72] : rows === 2 ? [30, 66] : [48];
    const rowXs = [16, 39, 62, 85];
    const points = [];

    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      const rowStart = rowIndex * 4;
      const levelsInRow = Math.min(4, levelCount - rowStart);
      const xOrder = rowIndex % 2 === 0 ? rowXs : rowXs.slice().reverse();

      for (let columnIndex = 0; columnIndex < levelsInRow; columnIndex += 1) {
        points.push({
          x: xOrder[columnIndex],
          y: rowYs[rowIndex],
        });
      }
    }

    return points;
  }

  function setSelectionStatus(text) {
    const statusEl = getEl("storySelectionStatus");
    if (!statusEl) return;
    statusEl.textContent = text;
  }

  function refreshSelectionStatus() {
    const levelLabel = getCurrentLevelLabel();
    if (!levelLabel) return;
    setSelectionStatus(`Selected: ${levelLabel}`);
  }

  function getStoryRuntime() {
    return window.VRStoryModeRuntime || null;
  }

  function loadChapterOneLevelData() {
    const runtime = getStoryRuntime();
    if (!runtime || typeof runtime.decodeCustomLevel !== "function") return null;
    try {
      return runtime.decodeCustomLevel(chapterOneLevelCode);
    } catch (err) {
      return null;
    }
  }

  function startSelectedChapterOneLevel() {
    const runtime = getStoryRuntime();
    if (!runtime || typeof runtime.startCustomLevelPlay !== "function") {
      flashStoryStatus("Story level loader is unavailable.");
      return;
    }

    const levelData = loadChapterOneLevelData();
    if (!levelData) {
      flashStoryStatus("Unable to load Chapter 1-1.");
      return;
    }

    runtime.startCustomLevelPlay(levelData, false);
  }

  function getCurrentChapter() {
    return chapters[currentChapterIndex] || chapters[0] || null;
  }

  function updateChapterUi() {
    const chapter = getCurrentChapter();
    const labelEl = getEl("storyChapterLabel");
    const titleEl = getEl("storyChapterTitle");
    const descEl = getEl("storyChapterDesc");
    const startBtn = getEl("storyChapterStartBtn");
    const prevBtn = getEl("storyChapterPrevBtn");
    const nextBtn = getEl("storyChapterNextBtn");
    const chapterMetaEl = getEl("storyChapterMeta");
    if (!chapter || !labelEl || !titleEl || !descEl || !startBtn || !prevBtn || !nextBtn) {
      return;
    }

    labelEl.textContent = chapter.label;
    titleEl.textContent = chapter.title;
    descEl.textContent = chapter.description;
    startBtn.textContent = chapter.buttonText;
    startBtn.disabled = !chapter.playable;
    prevBtn.disabled = currentChapterIndex <= 0;
    nextBtn.disabled = currentChapterIndex >= chapters.length - 1;

    if (chapterMetaEl) {
      chapterMetaEl.textContent = chapter.playable ? "Available now" : "Coming soon";
    }
  }

  function flashStoryStatus(text) {
    const statusEl = getEl("storySelectionStatus");
    if (!statusEl) return;

    const currentWorld = getCurrentWorld();
    const currentLevel = getCurrentLevel();
    if (statusResetTimer) {
      window.clearTimeout(statusResetTimer);
      statusResetTimer = null;
    }

    statusEl.textContent = text;
    statusResetTimer = window.setTimeout(function () {
      statusResetTimer = null;
      if (currentWorld === getCurrentWorld() && currentLevel === getCurrentLevel()) {
        refreshSelectionStatus();
      }
    }, 1100);
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function getGameShell() {
    return getEl("gameShell");
  }

  function hideGameplayLayerForStoryMenu() {
    const container = getEl("container");
    if (!container) return;
    if (!('containerDisplay' in gameplayLayerDisplayCache)) {
      gameplayLayerDisplayCache.containerDisplay = container.style.display;
      gameplayLayerDisplayCache.containerVisibility = container.style.visibility;
      gameplayLayerDisplayCache.containerOpacity = container.style.opacity;
      gameplayLayerDisplayCache.containerPointerEvents = container.style.pointerEvents;
    }
    container.style.visibility = 'hidden';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
  }

  function restoreGameplayLayerAfterStoryMenu() {
    const container = getEl("container");
    if (!container) return;
    if ('containerDisplay' in gameplayLayerDisplayCache) {
      container.style.display = gameplayLayerDisplayCache.containerDisplay;
      container.style.visibility = gameplayLayerDisplayCache.containerVisibility;
      container.style.opacity = gameplayLayerDisplayCache.containerOpacity;
      container.style.pointerEvents = gameplayLayerDisplayCache.containerPointerEvents;
      delete gameplayLayerDisplayCache.containerDisplay;
      delete gameplayLayerDisplayCache.containerVisibility;
      delete gameplayLayerDisplayCache.containerOpacity;
      delete gameplayLayerDisplayCache.containerPointerEvents;
    } else {
      container.style.display = '';
      container.style.visibility = '';
      container.style.opacity = '';
      container.style.pointerEvents = '';
    }
  }

  function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function isGameFullscreen() {
    const shell = getGameShell();
    if (!shell) return false;
    return getFullscreenElement() === shell;
  }

  async function enterGameFullscreen() {
    const shell = getGameShell();
    if (!shell || isGameFullscreen()) return;

    try {
      if (shell.requestFullscreen) {
        await shell.requestFullscreen();
      } else if (shell.webkitRequestFullscreen) {
        shell.webkitRequestFullscreen();
      }
    } catch (err) {
      // Ignore blocked fullscreen requests and keep the menu usable.
    }
  }

  async function exitGameFullscreen() {
    if (!isGameFullscreen()) return;

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (err) {
      // Ignore blocked fullscreen exits and continue the transition.
    }
  }

  function renderWorldSummary() {
    const world = getCurrentWorld();
    const labelEl = getEl("storyWorldLabel");
    const titleEl = getEl("storyWorldTitle");
    const descEl = getEl("storyWorldDesc");
    const countEl = getEl("storyWorldCount");
    const startBtn = getEl("storyWorldStartBtn");
    const prevBtn = getEl("storyWorldPrevBtn");
    const nextBtn = getEl("storyWorldNextBtn");
    if (!world || !labelEl || !titleEl || !descEl || !countEl || !startBtn || !prevBtn || !nextBtn) {
      return;
    }

    labelEl.textContent = world.label;
    titleEl.textContent = world.title;
    descEl.textContent = world.description;
    countEl.textContent = `${world.levels.length} levels`;
    const isChapterOneLevel = currentWorldIndex === 0 && currentLevelIndex === 0;
    startBtn.textContent = isChapterOneLevel ? "Start 1-1" : "Coming Soon";
    startBtn.disabled = !isChapterOneLevel;
    prevBtn.disabled = currentWorldIndex <= 0;
    nextBtn.disabled = currentWorldIndex >= worlds.length - 1;

    const menu = getEl("storyWorldMenu");
    if (menu) {
      menu.style.setProperty("--story-accent", world.accent);
    }
  }

  function renderMapBoard() {
    const world = getCurrentWorld();
    const nodesEl = getEl("storyMapNodes");
    const pathEl = getEl("storyMapPath");
    const levelInfoEl = getEl("storyLevelInfo");
    if (!world || !nodesEl || !pathEl || !levelInfoEl) {
      return;
    }

    const points = getMapBoardPoints(world.levels.length);
    pathEl.innerHTML = "";
    nodesEl.innerHTML = "";

    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute(
      "points",
      points
        .map(function (point) {
          return `${point.x},${point.y}`;
        })
        .join(" ")
    );
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", world.accent);
    polyline.setAttribute("stroke-width", "3.5");
    polyline.setAttribute("stroke-linecap", "round");
    polyline.setAttribute("stroke-linejoin", "round");
    polyline.setAttribute("filter", "url(#storyMapGlow)");
    pathEl.appendChild(polyline);

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", "storyMapGlow");
    filter.setAttribute("x", "-40%");
    filter.setAttribute("y", "-40%");
    filter.setAttribute("width", "180%");
    filter.setAttribute("height", "180%");

    const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    blur.setAttribute("stdDeviation", "3");
    blur.setAttribute("result", "blur");
    const merge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const mergeNodeOne = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    mergeNodeOne.setAttribute("in", "blur");
    const mergeNodeTwo = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    mergeNodeTwo.setAttribute("in", "SourceGraphic");

    merge.appendChild(mergeNodeOne);
    merge.appendChild(mergeNodeTwo);
    filter.appendChild(blur);
    filter.appendChild(merge);
    defs.appendChild(filter);
    pathEl.appendChild(defs);

    // create a container for poles/signs (behind the node buttons)
    let polesContainer = nodesEl.parentNode.querySelector('.story-map-poles');
    if (!polesContainer) {
      polesContainer = document.createElement('div');
      polesContainer.className = 'story-map-poles';
      nodesEl.parentNode.insertBefore(polesContainer, nodesEl);
    }
    polesContainer.innerHTML = '';

    for (let index = 0; index < world.levels.length; index += 1) {
      const level = world.levels[index];
      const point = points[index];
      if (!level || !point) continue;

      // create pole + sign element (visual only, no pointer events)
      const poleWrapper = document.createElement('div');
      poleWrapper.className = 'story-map-pole';
      // place the pole slightly lower so the sign overlaps the pathway instead of floating above it
      poleWrapper.style.left = `${point.x}%`;
      poleWrapper.style.top = `calc(${point.y}% + 40px)`;
      poleWrapper.dataset.index = String(index);
      poleWrapper.innerHTML = `
        <div class="story-map-sign" style="border-color: ${world.accent};">
          <div class="story-map-sign-number">${index + 1}</div>
          <div class="story-map-sign-caption">${level.title}</div>
        </div>
      `;
      polesContainer.appendChild(poleWrapper);

      // make the sign itself interactive: clicks/keyboard select the level
      const signEl = poleWrapper.querySelector('.story-map-sign');
      if (signEl) {
        signEl.setAttribute('role', 'button');
        signEl.tabIndex = 0;
        signEl.dataset.index = String(index);
        signEl.dataset.kind = level.kind;
        signEl.setAttribute('aria-label', `${world.label}, ${level.label}: ${level.title}`);

        if (level.kind === "start") {
          signEl.classList.add("is-start");
        }
        if (level.kind === "finale") {
          signEl.classList.add("is-finale");
        }
        if (level.kind === "checkpoint") {
          signEl.classList.add("is-checkpoint");
        }
        if (index === currentLevelIndex) {
          signEl.classList.add("is-selected");
        }
        if (currentWorldIndex === 0 && index === 0) {
          signEl.classList.add("is-playable");
        }

        signEl.addEventListener('click', function (e) {
          e.stopPropagation();
          // brief spin animation when clicked; select after the spin finishes so the rerender does not cancel it
          signEl.classList.remove('spin');
          void signEl.offsetWidth;
          signEl.classList.add('spin');
          signEl.addEventListener('animationend', function onAnim() {
            signEl.classList.remove('spin');
            selectLevel(index);
          }, { once: true });
        });

        signEl.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            signEl.click();
          }
        });
      }
    }

    const level = getCurrentLevel();
    if (level) {
      levelInfoEl.innerHTML = `
        <div class="story-level-info-label">${world.label}</div>
        <div class="story-level-info-title">${level.label}: ${level.title}</div>
        <div class="story-level-info-desc">${level.description}</div>
      `;
    }
  }

  function updateMapUi() {
    renderWorldSummary();
    renderMapBoard();
    refreshSelectionStatus();
  }

  function showChapterMenu() {
    currentView = "chapter";
    const chapterMenu = getEl("storyChapterMenu");
    const worldMenu = getEl("storyWorldMenu");
    if (chapterMenu) chapterMenu.style.display = "flex";
    if (worldMenu) worldMenu.style.display = "none";
    updateChapterUi();
  }

  function showWorldMenu() {
    currentView = "world";
    const chapterMenu = getEl("storyChapterMenu");
    const worldMenu = getEl("storyWorldMenu");
    if (chapterMenu) chapterMenu.style.display = "none";
    if (worldMenu) worldMenu.style.display = "flex";
    updateMapUi();
  }

  function selectWorld(index) {
    if (index < 0 || index >= worlds.length || index === currentWorldIndex) return;
    currentWorldIndex = index;
    const world = getCurrentWorld();
    if (world && currentLevelIndex >= world.levels.length) {
      currentLevelIndex = world.levels.length - 1;
    }
    saveStoryState();
    updateMapUi();
  }

  function selectLevel(index) {
    const world = getCurrentWorld();
    if (!world || index < 0 || index >= world.levels.length) return;
    currentLevelIndex = index;
    saveStoryState();
    updateMapUi();
  }

  function goToPreviousWorld() {
    if (currentWorldIndex <= 0) return;
    selectWorld(currentWorldIndex - 1);
  }

  function goToNextWorld() {
    if (currentWorldIndex >= worlds.length - 1) return;
    selectWorld(currentWorldIndex + 1);
  }

  function hideHudForStoryMenu() {
    for (let i = 0; i < hiddenHudIds.length; i += 1) {
      const id = hiddenHudIds[i];
      const el = getEl(id);
      if (!el) continue;
      if (!(id in hudDisplayCache)) {
        hudDisplayCache[id] = el.style.display;
      }
      el.style.display = "none";
    }
  }

  function restoreHudAfterStoryMenu() {
    for (let i = 0; i < hiddenHudIds.length; i += 1) {
      const id = hiddenHudIds[i];
      const el = getEl(id);
      if (!el) continue;
      if (id in hudDisplayCache) {
        el.style.display = hudDisplayCache[id];
      } else {
        el.style.display = "";
      }
      delete hudDisplayCache[id];
    }
  }

  async function open() {
    const storyMenu = getEl("storyModeMenu");
    const modeMenu = getEl("modeMenu");
    if (!storyMenu) {
      console.warn('Story Mode menu element not found');
      return;
    }

    await enterGameFullscreen();
    hideHudForStoryMenu();
    hideGameplayLayerForStoryMenu();
    if (modeMenu) {
      try {
        modeMenu.style.display = "none";
      } catch (e) {
        /* ignore style failures */
      }
    }
    try {
      storyMenu.style.display = "flex";
      storyMenu.setAttribute("aria-hidden", "false");
      showChapterMenu();
    } catch (err) {
      console.error('Failed to show Story Mode menu', err);
    }
  }

  async function close() {
    const storyMenu = getEl("storyModeMenu");
    const modeMenu = getEl("modeMenu");
    if (!storyMenu || !modeMenu) return;

    storyMenu.style.display = "none";
    storyMenu.setAttribute("aria-hidden", "true");
    restoreHudAfterStoryMenu();
    restoreGameplayLayerAfterStoryMenu();
    await exitGameFullscreen();
    modeMenu.style.display = "flex";
  }

  function init() {
    const chapterBackBtn = getEl("storyChapterBackBtn");
    const chapterStartBtn = getEl("storyChapterStartBtn");
    const chapterPrevBtn = getEl("storyChapterPrevBtn");
    const chapterNextBtn = getEl("storyChapterNextBtn");
    const worldBackBtn = getEl("storyWorldBackBtn");
    const worldPrevBtn = getEl("storyWorldPrevBtn");
    const worldNextBtn = getEl("storyWorldNextBtn");
    const worldStartBtn = getEl("storyWorldStartBtn");
    if (!chapterBackBtn || !chapterStartBtn || !chapterPrevBtn || !chapterNextBtn || !worldBackBtn || !worldPrevBtn || !worldNextBtn || !worldStartBtn) return;

    loadStoryState();
    showChapterMenu();

    chapterBackBtn.onclick = function () {
      close();
    };

    worldBackBtn.onclick = function () {
      showChapterMenu();
    };

    chapterPrevBtn.onclick = function () {
      if (currentView !== "chapter") return;
      if (currentChapterIndex <= 0) return;
      currentChapterIndex -= 1;
      updateChapterUi();
    };

    chapterNextBtn.onclick = function () {
      if (currentView !== "chapter") return;
      if (currentChapterIndex >= chapters.length - 1) return;
      currentChapterIndex += 1;
      updateChapterUi();
    };

    worldPrevBtn.onclick = function () {
      if (currentView !== "world") return;
      goToPreviousWorld();
    };

    worldNextBtn.onclick = function () {
      if (currentView !== "world") return;
      goToNextWorld();
    };

    chapterStartBtn.onclick = function () {
      const chapter = getCurrentChapter();
      if (!chapter || !chapter.playable) return;
      if (currentChapterIndex === 0) {
        showWorldMenu();
        return;
      }
      flashStoryStatus(`${chapter.label} is coming soon.`);
    };

    worldStartBtn.onclick = function () {
      if (currentWorldIndex === 0 && currentLevelIndex === 0) {
        startSelectedChapterOneLevel();
        return;
      }
      flashStoryStatus("That level is coming soon.");
    };
  }

  window.VRStoryModeMenu = {
    init,
    open,
    close,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
