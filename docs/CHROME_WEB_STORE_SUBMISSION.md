# Chrome Web Store Submission Notes

## Package to upload

Upload the ZIP created by:

```bash
npm run package:webstore
```

The generated file is:

```text
dist/plaintext-guard-webstore-0.3.1.zip
```

The ZIP has `manifest.json` at the root.

## Suggested distribution setting

Use Public visibility for the Chrome Web Store launch.

Recommended setup:

```text
Visibility: Public
Regions: All supported regions
```

Use Unlisted only if a link-only release is deliberately preferred.

## Single purpose

PlainText Guard protects user-initiated text transfer on supported AI assistant sites. It cleans problematic formatting when users copy text and detects likely secrets before users paste them, with all analysis performed locally.

## Category

Recommended category:

```text
Productivity
```

Alternative:

```text
Developer Tools
```

## Permissions justification

### storage

Used to save extension settings:

- selected mode
- Strict ASCII toggle
- success toast preference

### clipboardWrite

Used to write the cleaned ASCII-safe version to the clipboard after a user-initiated copy action or after the user clicks Copy ASCII-safe.

The extension does not request `clipboardRead`.

### contextMenus

Used to provide master and per-site on/off controls when the user right-clicks the extension icon.

## Host access justification

The extension content script runs only on supported AI assistant sites so it can handle user-initiated copy actions from those pages.

It does not run on arbitrary websites and does not monitor paste destinations.

## Privacy practices answer draft

PlainText Guard processes selected text locally during a user-initiated copy action on supported AI assistant sites. It does not collect, store, transmit, sell, or share copied text. It stores only extension settings in Chrome storage. It does not use analytics, telemetry, advertising, or remote text processing.

The secret paste guard is off by default and handles pasted authentication information locally only after the user explicitly enables its clearly labeled popup toggle. The popup also includes an optional external donation link. It opens only after a user click, no features require payment, and the extension does not receive payment or personal information itself.

## Store listing links

Homepage URL:

```text
https://github.com/bidney/PlainTextGuard
```

Privacy policy URL:

```text
https://github.com/bidney/PlainTextGuard/blob/main/PRIVACY.md
```

Support URL:

```text
https://github.com/bidney/PlainTextGuard/issues
```
