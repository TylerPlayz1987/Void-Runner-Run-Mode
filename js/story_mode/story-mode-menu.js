(function () {
  const hiddenHudIds = ["ui-left", "ui-right", "speedRunTimer"];
  const hudDisplayCache = {};
  const chapters = [
    {
      label: "Chapter 1",
      title: "Into The Rift",
      description:
        "A strange force is tearing the void apart. Enter the rift and find the source.",
      playable: false,
      buttonText: "Coming Soon",
      loadingText: "Coming Soon",
    },
    {
      label: "Chapter 2",
      title: "???",
      description: "???",
      playable: false,
      buttonText: "Coming Soon",
      loadingText: "Coming Soon",
    },
    {
      label: "Chapter 3",
      title: "???",
      description: "???",
      playable: false,
      buttonText: "Coming Soon",
      loadingText: "Coming Soon",
    },
  ];
  let currentChapterIndex = 0;

  function getEl(id) {
    return document.getElementById(id);
  }

  function updateChapterUi() {
    const chapter = chapters[currentChapterIndex];
    const labelEl = getEl("storyChapterLabel");
    const titleEl = getEl("storyChapterTitle");
    const descEl = getEl("storyChapterDesc");
    const startBtn = getEl("storyStartBtn");
    const prevBtn = getEl("storyPrevChapterBtn");
    const nextBtn = getEl("storyNextChapterBtn");
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
  }

  function goToPreviousChapter() {
    if (currentChapterIndex <= 0) return;
    currentChapterIndex -= 1;
    updateChapterUi();
  }

  function goToNextChapter() {
    if (currentChapterIndex >= chapters.length - 1) return;
    currentChapterIndex += 1;
    updateChapterUi();
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
    const chapter = chapters[currentChapterIndex];
    if (!startBtn) return;

    const original = startBtn.textContent;
    startBtn.textContent = text;
    startBtn.disabled = true;

    window.setTimeout(function () {
      if (chapter && chapter.playable) {
        startBtn.textContent = original;
        startBtn.disabled = false;
      } else {
        updateChapterUi();
      }
    }, 1100);
  }

  function init() {
    const backBtn = getEl("storyBackBtn");
    const startBtn = getEl("storyStartBtn");
    const prevBtn = getEl("storyPrevChapterBtn");
    const nextBtn = getEl("storyNextChapterBtn");
    if (!backBtn || !startBtn || !prevBtn || !nextBtn) return;

    updateChapterUi();

    backBtn.onclick = function () {
      close();
    };

    prevBtn.onclick = function () {
      goToPreviousChapter();
    };

    nextBtn.onclick = function () {
      goToNextChapter();
    };

    startBtn.onclick = function () {
      const chapter = chapters[currentChapterIndex];
      if (!chapter) return;
      // Story chapter gameplay handoff will be added in next step.
      flashStoryStatus(chapter.loadingText);
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
