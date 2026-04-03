(function () {
  const hiddenHudIds = ["ui-left", "ui-right", "speedRunTimer"];
  const hudDisplayCache = {};

  function getEl(id) {
    return document.getElementById(id);
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

  function open() {
    const storyMenu = getEl("storyModeMenu");
    const modeMenu = getEl("modeMenu");
    if (!storyMenu || !modeMenu) return;

    hideHudForStoryMenu();
    modeMenu.style.display = "none";
    storyMenu.style.display = "flex";
    storyMenu.setAttribute("aria-hidden", "false");
  }

  function close() {
    const storyMenu = getEl("storyModeMenu");
    const modeMenu = getEl("modeMenu");
    if (!storyMenu || !modeMenu) return;

    storyMenu.style.display = "none";
    storyMenu.setAttribute("aria-hidden", "true");
    restoreHudAfterStoryMenu();
    modeMenu.style.display = "flex";
  }

  function flashStoryStatus(text) {
    const startBtn = getEl("storyStartBtn");
    if (!startBtn) return;

    const original = startBtn.textContent;
    startBtn.textContent = text;
    startBtn.disabled = true;

    window.setTimeout(function () {
      startBtn.textContent = original;
      startBtn.disabled = false;
    }, 1100);
  }

  function init() {
    const backBtn = getEl("storyBackBtn");
    const startBtn = getEl("storyStartBtn");
    if (!backBtn || !startBtn) return;

    backBtn.onclick = function () {
      close();
    };

    startBtn.onclick = function () {
      // Story world gameplay handoff will be added in next step.
      flashStoryStatus("World 1 loading soon");
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
