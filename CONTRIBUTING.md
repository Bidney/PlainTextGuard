# Contributing

Thanks for considering a contribution to PlainText Guard.

## Project principles

- Keep the extension simple.
- Keep permissions narrow.
- Do not add background clipboard reading.
- Do not upload copied text.
- Do not add analytics without an explicit opt-in design.
- Avoid positioning the project as AI detection or AI-use hiding.
- Keep user-facing language focused on plain-text hygiene and client-ready formatting.

## Local setup

1. Clone the repository.
2. Open `chrome://extensions` in Chrome.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the repository folder.

## Packaging

Run:

```bash
npm run package:webstore
```

## Pull request checklist

Before opening a pull request:

- Run `npm run validate`.
- Manually test copy from at least one supported AI site.
- Confirm the extension does not request `clipboardRead`.
- Confirm no copied text is logged, stored, uploaded, or sent over the network.
- Update docs if behavior changes.
