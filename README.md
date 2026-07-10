# PlainText Guard

PlainText Guard is a privacy-first Chrome extension that guards both directions of the clipboard on supported AI assistant sites: it cleans non-ASCII formatting from text you copy out, and it blocks API keys, tokens, and private keys from being pasted in.

It helps QA engineers, technical writers, developers, finance-modeling workers, and delivery teams avoid non-ASCII formatting problems in client-ready text. It detects and cleans smart quotes, em dashes, en dashes, ellipses, non-breaking spaces, zero-width characters, bullets, arrows, multiplication signs, and similar characters, and it flags hidden or deceptive characters such as bidirectional controls and mixed-script lookalike letters.

PlainText Guard is not an AI detector and is not positioned as a tool to hide AI use. It is a formatting, compliance, and plain-text hygiene tool.

## Current status

Version: 0.3.1

This release is prepared for public distribution through the Chrome Web Store and local unpacked testing.

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

Ordinary non-English text, accents, currency symbols, and emoji are not treated as issues in any mode. Only formatting characters, hidden or deceptive characters, and (when Strict ASCII is on) remaining non-ASCII characters trigger the guard.

## Secret paste guard

Pasting text on a supported AI site is checked locally for credentials before it lands in the chat box:

- High-confidence matches (AWS, GitHub, Slack, Stripe, Google, OpenAI, and Anthropic key formats, validated JWTs, PEM private key blocks) block the paste and offer Paste without secrets, Paste anyway, or Cancel.
- Lower-confidence matches (high-entropy strings next to words like key, token, or secret) let the paste through and show a warning instead.

Detection runs entirely in the browser. Nothing is uploaded, stored, or logged. The paste guard is off by default and begins checking pasted text only after the user explicitly enables it in the popup.

## Turning it on and off

Two toggles control when PlainText Guard runs:

- Master toggle: right-click the toolbar icon and use `Enabled`, open the popup, or press `Alt+Shift+P`.
- Per-site toggle: right-click the toolbar icon on a supported AI site and use `Enabled on <site>`, or open the popup on that site.

When the extension is off for the current site, the toolbar icon shows an `OFF` badge and copy events pass through untouched.

## Privacy design

PlainText Guard is designed to minimize access:

- Runs only on supported AI assistant sites.
- Checks only user-selected text during a user-initiated copy action, and pasted text during a user-initiated paste on those sites.
- Does not request clipboardRead permission.
- Does not read the clipboard in the background.
- Does not monitor where users paste text.
- Does not upload copied text.
- Does not store copied text.
- Does not make network calls.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Permissions

The extension uses only three Chrome permissions:

- `storage`: saves the user's toggles, mode, and popup settings.
- `clipboardWrite`: writes the cleaned text to the clipboard after a user copy action or after the user clicks Copy ASCII-safe.
- `contextMenus`: shows the on/off checkboxes when right-clicking the toolbar icon.

It does not use `clipboardRead`. See [docs/PERMISSIONS.md](docs/PERMISSIONS.md) for details.

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

The output is written to `dist/plaintext-guard-webstore-0.3.1.zip`.

## Support development

PlainText Guard is free, open source, and has no ads or analytics. If it saves you time, you can optionally [buy Eugene a coffee](https://buycoffee.to/bidney). Donating does not unlock or change any feature.

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
lab/                    Detection-quality harnesses and regression corpora (not shipped)
manifest.json           Manifest V3 extension manifest
PRIVACY.md              Privacy policy
LICENSE                 Project license
```

## Development notes

The content script runs only on supported AI sites and handles user-initiated copy events. A small event-driven background service worker manages the icon right-click menu and the OFF badge; it makes no network calls and never reads page content or the clipboard.

## License

MIT License. See [LICENSE](LICENSE).
