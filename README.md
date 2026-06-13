# PlainText Guard

PlainText Guard is a privacy-first Chrome extension for copying ASCII-safe text from supported AI assistant sites.

It helps QA engineers, technical writers, developers, finance-modeling workers, and delivery teams avoid non-ASCII formatting problems in client-ready text. It detects and cleans smart quotes, em dashes, en dashes, ellipses, non-breaking spaces, zero-width characters, bullets, arrows, multiplication signs, and similar characters.

PlainText Guard is not an AI detector and is not positioned as a tool to hide AI use. It is a formatting, compliance, and plain-text hygiene tool.

## Current status

Version: 0.1.2

This is an MVP release intended for invite-only beta distribution through the Chrome Web Store or local unpacked testing.

## Supported source sites

PlainText Guard currently runs only on supported AI assistant sites:

- ChatGPT
- Claude
- Gemini
- DeepSeek Chat
- Perplexity
- Poe
- Microsoft Copilot
- Grok
- You.com
- Hugging Face Chat

It does not run on paste destinations such as Gmail, Jira, GitHub, Azure DevOps, client portals, or arbitrary websites.

## Core behavior

PlainText Guard works at copy time on supported AI sites:

1. The user selects text on a supported AI site.
2. The user copies the selected text.
3. PlainText Guard checks the selected copied text locally.
4. Depending on the selected mode, it warns, reviews, or automatically copies an ASCII-safe version.

The extension does not read the clipboard in the background.

## Modes

### ASCII Warning

Default mode. If copied AI-site text contains non-ASCII formatting, the extension pauses the copy and lets the user choose:

- Copy ASCII-safe
- Copy original
- Cancel

### Auto ASCII Copy

Automatically copies the cleaned ASCII-safe version when copied AI-site text contains non-ASCII formatting.

### Style Review

Shows ASCII formatting issues and optional review phrases that may sound generic or over-polished. These are style hints only. They do not prove AI authorship.

## Privacy design

PlainText Guard is designed to minimize access:

- Runs only on supported AI assistant sites.
- Checks only user-selected text during a user-initiated copy action.
- Does not request clipboardRead permission.
- Does not read the clipboard in the background.
- Does not monitor where users paste text.
- Does not upload copied text.
- Does not store copied text.
- Does not make network calls.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Permissions

The extension uses only two Chrome permissions:

- `storage`: saves the user's mode and popup settings.
- `clipboardWrite`: writes the cleaned text to the clipboard after a user copy action or after the user clicks Copy ASCII-safe.

It does not use `clipboardRead`.

## Local installation

1. Download or clone this repository.
2. Open Chrome.
3. Go to `chrome://extensions`.
4. Enable Developer mode.
5. Click Load unpacked.
6. Select the repository folder.
7. Open a supported AI site and copy selected text.

## Chrome Web Store package

The Web Store upload ZIP must contain `manifest.json` at the root of the ZIP.

To build the upload ZIP:

```bash
npm run package:webstore
```

The output is written to `dist/plaintext-guard-webstore-0.1.2.zip`.

## Test text

Copy this text from a supported AI site to test the extension:

```text
"This line has smart quotes, an em dash, an en dash, and an ellipsis."
- First item should become a hyphen and arrow
Use 5 x 3 as a multiplication test.
```

For a stronger test, use the non-ASCII sample in [docs/TEST_PLAN.md](docs/TEST_PLAN.md).

## Repository structure

```text
assets/                 Extension icons
src/                    Runtime source files
store-assets/           Chrome Web Store screenshots and promo tile
docs/                   Store listing, test plan, release notes, and submission notes
tools/                  Local packaging and validation scripts
manifest.json           Manifest V3 extension manifest
PRIVACY.md              Privacy policy
LICENSE                 Project license
```

## Development notes

This MVP intentionally avoids a background service worker. The content script runs only on supported AI sites and handles user-initiated copy events.

## License

MIT License. See [LICENSE](LICENSE).
