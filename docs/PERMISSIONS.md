# Permissions

PlainText Guard uses a narrow permission set.

## storage

Used to save user settings from the popup.

Stored settings include:

- selected mode
- Strict ASCII toggle
- success toast preference

No copied text is stored.

## clipboardWrite

Used to write cleaned ASCII-safe text to the clipboard after a user copy action or after the user clicks Copy ASCII-safe.

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

The content script is limited to supported AI assistant sites. The extension does not run on arbitrary websites and does not monitor paste destinations.
