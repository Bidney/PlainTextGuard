/*
 * secret-rules.js - prototype low-false-positive secret detector for
 * PlainText Guard's real goal: catching API keys / credentials pasted into
 * AI chat sites.
 *
 * Design principles:
 *  - Vendor-anchored patterns first (distinctive prefixes + exact shapes).
 *    These are "high" confidence: the prefix namespace is reserved by the
 *    vendor, so a match is essentially never benign.
 *  - Structural validation where the format allows it (JWT header must
 *    base64url-decode to JSON with an "alg" field).
 *  - Generic entropy detection is a LAST resort and is context-gated: a
 *    high-entropy blob only counts if a credential keyword (key, token,
 *    secret, password, ...) appears within ~40 chars before it. These are
 *    "medium" confidence - the UI should warn, not block.
 *  - Hard suppressions for the classic lookalikes: pure hex (git SHAs,
 *    sha256 digests), UUIDs, sha512-... integrity hashes, base64 data URIs.
 *
 * Confidence tiers:
 *  - "high":   anchored vendor pattern or validated structure -> safe to block.
 *  - "medium": context-gated entropy -> warn / ask the user.
 *
 * Dependency-free plain JS. Works in the browser (attaches to window) and in
 * Node (module.exports). No network, no state.
 */
(function (root) {
  "use strict";

  // ------------------------------------------------------------ utilities

  /** Shannon entropy in bits per character of a string. */
  function shannonEntropy(str) {
    if (!str) return 0;
    const freq = new Map();
    for (const ch of str) freq.set(ch, (freq.get(ch) || 0) + 1);
    const n = Array.from(str).length;
    let h = 0;
    for (const count of freq.values()) {
      const p = count / n;
      h -= p * Math.log2(p);
    }
    return h;
  }

  function base64UrlDecode(seg) {
    let s = seg.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4 !== 0) s += "=";
    try {
      if (typeof atob === "function") {
        return atob(s);
      }
      // Node fallback
      return Buffer.from(s, "base64").toString("binary");
    } catch (e) {
      return null;
    }
  }

  /** Validate that a candidate JWT's header decodes to JSON with an alg. */
  function isValidJwtHeader(headerSegment) {
    const decoded = base64UrlDecode(headerSegment);
    if (!decoded) return false;
    try {
      const obj = JSON.parse(decoded);
      return obj !== null && typeof obj === "object" && typeof obj.alg === "string";
    } catch (e) {
      return false;
    }
  }

  function redact(raw) {
    if (raw.length <= 11) return raw.slice(0, 4) + "…";
    return raw.slice(0, 7) + "…" + raw.slice(-4) + " (" + raw.length + " chars)";
  }

  const PURE_HEX_RE = /^[0-9a-fA-F]+$/;
  const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  // -------------------------------------------------- vendor-anchored rules
  // Each rule: id, label, regex (global), confidence, optional validate(match, text).

  // Placeholder / documentation-example suppression:
  //  - prefixLen + entropyMin: the random "body" of a real vendor key has high
  //    entropy; redacted placeholders (AIzaXXXX..., ghp_xxxx...) have ~0.
  //  - denyContains: canonical docs examples (AWS's AKIAIOSFODNN7EXAMPLE pair)
  //    that appear in thousands of tutorials.
  const VENDOR_RULES = [
    {
      id: "aws-access-key-id",
      label: "AWS access key ID",
      // AKIA = long-term, ASIA = temporary (STS); 16 chars of base32 alphabet.
      regex: /\b((?:AKIA|ASIA)[A-Z2-7]{16})\b/g,
      confidence: "high",
      prefixLen: 4,
      entropyMin: 2.5,
      denyContains: ["EXAMPLE"]
    },
    {
      id: "aws-secret-access-key",
      label: "AWS secret access key (context-anchored)",
      // 40-char base64-ish blob explicitly labelled as an AWS secret key.
      regex: /(?:aws)?[_.-]?secret[_.-]?(?:access[_.-]?)?key(?:_id)?["'`\s:=>]{1,12}([A-Za-z0-9/+=]{40})(?![A-Za-z0-9/+=])/gi,
      confidence: "high",
      captureGroup: 1,
      denyContains: ["EXAMPLE"],
      validate: function (m) {
        const tok = m[1];
        if (PURE_HEX_RE.test(tok)) return false;        // 40-hex = git SHA shape
        if (!/[A-Z]/.test(tok) || !/[a-z]/.test(tok)) return false;
        return shannonEntropy(tok) >= 3.5;
      }
    },
    {
      id: "github-token",
      label: "GitHub token (classic/OAuth/app)",
      regex: /\b(gh[pousr]_[A-Za-z0-9]{36})\b/g,
      confidence: "high",
      prefixLen: 4,
      entropyMin: 3.0
    },
    {
      id: "github-pat-fine-grained",
      label: "GitHub fine-grained PAT",
      regex: /\b(github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{40,80})\b/g,
      confidence: "high",
      prefixLen: 11,
      entropyMin: 3.0
    },
    {
      id: "slack-token",
      label: "Slack token",
      // Real Slack tokens carry numeric workspace/bot ids right after the
      // prefix; requiring digits kills "xoxb-your-token-here" placeholders.
      regex: /\b(xox[baprs]-\d{8,14}-[A-Za-z0-9-]{8,60})(?![A-Za-z0-9-])/g,
      confidence: "high",
      prefixLen: 5,
      entropyMin: 2.5
    },
    {
      id: "stripe-live-key",
      label: "Stripe live secret/restricted key",
      regex: /\b((?:sk|rk)_live_[A-Za-z0-9]{16,64})\b/g,
      confidence: "high",
      prefixLen: 8,
      entropyMin: 3.0
    },
    {
      id: "stripe-test-key",
      label: "Stripe test-mode key",
      regex: /\b((?:sk|rk)_test_[A-Za-z0-9]{16,64})\b/g,
      confidence: "medium", // still a credential, but not production-impacting
      prefixLen: 8,
      entropyMin: 3.0
    },
    {
      id: "google-api-key",
      label: "Google API key",
      regex: /\b(AIza[0-9A-Za-z_-]{35})(?![0-9A-Za-z_-])/g,
      confidence: "high",
      prefixLen: 4,
      entropyMin: 3.0
    },
    {
      id: "anthropic-api-key",
      label: "Anthropic API key",
      regex: /\b(sk-ant-[A-Za-z0-9_-]{20,120})(?![A-Za-z0-9_-])/g,
      confidence: "high",
      prefixLen: 7,
      entropyMin: 3.0
    },
    {
      id: "openai-project-key",
      label: "OpenAI project API key",
      regex: /\b(sk-proj-[A-Za-z0-9_-]{40,200})(?![A-Za-z0-9_-])/g,
      confidence: "high",
      prefixLen: 8,
      entropyMin: 3.0
    },
    {
      id: "openai-classic-key",
      label: "OpenAI API key (classic)",
      // The T3BlbkFJ infix ("OpenAI" base64) is present in all classic keys.
      regex: /\b(sk-[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20})\b/g,
      confidence: "high",
      prefixLen: 3,
      entropyMin: 3.0
    },
    {
      id: "openai-generic-sk",
      label: "OpenAI-style secret key (unanchored sk-)",
      // Long bare sk- keys without the classic infix. Rarely benign at this
      // length, but no vendor checksum -> keep just below auto-block.
      regex: /\b(sk-[A-Za-z0-9]{40,64})\b/g,
      confidence: "medium",
      prefixLen: 3,
      entropyMin: 3.5
    },
    {
      id: "jwt",
      label: "JSON Web Token (validated header)",
      regex: /\b(eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})(?![A-Za-z0-9_.-])/g,
      confidence: "high",
      validate: function (m) {
        return isValidJwtHeader(m[1].split(".")[0]);
      }
    },
    {
      id: "pem-private-key",
      label: "PEM private key block",
      // Claim the whole block (header..footer) so the base64 body is not
      // re-reported by the generic entropy rule.
      regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY(?: BLOCK)?-----(?:[\s\S]{0,8000}?-----END (?:RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY(?: BLOCK)?-----)?/g,
      confidence: "high"
    }
  ];

  // ------------------------------------------- context-gated entropy (last resort)

  const CONTEXT_KEYWORD_RE = new RegExp(
    "(?:api[_\\s-]?key|apikey|secret|token|passw(?:or)?d|\\bpwd\\b|credential|authorization|" +
    "authenticat|bearer|access[_\\s-]?key|private[_\\s-]?key|client[_\\s-]?secret|" +
    "signing[_\\s-]?key|\\bauth\\b)",
    "i"
  );

  // Candidate blobs: 20+ chars of base64/base62-ish alphabet, plus up to two
  // trailing '=' padding chars. '=' and '.' are NOT in the main class so that
  // "VAR_NAME=value" splits at the '=' and domains/URLs/JWTs don't glue
  // together (JWTs are handled by their own rule above).
  const CANDIDATE_RE = /[A-Za-z0-9_\-+/]{20,}={0,2}/g;

  const CONTEXT_WINDOW_BEFORE = 40;

  const ENTROPY_THRESHOLD = 3.8; // bits/char; random base62 of len>=20 is ~4.2

  function genericEntropyFindings(text, claimed) {
    const findings = [];
    let m;
    CANDIDATE_RE.lastIndex = 0;
    while ((m = CANDIDATE_RE.exec(text)) !== null) {
      const tok = m[0];
      const start = m.index;
      const end = start + tok.length;

      if (overlapsClaimed(claimed, start, end)) continue;

      // --- structural suppressions (classic lookalikes) ---
      if (PURE_HEX_RE.test(tok)) continue;                    // git SHA, sha256 digest, etc.
      if (UUID_RE.test(tok)) continue;                        // UUIDs are identifiers
      if (/^sha(?:1|256|384|512)-/i.test(tok)) continue;      // SRI / package-lock integrity
      if (!/[0-9]/.test(tok)) continue;                       // no digits -> identifiers/camelCase
      if (!/[A-Za-z]/.test(tok)) continue;                    // all digits -> ids, phone numbers
      // documentation placeholders (AWS's wJalrXUtnFEMI/...EXAMPLEKEY, CHANGEME, xxxx runs)
      if (/EXAMPLE|SAMPLE|PLACEHOLDER|CHANGE[_-]?ME|DUMMY|x{5,}|X{5,}/.test(tok)) continue;

      // base64 data URI payloads (images, fonts)
      const before24 = text.slice(Math.max(0, start - 24), start);
      if (/base64,$/.test(before24)) continue;

      // --- entropy gate ---
      if (shannonEntropy(tok) < ENTROPY_THRESHOLD) continue;

      // --- context gate: credential keyword within N chars before the blob ---
      const windowBefore = text.slice(Math.max(0, start - CONTEXT_WINDOW_BEFORE), start);
      if (!CONTEXT_KEYWORD_RE.test(windowBefore)) continue;

      // digest-style context suppression: "hash:", "digest", "checksum" wins
      if (/(?:hash|digest|checksum|integrity|etag|fingerprint)\s*[:=]?\s*$/i.test(windowBefore)) continue;

      findings.push({
        id: "generic-entropy",
        label: "high-entropy string near credential keyword",
        confidence: "medium",
        raw: tok,
        preview: redact(tok),
        index: start,
        entropy: Number(shannonEntropy(tok).toFixed(2))
      });
      claimed.push([start, end]);
    }
    return findings;
  }

  function overlapsClaimed(claimed, start, end) {
    for (const [s, e] of claimed) {
      if (start < e && end > s) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- scanner

  function scanForSecrets(text) {
    const findings = [];
    const claimed = []; // [start, end) ranges already attributed

    for (const rule of VENDOR_RULES) {
      rule.regex.lastIndex = 0;
      let m;
      while ((m = rule.regex.exec(text)) !== null) {
        const group = rule.captureGroup || (m[1] !== undefined ? 1 : 0);
        const raw = m[group];
        const start = m.index + m[0].indexOf(raw);
        const end = start + raw.length;

        if (overlapsClaimed(claimed, start, end)) continue;
        if (rule.validate && !rule.validate(m, text)) continue;

        // placeholder / docs-example suppression
        if (rule.denyContains && rule.denyContains.some((s) => raw.toUpperCase().includes(s))) continue;
        if (rule.entropyMin !== undefined) {
          const body = raw.slice(rule.prefixLen || 0);
          if (shannonEntropy(body) < rule.entropyMin) continue;
        }

        findings.push({
          id: rule.id,
          label: rule.label,
          confidence: rule.confidence,
          raw: raw,
          preview: redact(raw),
          index: start
        });
        claimed.push([start, end]);
      }
    }

    findings.push.apply(findings, genericEntropyFindings(text, claimed));
    findings.sort((a, b) => a.index - b.index);

    return {
      findings: findings,
      hasHighConfidence: findings.some((f) => f.confidence === "high"),
      hasMediumConfidence: findings.some((f) => f.confidence === "medium"),
      highCount: findings.filter((f) => f.confidence === "high").length,
      mediumCount: findings.filter((f) => f.confidence === "medium").length
    };
  }

  const api = {
    scanForSecrets: scanForSecrets,
    shannonEntropy: shannonEntropy,
    isValidJwtHeader: isValidJwtHeader,
    VENDOR_RULES: VENDOR_RULES,
    ENTROPY_THRESHOLD: ENTROPY_THRESHOLD
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.PlainTextGuardSecretRules = api;
  }
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : null));
