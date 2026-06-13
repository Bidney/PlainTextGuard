# Chrome Web Store Listing Draft

## Extension name

PlainText Guard

## Short description

Copy ASCII-safe text from supported AI sites without background clipboard reading.

## Detailed description

PlainText Guard helps QA engineers, technical writers, developers, finance-modeling workers, and delivery teams keep copied AI-site text clean, portable, and client-ready.

It detects non-ASCII formatting characters such as smart quotes, em dashes, en dashes, ellipses, non-breaking spaces, zero-width characters, bullets, arrows, and similar characters. It can warn before copying, copy an ASCII-safe version automatically, or show a style review before text reaches tickets, emails, code reviews, client deliverables, and documentation.

PlainText Guard is not an AI detector and is not designed to hide AI use. It is a plain-text hygiene and formatting compliance tool.

Key features:

- Runs only on supported AI assistant sites.
- Checks selected text during user-initiated copy actions.
- Offers one-click ASCII-safe copy.
- Supports ASCII Warning, Auto ASCII Copy, and Style Review modes.
- Supports optional Strict ASCII cleanup.
- Processes text locally in the browser.
- Does not read the clipboard in the background.
- Does not request clipboardRead permission.
- Does not monitor paste destinations.
- Does not upload or store copied text.

Supported source sites in this MVP:

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

## Privacy summary

PlainText Guard processes selected text locally during a user-initiated copy action on supported AI sites. It does not upload copied text, store copied text, monitor paste destinations, or read the clipboard in the background.

## Suggested category

Productivity

## Suggested language

English

## Suggested visibility for beta

Private, with access limited to trusted testers or a Google Group.
