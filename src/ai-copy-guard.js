(function () {
  "use strict";

  const DEFAULT_SETTINGS = {
    enabled: true,
    disabledSites: [],
    mode: "warn",
    strictAscii: false,
    showSuccessToast: true
  };

  const MODE_LABELS = {
    warn: "ASCII Warning",
    auto: "Auto ASCII Copy",
    review: "Style Review"
  };

  const PREVIEW_LIMIT = 200;

  // All UI lives in a closed shadow root so page scripts cannot read the
  // panel, restyle it through our class names, or reach the buttons.
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
      max-width: 360px;
      padding: 12px 14px;
      border: 1px solid #b8c0cc;
      border-radius: 10px;
      background: #ffffff;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
      font-size: 14px;
      line-height: 1.4;
    }

    .ptg-toast-success { border-color: #3f8f55; background: #edf8f0; }
    .ptg-toast-warn { border-color: #d2a200; background: #fff8dc; }

    .ptg-panel-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      background: rgba(0, 0, 0, 0.22);
    }

    .ptg-panel {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2147483647;
      width: 430px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 40px);
      overflow: auto;
      padding: 16px;
      border: 1px solid #aeb7c4;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
      font-size: 14px;
      line-height: 1.42;
    }

    .ptg-title { margin: 0 0 6px; font-size: 16px; font-weight: 700; }
    .ptg-subtitle { margin: 0 0 12px; color: #526071; }
    .ptg-section-title { margin: 12px 0 6px; font-size: 13px; font-weight: 700; }
    .ptg-list { margin: 6px 0 0; padding-left: 18px; }
    .ptg-list li { margin: 3px 0; }

    .ptg-note {
      margin-top: 10px;
      padding: 9px 10px;
      border-radius: 8px;
      background: #f2f5f8;
      color: #3b4654;
      font-size: 13px;
    }

    .ptg-preview {
      margin: 4px 0 0;
      padding: 8px 10px;
      border: 1px solid #d7dee8;
      border-radius: 8px;
      background: #f8fafc;
      font-family: Consolas, Menlo, monospace;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 96px;
      overflow: auto;
    }

    .ptg-preview-label { margin-top: 8px; font-size: 12px; font-weight: 700; color: #526071; }

    .ptg-hl {
      background: #ffe2a8;
      border-radius: 3px;
      outline: 1px solid #d2a200;
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
    .ptg-button-primary { border-color: #172033; background: #172033; color: #ffffff; }
    .ptg-button-primary:hover { background: #27344a; }
    .ptg-button-danger { border-color: #b0b5bc; color: #526071; }

    @media (prefers-color-scheme: dark) {
      .ptg-toast, .ptg-panel { color: #e6eaf0; background: #1d2532; border-color: #3a4557; }
      .ptg-toast-success { background: #17301f; border-color: #3f8f55; }
      .ptg-toast-warn { background: #33290d; border-color: #d2a200; }
      .ptg-subtitle, .ptg-preview-label { color: #9aa7b8; }
      .ptg-note { background: #26303f; color: #c2ccd9; }
      .ptg-preview { background: #161d28; border-color: #3a4557; }
      .ptg-hl { background: #7a5b00; outline-color: #d2a200; }
      .ptg-button { background: #26303f; color: #e6eaf0; border-color: #4b5769; }
      .ptg-button:hover { background: #313d4f; }
      .ptg-button-primary { background: #e6eaf0; color: #1d2532; border-color: #e6eaf0; }
      .ptg-button-primary:hover { background: #ccd5e0; }
      .ptg-button-danger { color: #9aa7b8; }
    }
  `;

  let settings = Object.assign({}, DEFAULT_SETTINGS);
  let uiRoot = null;
  let activePanel = null;
  let activeBackdrop = null;
  let activeToast = null;
  let pendingCopy = null;

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

  function getSelectedText() {
    const selection = window.getSelection ? window.getSelection() : null;
    if (!selection) return "";
    return selection.toString();
  }

  function removeToast() {
    if (activeToast) {
      activeToast.remove();
      activeToast = null;
    }
  }

  function showToast(message, kind) {
    removeToast();

    activeToast = document.createElement("div");
    activeToast.className = "ptg-toast " + (kind === "warn" ? "ptg-toast-warn" : "ptg-toast-success");
    activeToast.textContent = message;
    ensureUiRoot().appendChild(activeToast);

    window.setTimeout(removeToast, 2200);
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

    pendingCopy = null;
  }

  function groupedFindingText(finding) {
    if (finding.type === "review-phrase") {
      return finding.preview
        ? `${finding.count} x ${finding.label}: "${finding.preview}"`
        : `${finding.count} x ${finding.label}`;
    }

    let action;
    if (finding.replacement === null) {
      action = "kept in safe mode";
    } else if (finding.replacement === "") {
      action = "removed";
    } else {
      action = `replace with ${JSON.stringify(finding.replacement)}`;
    }

    return `${finding.count} x ${finding.label} (${finding.codePoint}), ${action}`;
  }

  function appendFindingsSection(parent, title, findings, limit) {
    if (!findings || findings.length === 0) return;

    const sectionTitle = document.createElement("div");
    sectionTitle.className = "ptg-section-title";
    sectionTitle.textContent = title;
    parent.appendChild(sectionTitle);

    const list = document.createElement("ul");
    list.className = "ptg-list";

    findings.slice(0, limit || 10).forEach((finding) => {
      const item = document.createElement("li");
      item.textContent = groupedFindingText(finding);
      list.appendChild(item);
    });

    if (findings.length > (limit || 10)) {
      const item = document.createElement("li");
      item.textContent = `and ${findings.length - (limit || 10)} more item types`;
      list.appendChild(item);
    }

    parent.appendChild(list);
  }

  // Before/after preview with the characters that will change highlighted.
  function appendPreviewSection(parent, originalText, cleanedText, analysis) {
    const changingChars = new Set();

    for (const finding of analysis.replacementFindings.concat(analysis.suspiciousFindings)) {
      changingChars.add(finding.char);
    }

    if (settings.strictAscii) {
      for (const finding of analysis.unknownFindings) {
        changingChars.add(finding.char);
      }
    }

    if (changingChars.size === 0) return;

    const beforeLabel = document.createElement("div");
    beforeLabel.className = "ptg-preview-label";
    beforeLabel.textContent = originalText.length > PREVIEW_LIMIT
      ? `Before (first ${PREVIEW_LIMIT} characters, changes highlighted)`
      : "Before (changes highlighted)";
    parent.appendChild(beforeLabel);

    const before = document.createElement("div");
    before.className = "ptg-preview";

    let shown = 0;
    let run = "";

    const flushRun = () => {
      if (run) {
        before.appendChild(document.createTextNode(run));
        run = "";
      }
    };

    for (const char of originalText) {
      if (shown >= PREVIEW_LIMIT) break;
      shown += 1;

      if (changingChars.has(char)) {
        flushRun();
        const mark = document.createElement("span");
        mark.className = "ptg-hl";
        // Make invisible characters visible in the preview.
        mark.textContent = /\s/.test(char) ? "·" : char;
        mark.title = "U+" + char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
        before.appendChild(mark);
      } else {
        run += char;
      }
    }
    flushRun();
    parent.appendChild(before);

    const afterLabel = document.createElement("div");
    afterLabel.className = "ptg-preview-label";
    afterLabel.textContent = "After";
    parent.appendChild(afterLabel);

    const after = document.createElement("div");
    after.className = "ptg-preview";
    after.textContent = cleanedText.slice(0, PREVIEW_LIMIT);
    parent.appendChild(after);
  }

  async function writeToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.left = "-1000px";
    document.documentElement.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const copied = document.execCommand("copy");
      if (!copied) {
        throw new Error("document.execCommand('copy') returned false");
      }
    } finally {
      textarea.remove();
    }
  }

  async function copyAndClose(text, successMessage) {
    try {
      await writeToClipboard(text);
      clearPanel();
      showToast(successMessage, "success");
    } catch (error) {
      console.warn("PlainText Guard could not write to clipboard.", error);
      showToast("PlainText Guard could not write to the clipboard. Try copying again.", "warn");
    }
  }

  function htmlEscape(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br>");
  }

  function writeCleanedTextToCopyEvent(event, cleanedText) {
    if (!event || !event.clipboardData) return false;

    try {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      // Some rich editors prefer text/html over text/plain during paste.
      // Clear both and set both so the cleaned text wins consistently.
      event.clipboardData.clearData();
      event.clipboardData.setData("text/plain", cleanedText);
      event.clipboardData.setData("text/html", htmlEscape(cleanedText));
      return true;
    } catch (error) {
      console.warn("PlainText Guard could not write cleaned text to copy event.", error);
      return false;
    }
  }

  function verifyClipboardWithAsyncFallback(cleanedText) {
    // Event clipboardData should be enough, but some AI sites also run their
    // own copy handlers. This fallback gives our cleaned text the final write.
    // It does not read from the clipboard.
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") return;

    window.setTimeout(() => {
      navigator.clipboard.writeText(cleanedText).catch((error) => {
        console.warn("PlainText Guard async clipboard fallback failed.", error);
      });
    }, 0);
  }

  function trapFocus(panel, buttons) {
    panel.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;

      const enabled = buttons.filter((button) => !button.disabled);
      if (enabled.length === 0) return;

      const current = enabled.indexOf(uiRoot.activeElement);
      let next;

      if (event.shiftKey) {
        next = current <= 0 ? enabled.length - 1 : current - 1;
      } else {
        next = current === -1 || current === enabled.length - 1 ? 0 : current + 1;
      }

      event.preventDefault();
      enabled[next].focus();
    });
  }

  function showCopyChoice(originalText, cleanedText, analysis) {
    clearPanel();

    pendingCopy = { originalText, cleanedText };
    const root = ensureUiRoot();

    activeBackdrop = document.createElement("div");
    activeBackdrop.className = "ptg-panel-backdrop";
    activeBackdrop.addEventListener("click", clearPanel);

    activePanel = document.createElement("div");
    activePanel.className = "ptg-panel";
    activePanel.setAttribute("role", "dialog");
    activePanel.setAttribute("aria-modal", "true");
    activePanel.setAttribute("aria-label", "PlainText Guard copy review");

    const title = document.createElement("div");
    title.className = "ptg-title";
    title.textContent = settings.mode === "review"
      ? "PlainText Guard style review"
      : "PlainText Guard found formatting issues";
    activePanel.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.className = "ptg-subtitle";
    subtitle.textContent = settings.mode === "review"
      ? "Review copied text from this AI site before it reaches client work. These are not AI-detection claims."
      : "Choose whether to copy the cleaned version or keep the original text.";
    activePanel.appendChild(subtitle);

    appendFindingsSection(activePanel, "ASCII formatting issues", analysis.replacementFindings, 10);
    appendFindingsSection(activePanel, "Hidden or deceptive characters", analysis.suspiciousFindings, 10);

    if (analysis.unknownFindings.length > 0) {
      appendFindingsSection(
        activePanel,
        settings.strictAscii ? "Other non-ASCII characters (removed in Strict ASCII)" : "Other non-ASCII characters (kept)",
        analysis.unknownFindings,
        10
      );
    }

    if (settings.mode === "review") {
      appendFindingsSection(activePanel, "Review phrases", analysis.reviewFindings, 8);
    }

    appendPreviewSection(activePanel, originalText, cleanedText, analysis);

    if (!settings.strictAscii && analysis.unknownFindings.length > 0) {
      const note = document.createElement("div");
      note.className = "ptg-note";
      note.textContent = "Accents, other languages, and emoji are kept as-is. Turn on Strict ASCII in the popup to transliterate accents and remove the rest.";
      activePanel.appendChild(note);
    }

    if (settings.mode === "review" && analysis.reviewFindings.length > 0) {
      const note = document.createElement("div");
      note.className = "ptg-note";
      note.textContent = "Review phrases are only style hints. They do not prove AI authorship.";
      activePanel.appendChild(note);
    }

    const actions = document.createElement("div");
    actions.className = "ptg-actions";

    const copyCleaned = document.createElement("button");
    copyCleaned.className = "ptg-button ptg-button-primary";
    copyCleaned.textContent = settings.mode === "review" && !analysis.hasAsciiIssues
      ? "Copy text"
      : "Copy cleaned";
    copyCleaned.addEventListener("click", (clickEvent) => {
      // Ignore synthetic clicks from page scripts; only real user input may copy.
      if (!clickEvent.isTrusted) return;
      if (!pendingCopy) return;
      copyAndClose(pendingCopy.cleanedText, "Copied cleaned text.");
    });
    actions.appendChild(copyCleaned);

    const copyOriginal = document.createElement("button");
    copyOriginal.className = "ptg-button";
    copyOriginal.textContent = "Copy original";
    copyOriginal.addEventListener("click", (clickEvent) => {
      if (!clickEvent.isTrusted) return;
      if (!pendingCopy) return;
      copyAndClose(pendingCopy.originalText, "Copied original text.");
    });
    actions.appendChild(copyOriginal);

    const cancel = document.createElement("button");
    cancel.className = "ptg-button ptg-button-danger";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", clearPanel);
    actions.appendChild(cancel);

    activePanel.appendChild(actions);

    const footnote = document.createElement("div");
    footnote.className = "ptg-note";
    footnote.textContent = `Mode: ${MODE_LABELS[settings.mode] || "PlainText Guard"}. Text is processed locally and not stored.`;
    activePanel.appendChild(footnote);

    trapFocus(activePanel, [copyCleaned, copyOriginal, cancel]);

    root.appendChild(activeBackdrop);
    root.appendChild(activePanel);
    copyCleaned.focus();
  }

  function isEnabledHere() {
    if (!settings || settings.enabled === false) return false;

    const disabledSites = Array.isArray(settings.disabledSites) ? settings.disabledSites : [];
    return !disabledSites.includes(window.location.hostname);
  }

  function shouldHandleCopy() {
    if (!window.PlainTextGuardRules) return false;
    if (!settings || !settings.mode) return false;
    if (!isEnabledHere()) return false;
    return ["warn", "auto", "review"].includes(settings.mode);
  }

  function handleCopy(event) {
    if (!shouldHandleCopy()) return;

    const selectedText = getSelectedText();
    if (!selectedText || !selectedText.trim()) return;

    const includeReviewPhrases = settings.mode === "review";
    const analysis = window.PlainTextGuardRules.analyzeText(selectedText, {
      strictAscii: settings.strictAscii,
      includeReviewPhrases
    });

    if (!analysis.hasIssues) return;

    const cleanedText = window.PlainTextGuardRules.cleanText(selectedText, {
      strictAscii: settings.strictAscii
    });

    if (settings.mode === "auto") {
      if (!analysis.hasAsciiIssues) return;

      const wroteToEvent = writeCleanedTextToCopyEvent(event, cleanedText);
      verifyClipboardWithAsyncFallback(cleanedText);

      if (settings.showSuccessToast) {
        const count = analysis.totalAsciiIssueCount;
        const message = wroteToEvent
          ? `Copied cleaned text. Fixed ${count} character${count === 1 ? "" : "s"}.`
          : "PlainText Guard could not modify this copy event. Try ASCII Warning mode.";
        showToast(message, wroteToEvent ? "success" : "warn");
      }

      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    showCopyChoice(selectedText, cleanedText, analysis);
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      clearPanel();
    }
  }

  loadSettings();
  listenForSettingChanges();

  document.addEventListener("copy", handleCopy, true);
  document.addEventListener("keydown", handleKeydown, true);
})();
