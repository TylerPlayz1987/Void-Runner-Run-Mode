(function () {
  const state = {
    running: false,
    rafId: 0,
  };

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInCubic(t) {
    return t * t * t;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function createClone(el, hostRect, className) {
    const rect = el.getBoundingClientRect();
    const clone = el.cloneNode(true);
    clone.removeAttribute("id");
    clone.classList.add("story-cutscene-clone");
    if (className) clone.classList.add(className);

    clone.style.left = rect.left - hostRect.left + rect.width / 2 + "px";
    clone.style.top = rect.top - hostRect.top + rect.height / 2 + "px";
    clone.style.width = rect.width + "px";
    clone.style.height = rect.height + "px";
    clone.style.minWidth = rect.width + "px";

    return {
      el: clone,
      startX: rect.left - hostRect.left + rect.width / 2,
      startY: rect.top - hostRect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    };
  }

  function clearAnimationFrame() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

  function start(options) {
    if (state.running) return false;

    const modeMenuEl = options && options.modeMenuEl;
    const storyBtnEl = options && options.storyBtnEl;
    const onComplete = options && options.onComplete;

    const container = document.getElementById("container");
    const overlay = document.getElementById("storyCutsceneOverlay");
    const blackHole = document.getElementById("storyCutsceneBlackHole");

    if (!container || !overlay || !blackHole || !modeMenuEl || !storyBtnEl) {
      return false;
    }

    state.running = true;
    clearAnimationFrame();

    overlay.style.display = "block";
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");

    const hostRect = container.getBoundingClientRect();
    const modeNodes = Array.from(modeMenuEl.querySelectorAll("h1, button"));
    const staticNodes = modeNodes.filter((n) => n !== storyBtnEl);

    const staticClones = [];
    for (let i = 0; i < staticNodes.length; i += 1) {
      const cloneData = createClone(staticNodes[i], hostRect, "story-sucked");
      staticClones.push(cloneData);
      overlay.appendChild(cloneData.el);
    }

    const storyClone = createClone(storyBtnEl, hostRect, "story-focus");
    overlay.appendChild(storyClone.el);

    modeMenuEl.classList.add("story-cutscene-hidden");

    const holeRect = blackHole.getBoundingClientRect();
    const holeX = holeRect.left - hostRect.left + holeRect.width / 2;
    const holeY = holeRect.top - hostRect.top + holeRect.height / 2;
    const centerX = hostRect.width / 2;
    const centerY = hostRect.height / 2;

    const staticPhase = staticClones.map(function () {
      return Math.random() * Math.PI * 2;
    });

    const staticDuration = 1600;
    const focusDuration = 1250;
    const totalDuration = 2400;
    const focusHoldAt = 1100;
    const startTime = performance.now();

    function finishCutscene() {
      clearAnimationFrame();

      for (let i = 0; i < staticClones.length; i += 1) {
        if (staticClones[i].el.parentNode === overlay) {
          overlay.removeChild(staticClones[i].el);
        }
      }
      if (storyClone.el.parentNode === overlay) {
        overlay.removeChild(storyClone.el);
      }

      modeMenuEl.classList.remove("story-cutscene-hidden");
      overlay.classList.remove("active");
      overlay.style.display = "none";
      overlay.setAttribute("aria-hidden", "true");
      state.running = false;

      if (typeof onComplete === "function") {
        onComplete();
      }
    }

    function frame(now) {
      const elapsed = now - startTime;
      const p = clamp01(elapsed / totalDuration);

      for (let i = 0; i < staticClones.length; i += 1) {
        const data = staticClones[i];
        const delay = i * 65;
        const localP = clamp01((elapsed - delay) / staticDuration);
        const pull = easeInCubic(localP);
        const swirl = (1 - localP) * 30;
        const theta = localP * 18 + staticPhase[i];
        const x = lerp(data.startX, holeX, pull) + Math.sin(theta) * swirl;
        const y = lerp(data.startY, holeY, pull) + Math.cos(theta * 0.85) * swirl * 0.7;
        const scale = Math.max(0.08, 1 - pull * 0.95);
        const opacity = Math.max(0, 1 - pull * 1.15);

        data.el.style.left = x + "px";
        data.el.style.top = y + "px";
        data.el.style.opacity = String(opacity);
        data.el.style.transform =
          "translate(-50%, -50%) scale(" +
          scale.toFixed(3) +
          ") rotate(" +
          (localP * 820).toFixed(1) +
          "deg)";
      }

      if (elapsed < focusHoldAt) {
        const holdP = clamp01(elapsed / focusHoldAt);
        const drift = 18 * Math.sin(holdP * 6.2);
        const x = lerp(storyClone.startX, storyClone.startX + (holeX - storyClone.startX) * 0.1, holdP) + drift;
        const y = lerp(storyClone.startY, storyClone.startY + (holeY - storyClone.startY) * 0.1, holdP * 0.8);
        const scale = lerp(1, 1.08, easeOutCubic(holdP));

        storyClone.el.style.left = x + "px";
        storyClone.el.style.top = y + "px";
        storyClone.el.style.opacity = "1";
        storyClone.el.style.transform =
          "translate(-50%, -50%) scale(" +
          scale.toFixed(3) +
          ")";
      } else {
        const zoomP = clamp01((elapsed - focusHoldAt) / focusDuration);
        const eased = easeInOutCubic(zoomP);
        const x = lerp(storyClone.startX + (holeX - storyClone.startX) * 0.1, centerX, eased);
        const y = lerp(storyClone.startY + (holeY - storyClone.startY) * 0.08, centerY, eased);
        const scale = lerp(1.08, 10.5, easeInCubic(zoomP));

        storyClone.el.style.left = x + "px";
        storyClone.el.style.top = y + "px";
        storyClone.el.style.opacity = "1";
        storyClone.el.style.transform =
          "translate(-50%, -50%) scale(" +
          scale.toFixed(3) +
          ")";
      }

      if (p >= 1) {
        finishCutscene();
        return;
      }

      state.rafId = requestAnimationFrame(frame);
    }

    state.rafId = requestAnimationFrame(frame);
    return true;
  }

  window.VRStoryModeCutscene = {
    start,
    isRunning: function () {
      return state.running;
    },
  };
})();
