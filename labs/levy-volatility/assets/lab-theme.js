(() => {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const key = "quant-theme";
  const settings = ["dark", "light", "system"];
  const labels = {
    dark: ["Dark", "Switch to dark theme", "深色", "切换至深色主题"],
    light: ["Light", "Switch to light theme", "浅色", "切换至浅色主题"],
    system: ["System", "Follow system theme", "系统", "跟随系统主题"],
  };
  let button;

  function storedSetting() {
    try {
      const saved = localStorage.getItem(key);
      if (settings.includes(saved)) return saved;
      const legacy = localStorage.getItem("theme");
      if (legacy === "light" || legacy === "dark") return legacy;
    } catch {
      // Keep the default when storage is unavailable.
    }
    return "dark";
  }

  function nextSetting() {
    const current = settings.indexOf(root.dataset.themeSetting);
    return settings[(current + 1) % settings.length];
  }

  function renderButton() {
    if (!button) return;
    const [english, englishLabel, chinese, chineseLabel] = labels[nextSetting()];
    const zh = root.lang.startsWith("zh");
    button.textContent = zh ? chinese : english;
    button.setAttribute("aria-label", zh ? chineseLabel : englishLabel);
    button.title = button.getAttribute("aria-label");
  }

  function apply(setting) {
    const theme = setting === "system" ? (system.matches ? "dark" : "light") : setting;
    const changed = theme !== root.dataset.theme;
    root.dataset.themeSetting = setting;
    root.dataset.theme = theme;
    meta.content = theme === "dark" ? "#101d2a" : "#eaf2f5";
    renderButton();
    if (changed) root.dispatchEvent(new Event("lab-theme-change"));
  }

  apply(storedSetting());
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === "theme" || event.key === null) apply(storedSetting());
  });
  system.addEventListener("change", () => {
    if (root.dataset.themeSetting === "system") apply("system");
  });
  document.addEventListener("DOMContentLoaded", () => {
    button = document.querySelector("[data-lab-theme]");
    button.addEventListener("click", () => {
      const setting = nextSetting();
      try {
        localStorage.setItem(key, setting);
      } catch {
        // The page can still change theme for this session.
      }
      apply(setting);
    });
    new MutationObserver(renderButton).observe(root, { attributeFilter: ["lang"] });
    renderButton();
  });
})();
