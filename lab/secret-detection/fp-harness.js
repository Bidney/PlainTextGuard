// Part 1 harness: run the extension's analyzeText over the benign corpus and
// report false-positive rates per rule and per category.
"use strict";

const rules = require("./load-rules");
const SAMPLES = require("./benign-corpus");

const opts = { strictAscii: false, includeReviewPhrases: true };

// ---- accumulators ---------------------------------------------------------
const perRule = new Map(); // label -> { samples: Set, occurrences, examples: [] }
function bump(label, sampleId, count, example) {
  if (!perRule.has(label)) {
    perRule.set(label, { samples: new Set(), occurrences: 0, examples: [] });
  }
  const r = perRule.get(label);
  r.samples.add(sampleId);
  r.occurrences += count;
  if (example && r.examples.length < 3) r.examples.push(example);
}

const perCategory = new Map(); // category -> { total, flaggedAny, flaggedAscii, flaggedReview, flaggedDefault }
function cat(c) {
  if (!perCategory.has(c)) {
    perCategory.set(c, { total: 0, flaggedAny: 0, flaggedAscii: 0, flaggedReview: 0, flaggedDefault: 0 });
  }
  return perCategory.get(c);
}

let flaggedAny = 0, flaggedAscii = 0, flaggedReview = 0, flaggedDefault = 0;
const sampleRows = [];

for (const s of SAMPLES) {
  const res = rules.analyzeText(s.text, opts);
  const resDefault = rules.analyzeText(s.text, { strictAscii: false, includeReviewPhrases: false });

  const c = cat(s.category);
  c.total += 1;
  if (res.hasIssues) { flaggedAny += 1; c.flaggedAny += 1; }
  if (res.hasAsciiIssues) { flaggedAscii += 1; c.flaggedAscii += 1; }
  if (res.hasReviewIssues) { flaggedReview += 1; c.flaggedReview += 1; }
  if (resDefault.hasIssues) { flaggedDefault += 1; c.flaggedDefault += 1; }

  for (const f of res.replacementFindings) {
    bump("[replacement] " + f.label, s.id, f.count);
  }
  for (const f of res.unknownFindings) {
    // Collapse the per-character catch-all into one logical rule.
    bump("[catch-all] other non-ASCII character", s.id, f.count, f.char + " (" + f.codePoint + ")");
  }
  for (const f of res.reviewFindings) {
    bump("[review-phrase] " + f.label, s.id, f.count, JSON.stringify(f.preview));
  }

  sampleRows.push({
    id: s.id,
    category: s.category,
    flagged: res.hasIssues ? "YES" : "no",
    asciiIssues: res.totalAsciiIssueCount,
    reviewIssues: res.totalReviewIssueCount,
    labels: []
      .concat(res.reviewFindings.map((f) => f.label))
      .concat(res.unknownFindings.length ? ["other non-ASCII x" + res.unknownFindings.reduce((a, f) => a + f.count, 0)] : [])
      .concat(res.replacementFindings.map((f) => f.label))
      .join("; ")
  });
}

// ---- report ---------------------------------------------------------------
const N = SAMPLES.length;
const pct = (n, d) => ((100 * n) / d).toFixed(1) + "%";

console.log("=".repeat(78));
console.log("PART 1 - FALSE-POSITIVE ANALYSIS OF CURRENT RULES (benign corpus, N=" + N + ")");
console.log("=".repeat(78));

console.log("\nOverall benign-sample flag rates (every flag here is a false positive");
console.log("relative to the owner's goal of secret detection):");
console.log("  flagged with review phrases ON  (hasIssues):        " + flaggedAny + "/" + N + "  = " + pct(flaggedAny, N));
console.log("  flagged with review phrases OFF (default settings): " + flaggedDefault + "/" + N + "  = " + pct(flaggedDefault, N));
console.log("  flagged by any non-ASCII rule   (hasAsciiIssues):   " + flaggedAscii + "/" + N + "  = " + pct(flaggedAscii, N));
console.log("  flagged by any review phrase    (hasReviewIssues):  " + flaggedReview + "/" + N + "  = " + pct(flaggedReview, N));

console.log("\nPer-category FP rate (review phrases ON):");
console.log("  category      N   flagged   ascii-rule   review-rule");
for (const [name, c] of perCategory) {
  console.log(
    "  " + name.padEnd(12) +
    String(c.total).padStart(3) +
    (String(c.flaggedAny) + "/" + c.total).padStart(9) + "  " +
    (String(c.flaggedAscii) + "/" + c.total).padStart(9) + "    " +
    (String(c.flaggedReview) + "/" + c.total).padStart(9)
  );
}

console.log("\nPer-rule FP table, ranked by number of benign samples hit:");
console.log("  samples-hit  FP-rate  occurrences  rule");
const ranked = Array.from(perRule.entries()).sort(
  (a, b) => b[1].samples.size - a[1].samples.size || b[1].occurrences - a[1].occurrences
);
for (const [label, r] of ranked) {
  console.log(
    "  " + String(r.samples.size).padStart(9) + "  " +
    pct(r.samples.size, N).padStart(7) + "  " +
    String(r.occurrences).padStart(11) + "  " + label
  );
}

console.log("\nExample matches for the worst review-phrase offenders:");
for (const [label, r] of ranked) {
  if (label.startsWith("[review-phrase]") && r.examples.length) {
    console.log("  " + label);
    for (const e of r.examples) console.log("      -> " + e);
  }
}

console.log("\nPer-sample detail:");
console.log("  id            category      flagged  ascii  review  fired rules");
for (const row of sampleRows) {
  console.log(
    "  " + row.id.padEnd(14) + row.category.padEnd(14) + row.flagged.padEnd(9) +
    String(row.asciiIssues).padStart(5) + "  " + String(row.reviewIssues).padStart(6) + "  " + row.labels
  );
}
