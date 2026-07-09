# Lab: detection quality experiments

Not shipped with the extension. The Web Store package script only bundles files on its allowlist, so nothing in `lab/` reaches users.

## What is here

Measurement of the current rules' false-positive rate, and a prototype for the planned paste-time secret detector.

### Current-rules false-positive harness

- `load-rules.js` loads `src/rules.js` in Node without a browser.
- `benign-corpus.js` is 45 benign text samples: technical writing, commit messages, multilingual text, symbols, and code.
- `fp-harness.js` runs `analyzeText` over the corpus and reports which rules fire on benign text.
- `strict-ascii-demo.js` shows what Strict ASCII deletion does to multilingual text.

Measured on 2026-07-09: with review phrases on, 33 of 45 benign samples were flagged. The worst offenders were the catch-all non-ASCII rule (all non-English text), the `from X to Y` review regex, and single-word review phrases such as `robust` and `unlock`.

### Secret detector prototype

- `secret-rules.js` is a dependency-free detector for credentials pasted into AI sites: vendor-anchored patterns (AWS, GitHub, Slack, Stripe, Google, OpenAI, Anthropic), structure-validated JWTs, PEM private key blocks, and a last-resort context-gated entropy rule. Findings carry a confidence tier (high or medium) and a redacted preview.
- `secret-corpus.js` holds synthetic positives (fake secrets built programmatically, none real) and hard negatives (git SHAs, UUIDs, data URIs, lockfile hashes, Docker digests, redacted placeholders).
- `secret-harness.js` reports precision and recall.

Measured on 2026-07-09: 32/32 synthetic positives caught, 0 findings of any tier on 46 hard negatives.

## Running

Requires Node 18+:

```bash
node lab/secret-detection/fp-harness.js
node lab/secret-detection/strict-ascii-demo.js
node lab/secret-detection/secret-harness.js
```

Treat these as regression gates for any rule change: 0 high-tier findings on hard negatives, 100% recall on synthetic positives, and a low flag rate on the benign corpus.
