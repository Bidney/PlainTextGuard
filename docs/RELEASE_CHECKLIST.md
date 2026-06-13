# Release Checklist

## Code checks

- Run `npm run validate`.
- Run `npm run package:webstore`.
- Confirm the Web Store ZIP has `manifest.json` at the root.
- Confirm `clipboardRead` is not present in `manifest.json`.
- Confirm no analytics or network code was added.

## Manual QA

- Test ASCII Warning mode.
- Test Auto ASCII Copy mode.
- Test Style Review mode.
- Test Strict ASCII on and off.
- Test at least ChatGPT and Claude.
- Confirm unsupported sites are not affected.

## Documentation

- Update README if behavior changed.
- Update PRIVACY.md if data handling changed.
- Update CHANGELOG.md.
- Update docs/STORE_LISTING.md if listing text changed.

## Chrome Web Store

- Upload Web Store ZIP.
- Upload 128x128 icon.
- Upload at least one 1280x800 or 640x400 screenshot.
- Upload small promo tile, 440x280.
- Set visibility to Private for beta.
- Add trusted testers or a Google Group.
- Add privacy policy URL.
- Add support URL.
