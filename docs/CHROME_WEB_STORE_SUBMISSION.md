# Chrome Web Store Submission Notes

## Package to upload

Upload the ZIP created by:

```bash
npm run package:webstore
```

The generated file is:

```text
dist/plaintext-guard-webstore-0.1.2.zip
```

The ZIP has `manifest.json` at the root.

## Suggested distribution setting for beta

Use Private visibility for invite-only beta distribution.

Recommended setup:

```text
Visibility: Private
Access: Google Group or trusted testers
```

Use Unlisted only if anyone with the URL may install the extension.

## Single purpose

PlainText Guard helps users copy ASCII-safe text from supported AI assistant sites. It detects non-ASCII formatting characters and lets the user copy a cleaned version locally.

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

## Host access justification

The extension content script runs only on supported AI assistant sites so it can handle user-initiated copy actions from those pages.

It does not run on arbitrary websites and does not monitor paste destinations.

## Privacy practices answer draft

PlainText Guard processes selected text locally during a user-initiated copy action on supported AI assistant sites. It does not collect, store, transmit, sell, or share copied text. It stores only extension settings in Chrome storage. It does not use analytics, telemetry, advertising, or remote text processing.

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
