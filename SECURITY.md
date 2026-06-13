# Security Policy

## Supported versions

PlainText Guard is currently in MVP beta. Security fixes should target the latest version.

## Reporting a vulnerability

Please report security issues privately before opening a public issue.

Use GitHub Security Advisories if available, or contact the maintainer through the repository owner profile.

Repository:

https://github.com/bidney/PlainTextGuard

## Security design

PlainText Guard is designed to minimize data exposure:

- No background clipboard reading.
- No `clipboardRead` permission.
- No remote text processing.
- No analytics or telemetry.
- No network calls.
- Content scripts are limited to supported AI assistant sites.
- Copied text is processed in memory only and is not stored.

## Out of scope

PlainText Guard is not a secret scanner, password manager, DLP product, malware scanner, or AI detector.
