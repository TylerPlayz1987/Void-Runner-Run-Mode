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

  function easeInQuart(t) {
    return t * t * t * t;
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

    const suckDuration = 1900;
    const centerDuration = 520;
    const zoomDuration = 920;
    const centerStartAt = suckDuration;
    const zoomStartAt = centerStartAt + centerDuration;
    const totalDuration = zoomStartAt + zoomDuration;
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

      // Phase 1: all non-story menu elements are sucked in with accelerating speed.
      const suckPhaseP = clamp01(elapsed / suckDuration);
      const accelProgress = easeInQuart(suckPhaseP);

      if (suckPhaseP < 0.45) {
        blackHole.style.animationDuration = "0.95s";
      } else if (suckPhaseP < 0.8) {
        blackHole.style.animationDuration = "0.62s";
      } else {
        blackHole.style.animationDuration = "0.4s";
      }

      for (let i = 0; i < staticClones.length; i += 1) {
        const data = staticClones[i];
        const delay = i * 65;
        const localP = clamp01((elapsed - delay) / suckDuration);
        const pull = easeInQuart(localP);
        const swirl = (1 - localP) * (36 - accelProgress * 18);
        const theta = localP * (10 + accelProgress * 34) + staticPhase[i];
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
          (localP * (280 + accelProgress * 980)).toFixed(1) +
          "deg)";
      }

      // Phase 2: once everything else is gone, center the Story Mode button.
      if (elapsed < centerStartAt) {
        const holdP = clamp01(elapsed / centerStartAt);
        const drift = (1 - holdP) * 11 * Math.sin(holdP * 7.4);
        const x = lerp(storyClone.startX, storyClone.startX + (holeX - storyClone.startX) * 0.08, holdP) + drift;
        const y = lerp(storyClone.startY, storyClone.startY + (holeY - storyClone.startY) * 0.06, holdP * 0.85);
        const scale = lerp(1, 1.04, easeOutCubic(holdP));

        storyClone.el.style.left = x + "px";
        storyClone.el.style.top = y + "px";
        storyClone.el.style.opacity = "1";
        storyClone.el.style.transform =
          "translate(-50%, -50%) scale(" +
          scale.toFixed(3) +
          ")";
      } else if (elapsed < zoomStartAt) {
        const centerP = clamp01((elapsed - centerStartAt) / centerDuration);
        const eased = easeInOutCubic(centerP);
        const fromX = storyClone.startX + (holeX - storyClone.startX) * 0.08;
        const fromY = storyClone.startY + (holeY - storyClone.startY) * 0.06;
        const x = lerp(fromX, centerX, eased);
        const y = lerp(fromY, centerY, eased);
        const scale = lerp(1.04, 1.16, eased);

        storyClone.el.style.left = x + "px";
        storyClone.el.style.top = y + "px";
        storyClone.el.style.opacity = "1";
        storyClone.el.style.transform =
          "translate(-50%, -50%) scale(" +
          scale.toFixed(3) +
          ")";
      } else {
        // Phase 3: zoom only after the story button is centered.
        const zoomP = clamp01((elapsed - zoomStartAt) / zoomDuration);
        const fromScale = 1.16;
        const scale = lerp(fromScale, 10.5, easeInCubic(zoomP));

        storyClone.el.style.left = centerX + "px";
        storyClone.el.style.top = centerY + "px";
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
