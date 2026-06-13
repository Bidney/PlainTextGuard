(function () {
  "use strict";

  const DEFAULT_SETTINGS = {
    mode: "warn",
    strictAscii: false,
    showSuccessToast: true
  };

  const statusEl = document.getElementById("status");
  const strictAsciiEl = document.getElementById("strictAscii");
  const showSuccessToastEl = document.getElementById("showSuccessToast");

  function setStatus(message) {
    statusEl.textContent = message;
    window.setTimeout(() => {
      if (statusEl.textContent === message) {
        statusEl.textContent = "";
      }
    }, 1600);
  }

  function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      const mode = settings.mode || DEFAULT_SETTINGS.mode;
      const modeEl = document.querySelector(`input[name="mode"][value="${mode}"]`);
      if (modeEl) modeEl.checked = true;

      strictAsciiEl.checked = Boolean(settings.strictAscii);
      showSuccessToastEl.checked = settings.showSuccessToast !== false;
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

  strictAsciiEl.addEventListener("change", () => {
    saveSetting("strictAscii", strictAsciiEl.checked);
  });

  showSuccessToastEl.addEventListener("change", () => {
    saveSetting("showSuccessToast", showSuccessToastEl.checked);
  });

  loadSettings();
})();
