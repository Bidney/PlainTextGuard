# Manual Test Plan

## Setup

1. Load the extension unpacked in Chrome.
2. Open a supported AI assistant site.
3. Open the PlainText Guard popup.
4. Confirm the default mode is ASCII Warning.

## Test 1: ASCII Warning mode

Set mode to ASCII Warning.

Copy this text from a supported AI site:

```text
“This workflow is robust — and it helps teams leverage seamless delivery…”
• First item → cleaned
• Second item ← cleaned
Use 5 × 3 as a multiplication test.
```

Expected:

- PlainText Guard shows a review panel.
- The panel lists ASCII formatting issues.
- Copy ASCII-safe places cleaned text on the clipboard.
- Copy original keeps the original text.
- Cancel does not replace the clipboard with cleaned text.

Expected cleaned text:

```text
"This workflow is robust - and it helps teams leverage seamless delivery..."
- First item -> cleaned
- Second item <- cleaned
Use 5 x 3 as a multiplication test.
```

## Test 2: Auto ASCII Copy mode

Set mode to Auto ASCII Copy.

Copy the same test text.

Expected:

- No review panel appears.
- A success toast appears.
- Pasted text is ASCII-safe.

## Test 3: Style Review mode

Set mode to Style Review.

Copy this text:

```text
“In today's fast-paced world, teams need a robust and seamless way to leverage better workflows — not only for speed, but also for quality…”
```

Expected:

- The panel lists ASCII formatting issues.
- The panel lists review phrases.
- The panel does not claim the text is AI-generated.

## Test 4: No issues

Copy this text:

```text
This is already ASCII-safe text with normal quotes and hyphens.
```

Expected:

- No warning appears in ASCII Warning mode.
- Copy proceeds normally.

## Test 5: Strict ASCII

Enable Strict ASCII.

Copy this text:

```text
Zażółć gęślą jaźń — test
```

Expected:

- Common punctuation is replaced.
- Remaining non-ASCII characters are removed in the cleaned version.

## Test 6: Unsupported site

Open an unsupported site, for example GitHub or Gmail.

Expected:

- PlainText Guard does not run.
- Copy behavior is unchanged.
