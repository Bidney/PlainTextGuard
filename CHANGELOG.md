# Changelog

All notable changes to PlainText Guard are documented here.

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
