(function () {
  "use strict";

  const SAFE_REPLACEMENT_RULES = [
    { char: "\u2014", label: "em dash", replacement: "-" },
    { char: "\u2013", label: "en dash", replacement: "-" },
    { char: "\u201C", label: "left smart double quote", replacement: "\"" },
    { char: "\u201D", label: "right smart double quote", replacement: "\"" },
    { char: "\u201E", label: "low smart double quote", replacement: "\"" },
    { char: "\u201F", label: "high smart double quote", replacement: "\"" },
    { char: "\u2018", label: "left smart single quote", replacement: "'" },
    { char: "\u2019", label: "right smart single quote", replacement: "'" },
    { char: "\u201A", label: "low smart single quote", replacement: "'" },
    { char: "\u201B", label: "high smart single quote", replacement: "'" },
    { char: "\u2026", label: "ellipsis", replacement: "..." },
    { char: "\u00A0", label: "non-breaking space", replacement: " " },
    { char: "\u202F", label: "narrow no-break space", replacement: " " },
    { char: "\u2007", label: "figure space", replacement: " " },
    { char: "\u2009", label: "thin space", replacement: " " },
    { char: "\u200A", label: "hair space", replacement: " " },
    { char: "\u200B", label: "zero-width space", replacement: "" },
    { char: "\u200C", label: "zero-width non-joiner", replacement: "" },
    { char: "\u200D", label: "zero-width joiner", replacement: "" },
    { char: "\u2060", label: "word joiner", replacement: "" },
    { char: "\uFEFF", label: "byte order mark", replacement: "" },
    { char: "\u2022", label: "bullet", replacement: "-" },
    { char: "\u25E6", label: "white bullet", replacement: "-" },
    { char: "\u2043", label: "hyphen bullet", replacement: "-" },
    { char: "\u2219", label: "bullet operator", replacement: "-" },
    { char: "\u2192", label: "right arrow", replacement: "->" },
    { char: "\u2190", label: "left arrow", replacement: "<-" },
    { char: "\u21D2", label: "double right arrow", replacement: "=>" },
    { char: "\u21D0", label: "double left arrow", replacement: "<=" },
    { char: "\u00D7", label: "multiplication sign", replacement: "x" },
    { char: "\u2212", label: "minus sign", replacement: "-" },
    { char: "\u00AD", label: "soft hyphen", replacement: "" }
  ];

  // Characters that are invisible or change text direction. Unlike ordinary
  // non-ASCII text (accents, other scripts, emoji), these can hide or reorder
  // content, so they are always treated as issues and always stripped.
  const SUSPICIOUS_CHAR_RANGES = [
    { from: 0x202A, to: 0x202E, label: "bidirectional control" },
    { from: 0x2066, to: 0x2069, label: "bidirectional isolate" },
    { from: 0x200E, to: 0x200F, label: "directional mark" },
    { from: 0x061C, to: 0x061C, label: "Arabic letter mark" },
    { from: 0x2061, to: 0x2064, label: "invisible operator" },
    { from: 0xFFF9, to: 0xFFFB, label: "interlinear annotation" },
    { from: 0x180E, to: 0x180E, label: "Mongolian vowel separator" },
    { from: 0xE0000, to: 0xE007F, label: "tag character" }
  ];

  // Style hints only. Single common words ("robust", "leverage", "unlock")
  // and the from-X-to-Y construction were removed in 0.3.0: they matched
  // ordinary technical writing far too often to be useful signals.
  const REVIEW_PHRASE_RULES = [
    { label: "delve into", regex: /\bdelve\s+into\b/gi },
    { label: "game-changing", regex: /\bgame[- ]changing\b/gi },
    { label: "in today's fast-paced world", regex: /\bin today['\u2019]s fast[- ]paced world\b/gi },
    { label: "it is important to note", regex: /\bit is important to note\b/gi },
    { label: "not only ... but also", regex: /\bnot only\b[\s\S]{0,120}\bbut also\b/gi },
    { label: "whether you're", regex: /\bwhether you['\u2019]re\b/gi }
  ];

  const SAFE_CHARS = new Set(SAFE_REPLACEMENT_RULES.map((rule) => rule.char));

  const LATIN_LETTER_RE = /[A-Za-z]/;
  const CYRILLIC_LETTER_RE = /[\u0400-\u04FF]/;
  const GREEK_LETTER_RE = /[\u0370-\u03FF]/;
  const WORD_RE = /[\p{L}\p{M}]+/gu;

  function codePointLabel(char) {
    return "U+" + char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
  }

  function suspiciousLabel(codePoint) {
    for (const range of SUSPICIOUS_CHAR_RANGES) {
      if (codePoint >= range.from && codePoint <= range.to) return range.label;
    }
    return null;
  }

  function countLiteral(text, char) {
    let count = 0;
    let index = text.indexOf(char);

    while (index !== -1) {
      count += 1;
      index = text.indexOf(char, index + char.length);
    }

    return count;
  }

  function makePreview(value) {
    return value
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 90);
  }

  // Indices of Cyrillic/Greek letters that sit inside an otherwise-Latin
  // word (a Cyrillic "a" inside "paypal"). Same-script words are left alone,
  // so ordinary Russian or Greek text is never flagged here.
  function findConfusableIndices(text) {
    const indices = new Set();
    let match;

    WORD_RE.lastIndex = 0;
    while ((match = WORD_RE.exec(text)) !== null) {
      const word = match[0];
      if (!LATIN_LETTER_RE.test(word)) continue;
      if (!CYRILLIC_LETTER_RE.test(word) && !GREEK_LETTER_RE.test(word)) continue;

      let offset = 0;
      for (const char of word) {
        if (CYRILLIC_LETTER_RE.test(char) || GREEK_LETTER_RE.test(char)) {
          indices.add(match.index + offset);
        }
        offset += char.length;
      }
    }

    return indices;
  }

  function analyzeText(text, options) {
    const settings = Object.assign({ strictAscii: false, includeReviewPhrases: false }, options || {});
    const replacementFindings = [];
    const suspiciousMap = new Map();
    const unknownNonAscii = new Map();
    const reviewFindings = [];

    for (const rule of SAFE_REPLACEMENT_RULES) {
      const count = countLiteral(text, rule.char);
      if (count > 0) {
        replacementFindings.push({
          type: "replacement",
          char: rule.char,
          label: rule.label,
          replacement: rule.replacement,
          count,
          codePoint: codePointLabel(rule.char)
        });
      }
    }

    const confusableIndices = findConfusableIndices(text);
    let index = 0;

    for (const char of text) {
      const codePoint = char.codePointAt(0);

      if (codePoint > 127 && !SAFE_CHARS.has(char)) {
        const hiddenLabel = suspiciousLabel(codePoint);
        const key = char + "|" + codePoint;

        if (hiddenLabel || confusableIndices.has(index)) {
          if (!suspiciousMap.has(key)) {
            suspiciousMap.set(key, {
              type: "suspicious",
              char,
              label: hiddenLabel || "mixed-script lookalike letter",
              replacement: hiddenLabel ? "" : null,
              count: 0,
              codePoint: codePointLabel(char)
            });
          }
          suspiciousMap.get(key).count += 1;
        } else {
          if (!unknownNonAscii.has(key)) {
            unknownNonAscii.set(key, {
              type: "unknown-non-ascii",
              char,
              label: "other non-ASCII character",
              replacement: settings.strictAscii ? "" : null,
              count: 0,
              codePoint: codePointLabel(char)
            });
          }
          unknownNonAscii.get(key).count += 1;
        }
      }

      index += char.length;
    }

    if (settings.includeReviewPhrases) {
      for (const phraseRule of REVIEW_PHRASE_RULES) {
        const matches = Array.from(text.matchAll(phraseRule.regex));
        if (matches.length > 0) {
          reviewFindings.push({
            type: "review-phrase",
            label: phraseRule.label,
            count: matches.length,
            preview: makePreview(matches[0][0])
          });
        }
      }
    }

    const suspiciousFindings = Array.from(suspiciousMap.values());
    const unknownFindings = Array.from(unknownNonAscii.values());
    const allAsciiFindings = replacementFindings.concat(suspiciousFindings, unknownFindings);

    const replacementCount = replacementFindings.reduce((sum, item) => sum + item.count, 0);
    const suspiciousCount = suspiciousFindings.reduce((sum, item) => sum + item.count, 0);
    const unknownCount = unknownFindings.reduce((sum, item) => sum + item.count, 0);

    // Plain foreign text, currency, and emoji are NOT issues unless the user
    // explicitly asked for strict ASCII output. Hidden or deceptive
    // characters always are.
    const hasAsciiIssues =
      replacementFindings.length > 0 ||
      suspiciousFindings.length > 0 ||
      (settings.strictAscii && unknownFindings.length > 0);

    return {
      hasIssues: hasAsciiIssues || reviewFindings.length > 0,
      hasAsciiIssues,
      hasReviewIssues: reviewFindings.length > 0,
      replacementFindings,
      suspiciousFindings,
      unknownFindings,
      reviewFindings,
      allAsciiFindings,
      totalAsciiIssueCount: replacementCount + suspiciousCount + (settings.strictAscii ? unknownCount : 0),
      totalReviewIssueCount: reviewFindings.reduce((sum, item) => sum + item.count, 0)
    };
  }

  function stripSuspicious(text) {
    let result = "";

    for (const char of text) {
      const codePoint = char.codePointAt(0);
      if (codePoint > 127 && !SAFE_CHARS.has(char) && suspiciousLabel(codePoint)) continue;
      result += char;
    }

    return result;
  }

  function cleanText(text, options) {
    const settings = Object.assign({ strictAscii: false }, options || {});
    let cleaned = text;

    for (const rule of SAFE_REPLACEMENT_RULES) {
      cleaned = cleaned.split(rule.char).join(rule.replacement);
    }

    cleaned = stripSuspicious(cleaned);

    if (settings.strictAscii) {
      // Transliterate before deleting: NFKD splits accented letters into a
      // base letter plus combining marks, so "cafe" with an accent becomes
      // "cafe" instead of "caf". Characters with no ASCII decomposition are
      // then removed.
      cleaned = cleaned
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .replace(/[^\x00-\x7F]/g, "");
    }

    return cleaned;
  }

  function isAsciiSafe(text) {
    return /^[\x00-\x7F]*$/.test(text);
  }

  window.PlainTextGuardRules = {
    analyzeText,
    cleanText,
    isAsciiSafe,
    SAFE_REPLACEMENT_RULES,
    SUSPICIOUS_CHAR_RANGES,
    REVIEW_PHRASE_RULES
  };
})();
