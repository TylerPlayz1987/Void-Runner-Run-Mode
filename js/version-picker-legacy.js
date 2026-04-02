// Floating version picker for legacy version pages.
(function () {
  if (document.getElementById("versionPickerBtn")) return;

  const data = window.VR_VERSION_DATA || {};
  const versions = Array.isArray(data.versions) ? data.versions : [];
  if (!versions.length) return;

  const pathName = window.location.pathname.replace(/\\/g, "/");
  const isInLegacyDir = /\/(legacy_versions|version)\//.test(pathName);

  function normalizedPath(input) {
    if (!input) return "";
    const adjusted = adjustedTarget(input);
    return new URL(adjusted, window.location.href).pathname;
  }

  function adjustedTarget(path) {
    if (typeof path !== "string") return "";
    if (/^(https?:)?\/\//.test(path) || path.startsWith("/")) return path;
    if (isInLegacyDir) {
      if (path === "./") return "../index.html";
      if (path.startsWith("legacy_versions/") || path.startsWith("version/")) {
        return `../${path}`;
      }
    }
    return path;
  }

  const currentByPath = versions.find((v) => {
    if (!v || typeof v.path !== "string") return false;
    return normalizedPath(v.path) === pathName;
  });

  const currentOption = currentByPath || versions.find((v) => v && v.current) || versions[0];
  const currentLabel =
    currentOption && typeof currentOption.label === "string"
      ? currentOption.label.replace(" (Current)", "")
      : data.currentVersion || "Version";

  const style = document.createElement("style");
  style.textContent = `
    #versionPickerBtn {
      position: fixed;
      right: 10px;
      bottom: 10px;
      width: auto;
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 3px;
      border: 1px solid #777;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      z-index: 1000;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-weight: bold;
    }
    #versionPickerBtn:hover {
      border-color: #0ff;
      color: #0ff;
    }
    #versionPickerMenu {
      position: fixed;
      right: 10px;
      bottom: 40px;
      width: 250px;
      max-width: calc(100vw - 20px);
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid #0aa;
      box-shadow: 0 0 14px rgba(0, 170, 170, 0.35);
      color: #0f0;
      padding: 8px;
      z-index: 1001;
      display: none;
      flex-direction: column;
      gap: 8px;
      font-family: 'Courier New', monospace;
    }
    #versionPickerHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    #versionPickerTitle {
      font-size: 12px;
      letter-spacing: 1px;
    }
    #versionPickerClose {
      width: auto;
      min-width: 0;
      padding: 4px 8px;
      border-radius: 3px;
      border: none;
      background: #444;
      color: #fff;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
    }
    #versionPickerList {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 180px;
      overflow-y: auto;
    }
    .version-option-btn {
      width: 100%;
      text-align: left;
      padding: 7px 8px;
      font-size: 12px;
      border-radius: 3px;
      border: 1px solid #0f0;
      color: #0f0;
      background: #111;
      font-family: inherit;
      cursor: pointer;
    }
    .version-option-btn:hover {
      background: #0f0;
      color: #000;
    }
    .version-option-btn.current {
      border-color: #777;
      color: #aaa;
      background: #1a1a1a;
    }
  `;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.id = "versionPickerBtn";
  button.type = "button";
  button.textContent = currentLabel;
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-expanded", "false");

  const menu = document.createElement("div");
  menu.id = "versionPickerMenu";
  menu.setAttribute("role", "dialog");
  menu.setAttribute("aria-label", "Game versions");

  const header = document.createElement("div");
  header.id = "versionPickerHeader";

  const title = document.createElement("span");
  title.id = "versionPickerTitle";
  title.textContent = `Choose Version (${currentLabel})`;

  const closeBtn = document.createElement("button");
  closeBtn.id = "versionPickerClose";
  closeBtn.type = "button";
  closeBtn.textContent = "X";

  const list = document.createElement("div");
  list.id = "versionPickerList";

  header.appendChild(title);
  header.appendChild(closeBtn);
  menu.appendChild(header);
  menu.appendChild(list);

  function closeMenu() {
    menu.style.display = "none";
    button.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    menu.style.display = "flex";
    button.setAttribute("aria-expanded", "true");
  }

  versions.forEach((option) => {
    if (!option || typeof option.label !== "string" || typeof option.path !== "string") return;

    const targetPath = adjustedTarget(option.path);
    const isCurrent = normalizedPath(option.path) === pathName;

    const item = document.createElement("button");
    item.type = "button";
    item.className = "version-option-btn";
    if (isCurrent) item.classList.add("current");
    item.textContent = isCurrent
      ? `${option.label.replace(" (Current)", "")} - Playing`
      : option.label.replace(" (Current)", "");

    item.onclick = function () {
      if (isCurrent) {
        closeMenu();
        return;
      }
      window.location.href = targetPath;
    };

    list.appendChild(item);
  });

  document.body.appendChild(button);
  document.body.appendChild(menu);

  button.addEventListener("click", function (event) {
    event.stopPropagation();
    if (menu.style.display === "flex") {
      closeMenu();
    } else {
      openMenu();
    }
  });

  closeBtn.addEventListener("click", closeMenu);
  menu.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  document.addEventListener("click", closeMenu);
  window.addEventListener("keydown", function (event) {
    if (event.code === "Escape" && menu.style.display === "flex") {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeMenu();
    }
  }, true);
})();
