(function () {
  "use strict";

  const DEFAULT_SETTINGS = {
    mode: "warn",
    strictAscii: false,
    showSuccessToast: true
  };

  const MODE_LABELS = {
    warn: "ASCII Warning",
    auto: "Auto ASCII Copy",
    review: "Style Review"
  };

  let settings = Object.assign({}, DEFAULT_SETTINGS);
  let activePanel = null;
  let activeBackdrop = null;
  let activeToast = null;
  let pendingCopy = null;

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
    document.documentElement.appendChild(activeToast);

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

    const replacement = finding.replacement === null
      ? "not replaced in safe mode"
      : `replace with ${JSON.stringify(finding.replacement)}`;

    return `${finding.count} x ${finding.label} (${finding.codePoint}), ${replacement}`;
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

  function showCopyChoice(originalText, cleanedText, analysis) {
    clearPanel();

    pendingCopy = { originalText, cleanedText };

    activeBackdrop = document.createElement("div");
    activeBackdrop.className = "ptg-panel-backdrop";
    activeBackdrop.addEventListener("click", clearPanel);

    activePanel = document.createElement("div");
    activePanel.className = "ptg-panel";
    activePanel.setAttribute("role", "dialog");
    activePanel.setAttribute("aria-label", "PlainText Guard copy review");

    const title = document.createElement("div");
    title.className = "ptg-title";
    title.textContent = settings.mode === "review"
      ? "PlainText Guard style review"
      : "PlainText Guard found non-ASCII text";
    activePanel.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.className = "ptg-subtitle";
    subtitle.textContent = settings.mode === "review"
      ? "Review copied text from this AI site before it reaches client work. These are not AI-detection claims."
      : "Choose whether to copy the ASCII-safe version or keep the original text.";
    activePanel.appendChild(subtitle);

    appendFindingsSection(activePanel, "ASCII formatting issues", analysis.replacementFindings, 10);
    appendFindingsSection(activePanel, "Other non-ASCII characters", analysis.unknownFindings, 10);

    if (settings.mode === "review") {
      appendFindingsSection(activePanel, "Review phrases", analysis.reviewFindings, 8);
    }

    if (!settings.strictAscii && analysis.unknownFindings.length > 0) {
      const note = document.createElement("div");
      note.className = "ptg-note";
      note.textContent = "Safe mode only replaces common punctuation and invisible formatting. Turn on Strict ASCII in the popup to remove all remaining non-ASCII characters.";
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
      : "Copy ASCII-safe";
    copyCleaned.addEventListener("click", () => {
      if (!pendingCopy) return;
      copyAndClose(pendingCopy.cleanedText, "Copied ASCII-safe text.");
    });
    actions.appendChild(copyCleaned);

    const copyOriginal = document.createElement("button");
    copyOriginal.className = "ptg-button";
    copyOriginal.textContent = "Copy original";
    copyOriginal.addEventListener("click", () => {
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

    document.documentElement.appendChild(activeBackdrop);
    document.documentElement.appendChild(activePanel);
    copyCleaned.focus();
  }

  function shouldHandleCopy() {
    if (!window.PlainTextGuardRules) return false;
    if (!settings || !settings.mode) return false;
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
          ? `Copied ASCII-safe text. Cleaned ${count} issue${count === 1 ? "" : "s"}.`
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
