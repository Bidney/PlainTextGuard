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

  const REVIEW_PHRASE_RULES = [
    { label: "delve into", regex: /\bdelve\s+into\b/gi },
    { label: "unlock", regex: /\bunlock\b/gi },
    { label: "elevate", regex: /\belevate\b/gi },
    { label: "seamless", regex: /\bseamless\b/gi },
    { label: "robust", regex: /\brobust\b/gi },
    { label: "leverage", regex: /\bleverage\b/gi },
    { label: "game-changing", regex: /\bgame[- ]changing\b/gi },
    { label: "in today's fast-paced world", regex: /\bin today['’]s fast[- ]paced world\b/gi },
    { label: "it is important to note", regex: /\bit is important to note\b/gi },
    { label: "not only ... but also", regex: /\bnot only\b[\s\S]{0,120}\bbut also\b/gi },
    { label: "whether you're", regex: /\bwhether you['’]re\b/gi },
    { label: "from X to Y phrasing", regex: /\bfrom\s+[^.!?\n]{1,45}\s+to\s+[^.!?\n]{1,45}/gi }
  ];

  const SAFE_CHARS = new Set(SAFE_REPLACEMENT_RULES.map((rule) => rule.char));

  function codePointLabel(char) {
    return "U+" + char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
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

  function analyzeText(text, options) {
    const settings = Object.assign({ strictAscii: false, includeReviewPhrases: false }, options || {});
    const replacementFindings = [];
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

    for (const char of text) {
      const codePoint = char.codePointAt(0);
      if (codePoint > 127 && !SAFE_CHARS.has(char)) {
        const key = char + "|" + codePoint;
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

    const unknownFindings = Array.from(unknownNonAscii.values());
    const allAsciiFindings = replacementFindings.concat(unknownFindings);

    return {
      hasIssues: allAsciiFindings.length > 0 || reviewFindings.length > 0,
      hasAsciiIssues: allAsciiFindings.length > 0,
      hasReviewIssues: reviewFindings.length > 0,
      replacementFindings,
      unknownFindings,
      reviewFindings,
      allAsciiFindings,
      totalAsciiIssueCount: allAsciiFindings.reduce((sum, item) => sum + item.count, 0),
      totalReviewIssueCount: reviewFindings.reduce((sum, item) => sum + item.count, 0)
    };
  }

  function cleanText(text, options) {
    const settings = Object.assign({ strictAscii: false }, options || {});
    let cleaned = text;

    for (const rule of SAFE_REPLACEMENT_RULES) {
      cleaned = cleaned.split(rule.char).join(rule.replacement);
    }

    if (settings.strictAscii) {
      cleaned = cleaned.replace(/[^\x00-\x7F]/g, "");
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
    REVIEW_PHRASE_RULES
  };
})();
