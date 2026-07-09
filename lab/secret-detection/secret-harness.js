// Part 2 harness: precision/recall for the prototype secret detector
// (secret-rules.js) over synthetic positives and hard negatives.
"use strict";

const detector = require("../../src/secret-rules");
const { positives, negatives } = require("./secret-corpus");

function overlapsSecret(finding, secret) {
  return finding.raw === secret || finding.raw.includes(secret) || secret.includes(finding.raw);
}

// per-rule tallies
const stats = new Map(); // ruleId -> { tp, fp, fn, positives, detected }
function ruleStats(id) {
  if (!stats.has(id)) stats.set(id, { tp: 0, fp: 0, fn: 0, positives: 0, detected: 0 });
  return stats.get(id);
}

const fpDetails = [];
const fnDetails = [];
const mediumOnNegatives = [];
const highOnNegatives = [];

// ---------------------------------------------------------------- positives
for (const p of positives) {
  const planted = [p.secret].concat(p.extraSecrets || []);
  const res = detector.scanForSecrets(p.text);
  ruleStats(p.expectRule).positives += 1;

  let primaryHit = null;
  for (const f of res.findings) {
    const hitPlanted = planted.some((s) => overlapsSecret(f, s));
    if (hitPlanted) {
      ruleStats(f.id).tp += 1;
      if (overlapsSecret(f, p.secret) && !primaryHit) primaryHit = f;
    } else {
      ruleStats(f.id).fp += 1;
      fpDetails.push({ corpus: "positive", sample: p.id, rule: f.id, confidence: f.confidence, preview: f.preview });
    }
  }

  if (primaryHit) {
    ruleStats(p.expectRule).detected += 1;
    // confidence-tier check: did we reach at least the promised tier?
    const tierOk =
      p.minConfidence === "medium" ||
      (p.minConfidence === "high" && primaryHit.confidence === "high");
    if (!tierOk) {
      fnDetails.push({ sample: p.id, note: "detected but only at confidence=" + primaryHit.confidence });
    }
  } else {
    ruleStats(p.expectRule).fn += 1;
    fnDetails.push({ sample: p.id, note: "MISSED (no finding overlaps planted secret)" });
  }
}

// ---------------------------------------------------------------- negatives
let negativesWithAnyFinding = 0;
for (const n of negatives) {
  const res = detector.scanForSecrets(n.text);
  if (res.findings.length > 0) negativesWithAnyFinding += 1;
  for (const f of res.findings) {
    ruleStats(f.id).fp += 1;
    fpDetails.push({ corpus: "negative", sample: n.id, rule: f.id, confidence: f.confidence, preview: f.preview });
    if (f.confidence === "high") highOnNegatives.push({ sample: n.id, rule: f.id, preview: f.preview });
    else mediumOnNegatives.push({ sample: n.id, rule: f.id, preview: f.preview });
  }
}

// ---------------------------------------------------------------- report
const fmt = (x) => (Number.isFinite(x) ? (100 * x).toFixed(1) + "%" : "n/a");

console.log("=".repeat(78));
console.log("PART 2 - PROTOTYPE SECRET DETECTOR: PRECISION / RECALL");
console.log("  positives: " + positives.length + " synthetic fake secrets");
console.log("  negatives: " + negatives.length + " hard-negative samples");
console.log("=".repeat(78));

console.log("\nPer-rule results:");
console.log("  rule                        pos  detected  recall   TP   FP  precision");
let totTP = 0, totFP = 0, totPos = 0, totDet = 0;
const ruleIds = Array.from(new Set(
  detector.VENDOR_RULES.map((r) => r.id).concat(["generic-entropy"])
));
for (const id of ruleIds) {
  const s = stats.get(id);
  if (!s) continue;
  totTP += s.tp; totFP += s.fp; totPos += s.positives; totDet += s.detected;
  const recall = s.positives ? s.detected / s.positives : NaN;
  const precision = s.tp + s.fp > 0 ? s.tp / (s.tp + s.fp) : NaN;
  console.log(
    "  " + id.padEnd(28) +
    String(s.positives).padStart(3) +
    String(s.detected).padStart(9) + "  " +
    fmt(recall).padStart(6) + "  " +
    String(s.tp).padStart(3) + "  " + String(s.fp).padStart(3) + "  " +
    fmt(precision).padStart(9)
  );
}
console.log("  " + "-".repeat(72));
console.log(
  "  " + "OVERALL".padEnd(28) +
  String(totPos).padStart(3) +
  String(totDet).padStart(9) + "  " +
  fmt(totPos ? totDet / totPos : NaN).padStart(6) + "  " +
  String(totTP).padStart(3) + "  " + String(totFP).padStart(3) + "  " +
  fmt(totTP + totFP > 0 ? totTP / (totTP + totFP) : NaN).padStart(9)
);

console.log("\nNegative-corpus summary (the acceptance gate):");
console.log("  negatives with ANY finding:              " + negativesWithAnyFinding + "/" + negatives.length);
console.log("  HIGH-confidence findings on negatives:   " + highOnNegatives.length + "  (target: 0)");
console.log("  MEDIUM-confidence findings on negatives: " + mediumOnNegatives.length + "  (target: <= 2)");

if (highOnNegatives.length) {
  console.log("\n  HIGH hits on negatives (MUST FIX):");
  for (const h of highOnNegatives) console.log("    " + h.sample + "  " + h.rule + "  " + h.preview);
}
if (mediumOnNegatives.length) {
  console.log("\n  MEDIUM hits on negatives:");
  for (const h of mediumOnNegatives) console.log("    " + h.sample + "  " + h.rule + "  " + h.preview);
}

if (fnDetails.length) {
  console.log("\nMisses / tier shortfalls on positives:");
  for (const f of fnDetails) console.log("  " + f.sample + ": " + f.note);
} else {
  console.log("\nAll " + positives.length + " synthetic positives detected at the promised confidence tier.");
}

const fpOnPositives = fpDetails.filter((f) => f.corpus === "positive");
if (fpOnPositives.length) {
  console.log("\nSpurious findings on positive samples (matched something other than the planted secret):");
  for (const f of fpOnPositives) console.log("  " + f.sample + "  " + f.rule + "  [" + f.confidence + "]  " + f.preview);
}

const gateFailed = highOnNegatives.length > 0 || mediumOnNegatives.length > 2 || fnDetails.length > 0;
console.log("\nACCEPTANCE GATE: " + (gateFailed ? "FAIL" : "PASS"));
if (gateFailed) process.exit(1);
