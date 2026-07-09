(function () {
  "use strict";

  const DEFAULT_SETTINGS = {
    enabled: true,
    disabledSites: [],
    pasteGuard: true
  };

  const MIN_SCAN_LENGTH = 12;

  const UI_CSS = `
    :host { all: initial; }

    .ptg-toast,
    .ptg-panel {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
      color: #172033;
    }

    .ptg-toast {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483647;
      max-width: 380px;
      padding: 12px 14px;
      border: 1px solid #d2a200;
      border-radius: 10px;
      background: #fff8dc;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
      font-size: 14px;
      line-height: 1.4;
    }

    .ptg-panel-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      background: rgba(0, 0, 0, 0.3);
    }

    .ptg-panel {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 2147483647;
      width: 460px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 40px);
      overflow: auto;
      padding: 16px;
      border: 2px solid #b3261e;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.35);
      font-size: 14px;
      line-height: 1.42;
    }

    .ptg-title { margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #b3261e; }
    .ptg-subtitle { margin: 0 0 12px; color: #526071; }
    .ptg-list { margin: 6px 0 0; padding-left: 18px; }
    .ptg-list li { margin: 4px 0; }
    .ptg-mono { font-family: Consolas, Menlo, monospace; font-size: 12px; }

    .ptg-note {
      margin-top: 10px;
      padding: 9px 10px;
      border-radius: 8px;
      background: #f2f5f8;
      color: #3b4654;
      font-size: 13px;
    }

    .ptg-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }

    .ptg-button {
      border: 1px solid #9aa4b2;
      border-radius: 8px;
      padding: 8px 11px;
      background: #ffffff;
      color: #172033;
      cursor: pointer;
      font-size: 13px;
    }

    .ptg-button:hover { background: #f3f6fa; }
    .ptg-button:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
    .ptg-button-primary { border-color: #14532d; background: #14532d; color: #ffffff; }
    .ptg-button-primary:hover { background: #1c6b3a; }
    .ptg-button-danger { border-color: #b3261e; color: #b3261e; }
    .ptg-button-danger:hover { background: #fdf1f0; }

    @media (prefers-color-scheme: dark) {
      .ptg-toast { background: #33290d; border-color: #d2a200; color: #e6eaf0; }
      .ptg-panel { color: #e6eaf0; background: #1d2532; }
      .ptg-subtitle { color: #9aa7b8; }
      .ptg-note { background: #26303f; color: #c2ccd9; }
      .ptg-button { background: #26303f; color: #e6eaf0; border-color: #4b5769; }
      .ptg-button:hover { background: #313d4f; }
      .ptg-button-primary { background: #22c55e; color: #06230f; border-color: #22c55e; }
      .ptg-button-danger { border-color: #f87171; color: #f87171; }
    }
  `;

  let settings = Object.assign({}, DEFAULT_SETTINGS);
  let uiRoot = null;
  let activePanel = null;
  let activeBackdrop = null;
  let activeToast = null;
  let pendingPaste = null;

  function ensureUiRoot() {
    if (uiRoot) return uiRoot;

    const host = document.createElement("div");
    host.style.all = "initial";
    uiRoot = host.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = UI_CSS;
    uiRoot.appendChild(style);

    document.documentElement.appendChild(host);
    return uiRoot;
  }

  function loadSettings() {
    if (!chrome || !chrome.storage || !chrome.storage.sync) return;

    chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
      settings = Object.assign({}, DEFAULT_SETTINGS, stored || {});
    });
  }

  function listenForSettingChanges() {
    if (!chrome || !chrome.storage || !chrome.storage.onChanged) return;

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync") return;

      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        if (changes[key]) {
          settings[key] = changes[key].newValue;
        }
      }
    });
  }

  function removeToast() {
    if (activeToast) {
      activeToast.remove();
      activeToast = null;
    }
  }

  function showToast(message) {
    removeToast();

    activeToast = document.createElement("div");
    activeToast.className = "ptg-toast";
    activeToast.textContent = message;
    ensureUiRoot().appendChild(activeToast);

    window.setTimeout(removeToast, 5000);
  }

  function clearPanel() {
    if (activePanel) {
      activePanel.remove();
      activePanel = null;
    }

    if (activeBackdrop) {
      activeBackdrop.remove();
      activeBackdrop = null;
    }

    pendingPaste = null;
  }

  function redactText(text, findings) {
    // Replace from the end so earlier indices stay valid.
    let result = text;
    const sorted = findings.slice().sort((a, b) => b.index - a.index);

    for (const finding of sorted) {
      result =
        result.slice(0, finding.index) +
        "[REDACTED " + finding.label + "]" +
        result.slice(finding.index + finding.raw.length);
    }

    return result;
  }

  function insertIntoTarget(target, text) {
    const el = target && target.isConnected ? target : document.activeElement;

    if (el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && typeof el.setRangeText === "function"))) {
      el.focus();
      const start = el.selectionStart === null ? el.value.length : el.selectionStart;
      const end = el.selectionEnd === null ? el.value.length : el.selectionEnd;
      el.setRangeText(text, start, end, "end");
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      return true;
    }

    if (el && typeof el.focus === "function") {
      el.focus();
    }

    // Works for contenteditable editors (ProseMirror, Lexical, etc.).
    try {
      return document.execCommand("insertText", false, text);
    } catch (error) {
      return false;
    }
  }

  function finishPaste(text) {
    const target = pendingPaste ? pendingPaste.target : null;
    clearPanel();

    const inserted = insertIntoTarget(target, text);
    if (!inserted) {
      showToast("PlainText Guard could not insert the text automatically. Paste again to insert it.");
    }
  }

  function trapFocus(panel, buttons) {
    panel.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;

      const current = buttons.indexOf(uiRoot.activeElement);
      let next;

      if (event.shiftKey) {
        next = current <= 0 ? buttons.length - 1 : current - 1;
      } else {
        next = current === -1 || current === buttons.length - 1 ? 0 : current + 1;
      }

      event.preventDefault();
      buttons[next].focus();
    });
  }

  function showBlockPanel(text, scan, target) {
    clearPanel();

    pendingPaste = { text, target };
    const root = ensureUiRoot();

    activeBackdrop = document.createElement("div");
    activeBackdrop.className = "ptg-panel-backdrop";
    activeBackdrop.addEventListener("click", clearPanel);

    activePanel = document.createElement("div");
    activePanel.className = "ptg-panel";
    activePanel.setAttribute("role", "alertdialog");
    activePanel.setAttribute("aria-modal", "true");
    activePanel.setAttribute("aria-label", "PlainText Guard blocked a possible secret");

    const title = document.createElement("div");
    title.className = "ptg-title";
    title.textContent = "Paste blocked: possible secret detected";
    activePanel.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.className = "ptg-subtitle";
    subtitle.textContent = "The pasted text looks like it contains credentials. Nothing has been sent anywhere; detection ran locally.";
    activePanel.appendChild(subtitle);

    const list = document.createElement("ul");
    list.className = "ptg-list";

    scan.findings.slice(0, 8).forEach((finding) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = finding.label + (finding.confidence === "medium" ? " (possible)" : "") + ": ";
      const preview = document.createElement("span");
      preview.className = "ptg-mono";
      preview.textContent = finding.preview;
      item.appendChild(label);
      item.appendChild(preview);
      list.appendChild(item);
    });

    if (scan.findings.length > 8) {
      const item = document.createElement("li");
      item.textContent = `and ${scan.findings.length - 8} more`;
      list.appendChild(item);
    }

    activePanel.appendChild(list);

    const actions = document.createElement("div");
    actions.className = "ptg-actions";

    const pasteRedacted = document.createElement("button");
    pasteRedacted.className = "ptg-button ptg-button-primary";
    pasteRedacted.textContent = "Paste without secrets";
    pasteRedacted.addEventListener("click", (clickEvent) => {
      // Ignore synthetic clicks from page scripts.
      if (!clickEvent.isTrusted) return;
      if (!pendingPaste) return;
      finishPaste(redactText(pendingPaste.text, scan.findings));
    });
    actions.appendChild(pasteRedacted);

    const pasteAnyway = document.createElement("button");
    pasteAnyway.className = "ptg-button ptg-button-danger";
    pasteAnyway.textContent = "Paste anyway";
    pasteAnyway.addEventListener("click", (clickEvent) => {
      if (!clickEvent.isTrusted) return;
      if (!pendingPaste) return;
      finishPaste(pendingPaste.text);
    });
    actions.appendChild(pasteAnyway);

    const cancel = document.createElement("button");
    cancel.className = "ptg-button";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", clearPanel);
    actions.appendChild(cancel);

    activePanel.appendChild(actions);

    const footnote = document.createElement("div");
    footnote.className = "ptg-note";
    footnote.textContent = "Secret detection runs locally and can be turned off in the popup (Paste guard).";
    activePanel.appendChild(footnote);

    trapFocus(activePanel, [pasteRedacted, pasteAnyway, cancel]);

    root.appendChild(activeBackdrop);
    root.appendChild(activePanel);
    pasteRedacted.focus();
  }

  function isEnabledHere() {
    if (!settings || settings.enabled === false) return false;
    if (settings.pasteGuard === false) return false;

    const disabledSites = Array.isArray(settings.disabledSites) ? settings.disabledSites : [];
    return !disabledSites.includes(window.location.hostname);
  }

  function handlePaste(event) {
    if (!window.PlainTextGuardSecretRules) return;
    if (!isEnabledHere()) return;
    if (!event.clipboardData) return;

    const text = event.clipboardData.getData("text/plain");
    if (!text || text.length < MIN_SCAN_LENGTH) return;

    const scan = window.PlainTextGuardSecretRules.scanForSecrets(text);
    if (scan.findings.length === 0) return;

    if (scan.hasHighConfidence) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showBlockPanel(text, scan, event.target);
      return;
    }

    // Medium confidence only: let the paste through, warn without blocking.
    const count = scan.mediumCount;
    showToast(
      `PlainText Guard: the pasted text contains ${count === 1 ? "a string that looks" : count + " strings that look"} like a credential. Review before sending.`
    );
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      clearPanel();
    }
  }

  loadSettings();
  listenForSettingChanges();

  document.addEventListener("paste", handlePaste, true);
  document.addEventListener("keydown", handleKeydown, true);
})();
