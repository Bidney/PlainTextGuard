# Privacy Policy for PlainText Guard

Effective date: 2026-06-13

PlainText Guard is a Chrome extension that helps users copy ASCII-safe text from supported AI assistant sites. This privacy policy explains what the extension does and does not do with user data.

## Summary

PlainText Guard processes selected text locally in the browser during user-initiated copy actions on supported AI sites.

PlainText Guard does not sell data, does not upload copied text, does not store copied text, and does not read the clipboard in the background.

## What the extension accesses

PlainText Guard accesses only the text the user selected on a supported AI site at the moment the user initiates a copy action.

The extension uses that selected text to detect and optionally replace non-ASCII formatting characters such as smart quotes, em dashes, en dashes, ellipses, non-breaking spaces, zero-width characters, bullets, arrows, and similar characters.

## What the extension stores

PlainText Guard stores only user settings, such as:

- selected mode
- Strict ASCII setting
- success toast preference

These settings are stored using Chrome extension storage.

PlainText Guard does not store copied text, original text, cleaned text, detected findings, browsing history, page contents, passwords, credentials, or personal communications.

## Clipboard access

PlainText Guard does not request `clipboardRead` permission and does not read the clipboard in the background.

PlainText Guard uses `clipboardWrite` so it can place the cleaned ASCII-safe version onto the clipboard after a user copy action or after the user clicks Copy ASCII-safe.

## Network access

PlainText Guard does not send copied text to any server.

The extension does not make network requests for text analysis, telemetry, analytics, advertising, profiling, or model processing.

## Supported sites

PlainText Guard runs only on supported AI assistant sites declared in the extension manifest. It does not run on arbitrary websites and does not monitor paste destinations.

## Data sharing

PlainText Guard does not share user data with third parties.

## Limited Use disclosure

PlainText Guard's use of user data is limited to providing and improving the visible extension functionality described in this policy. The extension does not transfer user data to third parties except as necessary to comply with applicable law, respond to a security issue, or protect users from abuse. The extension does not use user data for advertising, creditworthiness, or unrelated profiling.

## Children

PlainText Guard is intended for professional and general productivity use. It is not directed at children.

## Changes to this policy

This policy may be updated when the extension changes. Material changes should be documented in the repository changelog and reflected in the Chrome Web Store listing.

## Contact

For questions, open an issue at:

https://github.com/bidney/PlainTextGuard/issues
