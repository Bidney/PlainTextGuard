# PlainText Guard - Chrome Web Store submission

## Product details

**Name**

PlainText Guard - Safe AI Copy & Paste

**Summary**

Clean AI-copied text and block secrets before they reach supported AI chats, entirely on-device.

**Category**

Productivity

**Language**

English

**Detailed description**

Keep text copied from and pasted into supported AI assistants cleaner and safer, entirely in your browser.

PlainText Guard catches troublesome Unicode formatting when you copy AI-generated text and detects likely credentials before you paste them into an AI chat. It is designed for developers, security and cloud engineers, QA teams, technical writers, analysts, and anyone moving text between AI assistants and professional work.

CLEAN COPIED TEXT

- Detect smart quotes, em and en dashes, ellipses, non-breaking spaces, zero-width characters, bullets, arrows, mixed-script lookalikes, and other hidden or deceptive characters.
- Review changes before copying, automatically copy an ASCII-safe version, or use Style Review mode.
- Optionally enable Strict ASCII cleanup.
- Preserve ordinary non-English text, accents, currencies, and emoji unless Strict ASCII is enabled.

BLOCK PASTED SECRETS

- Explicitly opt in to local secret checking; the paste guard is off by default.
- Detect high-confidence API keys, access tokens, validated JWTs, and private-key blocks during a user-initiated paste after it is enabled.
- Paste with detected values redacted, paste anyway, or cancel.
- Lower-confidence findings warn without automatically blocking the paste.
- Turn the paste guard off whenever it is not needed.

STAY IN CONTROL

- Use master and per-site on/off controls.
- Toggle the extension with Alt+Shift+P.
- Run it only on explicitly supported AI assistant sites.
- Keep all text analysis local: no text uploads, analytics, ads, or background clipboard reading.

Supported sites include ChatGPT, Claude, Gemini, DeepSeek Chat, Perplexity, Poe, Microsoft Copilot, Grok, You.com, and Hugging Face Chat.

PlainText Guard is not an AI detector and is not designed to hide AI use. It is a local plain-text hygiene and credential-safety tool.

## Store URLs

**Homepage**

https://github.com/Bidney/PlainTextGuard

**Support**

https://github.com/Bidney/PlainTextGuard/issues

**Privacy policy**

https://github.com/Bidney/PlainTextGuard/blob/main/PRIVACY.md

## Single purpose

PlainText Guard protects user-initiated text transfer on supported AI assistant sites by cleaning problematic copied formatting and detecting likely secrets before paste, with all analysis performed locally.

## Permission justifications

**storage**

Stores only user-controlled settings: master and per-site toggles, paste-guard setting, selected cleanup mode, Strict ASCII setting, and success-toast preference. Copied and pasted text is never stored.

**clipboardWrite**

Writes an ASCII-safe version to the clipboard only after a user copy action or after the user chooses Copy ASCII-safe. The extension does not request `clipboardRead` and does not read the clipboard in the background.

**contextMenus**

Provides master and per-site Enabled controls when the user right-clicks the extension toolbar icon. It does not inject advertising or unrelated page menus.

## Host access justification

The content scripts run only on the supported AI assistant domains listed in the manifest. This narrow access is required to inspect selected text during user-initiated copy events and pasted text during user-initiated paste events, show local review controls, and prevent likely secrets from reaching the chat when the user chooses to block or redact them. The extension does not run on arbitrary websites.

## Remote code

No. All executable JavaScript and detection rules are packaged with the extension. No remote code, remote configuration, external model, or external text-processing service is used.

## Privacy practices answers

Google requires local processing to be disclosed as data handling. Select these data types in the dashboard:

- Authentication information: handled transiently and locally by the opt-in secret paste guard; never stored or transmitted
- Personal communications: selected and pasted text may be communications and is handled transiently and locally; never stored or transmitted
- Web history: supported-site hostnames are read to provide per-site controls and may be stored only when the user changes a per-site toggle
- User activity: user-initiated copy and paste events are handled only to provide the visible feature; never logged or transmitted
- Website content: user-selected response text is handled locally during copy; never stored or transmitted

Do not select these data types because the extension does not specifically collect or use them:

- Personally identifiable information
- Health information
- Financial and payment information
- Location

For every selected type, certify that:

- data is used only for the extension's disclosed single purpose;
- data is not sold or transferred to third parties;
- data is not used for advertising, creditworthiness, or lending; and
- humans cannot read the processed data.

Additional certifications:

- Data sold to third parties: no
- Data used or transferred for unrelated purposes: no
- Data used or transferred for creditworthiness or lending: no

## Optional donation disclosure

The popup contains a clearly labeled external BuyCoffee link. It opens only after a user click. No feature requires payment, and donating does not unlock or change any functionality. The extension itself does not receive or process payment information.

## Distribution

Public, free, and available in all supported regions.

## Release checklist

- Upload `dist/plaintext-guard-webstore-0.3.1.zip`.
- Upload `assets/icon128.png` as the store icon.
- Upload the three 1280x800 screenshots from `store-assets/`.
- Upload `small-promo-tile-440x280.png`.
- Upload the optional `marquee-promo-1400x560.png`.
- Use the privacy policy, support, and homepage URLs above.
- Select no paid functionality; the support link is an optional donation only.
- Confirm no remote code is used.
- Submit for review with automatic publishing after approval, unless deferred publishing is preferred.

## Zero-budget launch plan

### Positioning

Lead with the practical outcome: "Clean formatting before copy; catch secrets before paste." This is stronger and more specific than presenting it as a generic ASCII converter or AI-writing tool.

Natural discovery phrases include ASCII-safe copy, clean AI text, remove smart quotes, Unicode cleanup, secret paste protection, prevent API key leaks, local clipboard privacy, and AI developer tools. Do not repeat keywords unnaturally.

### Launch sequence

1. Add the final Chrome Web Store URL near the top of the GitHub README.
2. Create a GitHub release named `v0.3.1 - Chrome Web Store launch`.
3. Share one short demo showing a smart-quote cleanup followed by a fake-key paste warning.
4. Post only in developer, cybersecurity, cloud, technical-writing, QA, and productivity communities where self-promotion is allowed.
5. Ask early users for false-positive reports and workflow feedback rather than incentivized ratings.
6. Turn repeated questions into README examples and store-listing improvements.
7. Review impressions, installs, uninstalls, and support issues after two weeks before changing the listing again.

### Ready-to-post launch copy

**GitHub / LinkedIn**

I built PlainText Guard, a free Chrome extension for safer text transfer with AI assistants. It cleans smart quotes, hidden Unicode, and other formatting issues when you copy text, and catches likely API keys, tokens, JWTs, or private keys before you paste them into a supported AI chat. Everything runs locally with no analytics, text uploads, or background clipboard reading. [Chrome Web Store URL]

**Community post**

Title: I made a local Chrome guard for AI copy/paste hygiene and accidental secret leaks

PlainText Guard handles two mistakes I kept seeing in AI-assisted work: invisible or non-ASCII formatting copied into tickets and documents, and credentials accidentally pasted into chats. It reviews or cleans copied text and pauses high-confidence secrets before paste. The extension runs only on supported AI sites, performs analysis locally, and does not request clipboardRead. I would especially value feedback on false positives and whether the redaction workflow feels natural. [Chrome Web Store URL] [GitHub URL]

**Short post**

Clean AI-copied formatting and catch likely secrets before paste. PlainText Guard runs locally, has no analytics, and never reads the clipboard in the background. [Chrome Web Store URL]
