# Changelog

All notable changes to PlainText Guard are documented here.

## 0.3.0 - 2026-07-09

Secret paste guard and detection quality overhaul.

- Added the paste guard: pasting text that contains an API key, access token, JWT, or private key block on a supported AI site now shows a blocking dialog with Paste without secrets, Paste anyway, and Cancel. Detection uses vendor-anchored patterns (AWS, GitHub, Slack, Stripe, Google, OpenAI, Anthropic), validated JWT structure, PEM blocks, and context-gated entropy as a last resort. Everything runs locally.
- Lower-confidence matches warn without blocking the paste.
- Accented letters, other languages, currency symbols, and emoji are no longer treated as issues in Warn and Auto modes. They are only removed when Strict ASCII is on.
- Strict ASCII now transliterates accented letters instead of deleting them, so "cafe" with an accent stays "cafe".
- Added detection of hidden and deceptive characters: bidirectional controls, invisible operators, tag characters, and mixed-script lookalike letters inside Latin words. These are always flagged and the invisible ones are always stripped.
- Removed the review phrases that matched ordinary writing (single words such as "robust" and "leverage", and the from-X-to-Y pattern).
- The Auto mode toast now reports only characters that were actually changed.
- The warning panel shows a before/after preview with the changing characters highlighted.
- All in-page UI moved into a closed shadow root so page scripts and styles cannot read, spoof, or interfere with it. The dialog traps focus and supports dark mode, as does the popup.
- Added a keyboard shortcut (Alt+Shift+P by default) to toggle the extension.
- Added a CI workflow that validates the manifest, syntax-checks all scripts, runs the secret-detector regression gate, and builds the package.

## 0.2.0 - 2026-07-09

On/off toggles.

- Added a master on/off toggle, available by right-clicking the toolbar icon and in the popup.
- Added a per-site toggle, available in the same right-click menu and in the popup on supported sites.
- Added an OFF badge on the toolbar icon when the extension is disabled for the current site.
- Added a background service worker to manage the icon menu and badge. It is event-driven, makes no network calls, and never touches page or clipboard content.
- Added the contextMenus permission for the icon right-click menu.
- Hardened the popup: stored mode values are validated against the known mode list before use.
- Hardened the copy review panel: the copy buttons now ignore synthetic clicks from page scripts.

## 0.1.2 - 2026-06-13

Distribution package release.

- Added GitHub-ready documentation.
- Added privacy policy.
- Added Chrome Web Store submission notes.
- Added manual test plan.
- Added packaging scripts.
- Added store asset folder.
- Added homepage URL in the manifest.

## 0.1.1 - 2026-06-13

MVP copy behavior fix.

- Fixed Auto ASCII Copy so cleaned text is written reliably during copy.
- Added text/html clipboard output alongside text/plain.
- Added async clipboard write fallback.
- Improved Style Review display for review phrases.

## 0.1.0 - 2026-06-13

Initial MVP.

- Manifest V3 extension.
- Runs on supported AI assistant sites only.
- ASCII Warning mode.
- Auto ASCII Copy mode.
- Style Review mode.
- Safe replacement rules.
- Optional Strict ASCII mode.
- Popup settings.
