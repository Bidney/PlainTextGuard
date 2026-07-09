(function () {
  "use strict";

  const DEFAULT_SETTINGS = {
    enabled: true,
    disabledSites: [],
    pasteGuard: true,
    mode: "warn",
    strictAscii: false,
    showSuccessToast: true
  };

  const VALID_MODES = ["warn", "auto", "review"];

  const statusEl = document.getElementById("status");
  const enabledGlobalEl = document.getElementById("enabledGlobal");
  const enabledSiteEl = document.getElementById("enabledSite");
  const siteToggleTitleEl = document.getElementById("siteToggleTitle");
  const siteToggleNoteEl = document.getElementById("siteToggleNote");
  const pasteGuardEl = document.getElementById("pasteGuard");
  const strictAsciiEl = document.getElementById("strictAscii");
  const showSuccessToastEl = document.getElementById("showSuccessToast");

  let currentHost = null;

  function setStatus(message) {
    statusEl.textContent = message;
    window.setTimeout(() => {
      if (statusEl.textContent === message) {
        statusEl.textContent = "";
      }
    }, 1600);
  }

  function getSupportedHosts() {
    const hosts = new Set();

    for (const script of chrome.runtime.getManifest().content_scripts || []) {
      for (const pattern of script.matches || []) {
        const match = /^https:\/\/([^/*]+)\//.exec(pattern);
        if (match) hosts.add(match[1]);
      }
    }

    return hosts;
  }

  function normalizeDisabledSites(value) {
    return Array.isArray(value) ? value : [];
  }

  function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      const mode = VALID_MODES.includes(settings.mode) ? settings.mode : DEFAULT_SETTINGS.mode;
      const modeEl = document.querySelector(`input[name="mode"][value="${mode}"]`);
      if (modeEl) modeEl.checked = true;

      enabledGlobalEl.checked = settings.enabled !== false;
      pasteGuardEl.checked = settings.pasteGuard !== false;
      strictAsciiEl.checked = Boolean(settings.strictAscii);
      showSuccessToastEl.checked = settings.showSuccessToast !== false;

      loadSiteToggle(normalizeDisabledSites(settings.disabledSites));
    });
  }

  function loadSiteToggle(disabledSites) {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = tabs && tabs[0] && tabs[0].url;
      let host = null;

      try {
        host = url ? new URL(url).hostname : null;
      } catch (error) {
        host = null;
      }

      if (!host || !getSupportedHosts().has(host)) {
        currentHost = null;
        enabledSiteEl.checked = false;
        enabledSiteEl.disabled = true;
        siteToggleTitleEl.textContent = "Enable on this site";
        siteToggleNoteEl.textContent = "Open a supported AI site to use this toggle.";
        return;
      }

      currentHost = host;
      enabledSiteEl.disabled = false;
      enabledSiteEl.checked = !disabledSites.includes(host);
      siteToggleTitleEl.textContent = `Enable on ${host}`;
      siteToggleNoteEl.textContent = "Turns PlainText Guard on or off for this site only.";
    });
  }

  function saveSetting(key, value) {
    chrome.storage.sync.set({ [key]: value }, () => {
      setStatus("Saved.");
    });
  }

  document.querySelectorAll('input[name="mode"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        saveSetting("mode", input.value);
      }
    });
  });

  enabledGlobalEl.addEventListener("change", () => {
    saveSetting("enabled", enabledGlobalEl.checked);
  });

  enabledSiteEl.addEventListener("change", () => {
    if (!currentHost) return;

    chrome.storage.sync.get({ disabledSites: [] }, (stored) => {
      const disabledSites = normalizeDisabledSites(stored.disabledSites).filter((site) => site !== currentHost);

      if (!enabledSiteEl.checked) {
        disabledSites.push(currentHost);
      }

      saveSetting("disabledSites", disabledSites);
    });
  });

  pasteGuardEl.addEventListener("change", () => {
    saveSetting("pasteGuard", pasteGuardEl.checked);
  });

  strictAsciiEl.addEventListener("change", () => {
    saveSetting("strictAscii", strictAsciiEl.checked);
  });

  showSuccessToastEl.addEventListener("change", () => {
    saveSetting("showSuccessToast", showSuccessToastEl.checked);
  });

  loadSettings();
})();
