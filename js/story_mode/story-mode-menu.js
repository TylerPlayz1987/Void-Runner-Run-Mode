(function () {
  const hiddenHudIds = ["ui-left", "ui-right", "speedRunTimer"];
  const hudDisplayCache = {};
  const storyStateStorageKey = "vr_story_mode_map_state_v1";
  const worlds = [
    createWorld("World 1", "Rift Plains", "A torn open frontier built for the opening run.", "#55ff86", 12),
    createWorld("World 2", "Neon Tide", "City lights, moving platforms, and brighter hazards.", "#53c8ff", 10),
    createWorld("World 3", "Clockwork Summit", "Tight timing, shifting gears, and layered routes.", "#ffd166", 13),
    createWorld("World 4", "Moonfall Wilds", "Moonlit caves and longer routes through the dark.", "#c18dff", 11),
    createWorld("World 5", "Final Spiral", "The last stretch before the chapter one finale.", "#ff7b6b", 15),
  ];
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
        title: isFirst ? "Opening Route" : isLast ? "World Gate" : `Stage ${levelNumber}`,
        description: isFirst
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
    const labelEl = getEl("storyChapterLabel");
    const titleEl = getEl("storyChapterTitle");
    const descEl = getEl("storyChapterDesc");
    const countEl = getEl("storyWorldCount");
    const startBtn = getEl("storyStartBtn");
    const prevBtn = getEl("storyPrevChapterBtn");
    const nextBtn = getEl("storyNextChapterBtn");
    if (!world || !labelEl || !titleEl || !descEl || !countEl || !startBtn || !prevBtn || !nextBtn) {
      return;
    }

    labelEl.textContent = world.label;
    titleEl.textContent = world.title;
    descEl.textContent = world.description;
    countEl.textContent = `${world.levels.length} levels`;
    startBtn.textContent = "Preview Selected Level";
    prevBtn.disabled = currentWorldIndex <= 0;
    nextBtn.disabled = currentWorldIndex >= worlds.length - 1;

    const menu = getEl("storyModeMenu");
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

    for (let index = 0; index < world.levels.length; index += 1) {
      const level = world.levels[index];
      const point = points[index];
      if (!level || !point) continue;

      const nodeBtn = document.createElement("button");
      nodeBtn.type = "button";
      nodeBtn.className = "story-map-node";
      nodeBtn.style.left = `${point.x}%`;
      nodeBtn.style.top = `${point.y}%`;
      nodeBtn.style.borderColor = world.accent;
      nodeBtn.dataset.index = String(index);
      nodeBtn.dataset.kind = level.kind;
      nodeBtn.setAttribute("aria-label", `${world.label}, ${level.label}: ${level.title}`);
      nodeBtn.innerHTML = `
        <span class="story-map-node-number">${index + 1}</span>
        <span class="story-map-node-caption">${level.title}</span>
      `;

      if (level.kind === "start") {
        nodeBtn.classList.add("is-start");
      }
      if (level.kind === "finale") {
        nodeBtn.classList.add("is-finale");
      }
      if (level.kind === "checkpoint") {
        nodeBtn.classList.add("is-checkpoint");
      }
      if (index === currentLevelIndex) {
        nodeBtn.classList.add("is-selected");
      }

      nodeBtn.onclick = function () {
        selectLevel(index);
      };

      nodesEl.appendChild(nodeBtn);
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
    if (!storyMenu || !modeMenu) return;

    await enterGameFullscreen();
    hideHudForStoryMenu();
    modeMenu.style.display = "none";
    storyMenu.style.display = "flex";
    storyMenu.setAttribute("aria-hidden", "false");
  }

  async function close() {
    const storyMenu = getEl("storyModeMenu");
    const modeMenu = getEl("modeMenu");
    if (!storyMenu || !modeMenu) return;

    storyMenu.style.display = "none";
    storyMenu.setAttribute("aria-hidden", "true");
    restoreHudAfterStoryMenu();
    await exitGameFullscreen();
    modeMenu.style.display = "flex";
  }

  function init() {
    const backBtn = getEl("storyBackBtn");
    const startBtn = getEl("storyStartBtn");
    const prevBtn = getEl("storyPrevChapterBtn");
    const nextBtn = getEl("storyNextChapterBtn");
    if (!backBtn || !startBtn || !prevBtn || !nextBtn) return;

    loadStoryState();
    updateMapUi();

    backBtn.onclick = function () {
      close();
    };

    prevBtn.onclick = function () {
      goToPreviousWorld();
    };

    nextBtn.onclick = function () {
      goToNextWorld();
    };

    startBtn.onclick = function () {
      const label = getCurrentLevelLabel();
      if (!label) return;
      flashStoryStatus(`Preview only: ${label}`);
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
