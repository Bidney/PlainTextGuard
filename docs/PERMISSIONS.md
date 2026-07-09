# Permissions

PlainText Guard uses a narrow permission set.

## storage

Used to save user settings from the popup.

Stored settings include:

- master on/off toggle
- per-site disabled list (hostnames only)
- paste guard toggle
- selected mode
- Strict ASCII toggle
- success toast preference

No copied text is stored.

## clipboardWrite

Used to write cleaned ASCII-safe text to the clipboard after a user copy action or after the user clicks Copy ASCII-safe.

## contextMenus

Used to show the Enabled and Enabled on this site checkboxes when the user right-clicks the toolbar icon. The menu appears only on the extension icon, not on page content.

The background service worker that manages this menu is event-driven. It reads only tab URLs of supported AI sites (to label the per-site toggle and badge), makes no network calls, and never reads page content or the clipboard.

## Permissions intentionally not used

PlainText Guard does not use:

- clipboardRead
- tabs
- history
- cookies
- webRequest
- scripting
- activeTab
- all_urls

## Host access

The content script is limited to supported AI assistant sites. The extension does not run on arbitrary websites and does not monitor where users paste text elsewhere.

The paste guard reads pasted text only from the paste event on supported AI sites. This is standard page-level event access and needs no extra permission; it is not background clipboard reading.
