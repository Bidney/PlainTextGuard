// Corpus for the secret-detector precision/recall harness.
//
// POSITIVES: ~30 FAKE secrets synthesized programmatically with a seeded RNG
// so the corpus is deterministic. They match each vendor's real FORMAT but
// are random garbage - none of these are, or ever were, real credentials.
// Each positive records the planted secret string and the expected rule id.
//
// NEGATIVES: ~40 hard negatives - realistic developer text full of secret
// lookalikes (git SHAs, UUIDs, base64 image data, integrity hashes, digests,
// hex colors, long URLs, code). The detector must stay quiet on all of them.
"use strict";

// ------------------------------------------------------------- seeded RNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260709);

function pick(chars, n) {
  let out = "";
  for (let i = 0; i < n; i++) out += chars[Math.floor(rand() * chars.length)];
  return out;
}
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const B62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const B64STD = B62 + "+/";
const B64URL = B62 + "-_";
const HEX = "0123456789abcdef";

function b64url(str) {
  return Buffer.from(str, "utf8").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ------------------------------------------------------------- positives
const positives = [];
function pos(expectRule, secret, template, minConfidence) {
  positives.push({
    id: expectRule + "-" + (positives.filter((p) => p.expectRule === expectRule).length + 1),
    expectRule,
    secret,
    minConfidence: minConfidence || "high",
    text: template.replace("{S}", secret)
  });
}

// AWS access key IDs
pos("aws-access-key-id", "AKIA" + pick(B32, 16),
  "here's my env, why does terraform still say AccessDenied?\nAWS_ACCESS_KEY_ID={S}\nAWS_DEFAULT_REGION=us-east-1");
pos("aws-access-key-id", "AKIA" + pick(B32, 16),
  "aws sts get-caller-identity --profile prod fails. Access key {S} was created yesterday.");
pos("aws-access-key-id", "ASIA" + pick(B32, 16),
  "the STS temp creds expire too fast: {S} - can you explain session duration?");

// AWS secret access key (context-anchored)
(function () {
  // 40 chars exactly, mixed case + separators like real ones
  const secret = "wJ" + pick(B62, 6) + "/" + pick(B62, 20) + "+" + pick(B62, 10);
  const akia = "AKIA" + pick(B32, 16);
  positives.push({
    id: "aws-secret-access-key-1",
    expectRule: "aws-secret-access-key",
    secret,
    minConfidence: "high",
    extraSecrets: [akia], // the credentials-file also contains a key id
    text: "[default]\naws_access_key_id = " + akia + "\naws_secret_access_key = " + secret + "\n"
  });
})();
(function () {
  const secret = "Xy" + pick(B62, 30) + "9" + pick(B62, 7);
  pos("aws-secret-access-key", secret,
    "export AWS_SECRET_ACCESS_KEY=\"{S}\" # why does boto3 ignore this?");
})();

// GitHub tokens
pos("github-token", "ghp_" + pick(B62, 36),
  "git clone fails with 403. I'm using {S} as the password, is that wrong?");
pos("github-token", "gho_" + pick(B62, 36),
  "the oauth flow returned {S} but the API says bad credentials");
pos("github-token", "ghs_" + pick(B62, 36),
  "GITHUB_TOKEN in the workflow expands to {S} - why can't it push?");
pos("github-token", "ghr_" + pick(B62, 36),
  "refresh token {S} came back from the device flow");
pos("github-pat-fine-grained", "github_pat_" + pick(B62, 22) + "_" + pick(B62, 59),
  "fine-grained PAT {S} gets 404 on the repos endpoint, classic PAT works");

// Slack
pos("slack-token", "xoxb-" + pick("0123456789", 12) + "-" + pick("0123456789", 13) + "-" + pick(B62, 24),
  "my bot token {S} suddenly returns invalid_auth");
pos("slack-token", "xoxp-" + pick("0123456789", 11) + "-" + pick("0123456789", 12) + "-" + pick("0123456789", 13) + "-" + pick(HEX, 32),
  "user token: {S}\nscopes: chat:write,users:read");

// Stripe
pos("stripe-live-key", "sk_live_" + pick(B62, 24),
  "charge fails in prod with {S} but works with the test key");
pos("stripe-live-key", "rk_live_" + pick(B62, 24),
  "restricted key {S} can't read balance transactions, which permission is missing?");
pos("stripe-test-key", "sk_test_" + pick(B62, 24),
  "in the sandbox I'm using {S} - is that supposed to see live data?", "medium");

// Google
pos("google-api-key", "AIza" + pick(B64URL, 35),
  "the Maps JS API rejects {S} with RefererNotAllowedMapError");
pos("google-api-key", "AIza" + pick(B64URL, 35),
  "curl 'https://generativelanguage.googleapis.com/v1beta/models?key={S}'");

// OpenAI
pos("openai-classic-key", "sk-" + pick(B62, 20) + "T3BlbkFJ" + pick(B62, 20),
  "openai.error.AuthenticationError with {S} - I copied it straight from the dashboard");
pos("openai-project-key", "sk-proj-" + pick(B64URL, 74),
  "OPENAI_API_KEY={S}\nOPENAI_ORG=org-acme");
pos("openai-generic-sk", "sk-" + pick(B62, 48),
  "the old key {S} still works, should I rotate it?", "medium");

// Anthropic
pos("anthropic-api-key", "sk-ant-api03-" + pick(B64URL, 58) + "-" + pick(B64URL, 6) + "AA",
  "ANTHROPIC_API_KEY={S} gives 401 authentication_error");
pos("anthropic-api-key", "sk-ant-" + pick(B64URL, 40),
  "why does {S} hit the rate limit so fast on Haiku?");

// JWTs (structurally valid: header decodes to JSON with alg)
(function () {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ sub: "1234567890", name: "Test User", iat: 1720000000 }));
  const sig = pick(B64URL, 43);
  pos("jwt", header + "." + payload + "." + sig,
    "the session cookie contains {S} - decode it for me?");
})();
(function () {
  const header = b64url(JSON.stringify({ alg: "RS256", kid: "abc123" }));
  const payload = b64url(JSON.stringify({ iss: "https://auth.example.com/", aud: "api", exp: 1720009999 }));
  const sig = pick(B64URL, 86);
  pos("jwt", header + "." + payload + "." + sig,
    "Authorization: Bearer {S}\nwhy is this rejected with 401 invalid_token?");
})();

// PEM
pos("pem-private-key", "-----BEGIN RSA PRIVATE KEY-----",
  "{S}\nMIIEow" + pick(B64STD, 58) + "\n" + pick(B64STD, 64) + "\n-----END RSA PRIVATE KEY-----\nwhy does ssh reject this identity file?");
pos("pem-private-key", "-----BEGIN OPENSSH PRIVATE KEY-----",
  "{S}\nb3BlbnNzaC1rZXktdjE" + pick(B64STD, 40) + "\n-----END OPENSSH PRIVATE KEY-----");
pos("pem-private-key", "-----BEGIN PRIVATE KEY-----",
  "my k8s tls secret decodes to:\n{S}\nMIGHAgEAMBMGByqGSM49" + pick(B64STD, 30) + "\n-----END PRIVATE KEY-----");

// Generic context-gated entropy (medium tier by design)
pos("generic-entropy", pick(B62, 32),
  "DB_PASSWORD={S}\nDB_HOST=10.0.3.7", "medium");
pos("generic-entropy", pick(B64STD, 40) + "==",
  "\"client_secret\": \"{S}\",", "medium");
pos("generic-entropy", pick(B62, 30),
  "export API_TOKEN=\"{S}\"", "medium");
pos("generic-entropy", pick(B64URL, 36),
  "curl -H 'Authorization: Bearer {S}' https://api.example.com/v1/me", "medium");
pos("generic-entropy", pick(B62, 28),
  "signing_key: {S}   # HMAC for webhook verification", "medium");

// ------------------------------------------------------------- negatives
const negatives = [
  { id: "neg-git-log", text: "commit 4f2a9c81d3b7e6a05c9f12ab34cd56ef78901234\nAuthor: Dev <dev@example.com>\n\n    fix flaky retry test\n\ncommit b7e6a05c9f12ab34cd56ef789012344f2a9c81d3\n    bump deps" },
  { id: "neg-git-short", text: "cherry-picked as 9c81d3b, reverted in a05c9f1, re-landed in 2ab34cd" },
  { id: "neg-uuid-json", text: "{\"requestId\":\"550e8400-e29b-41d4-a716-446655440000\",\"traceId\":\"f47ac10b-58cc-4372-a567-0e02b2c3d479\"}" },
  { id: "neg-uuid-prose", text: "The session token is stored under key 6ba7b810-9dad-11d1-80b4-00c04fd430c8 in Redis." },
  { id: "neg-b64-image", text: "background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==)" },
  { id: "neg-b64-font", text: "src: url(data:font/woff2;base64,d09GMgABAAAAAAQoAAoAAAAACPwAAAPdAAEAAAAAAAAAAAAA) format('woff2');" },
  { id: "neg-integrity-1", text: "\"integrity\": \"sha512-n5rEsB1M+PkxUXKhCpM8JMErDYhHeVAWCpM8JMErDYhHeVAWn5rEsB1MxUXKhCq0FvGm3Wq2Yz8pQ==\"" },
  { id: "neg-integrity-2", text: "\"node_modules/lodash\": {\n  \"version\": \"4.17.21\",\n  \"integrity\": \"sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg==\"\n}" },
  { id: "neg-sri-tag", text: "<script src=\"https://example.com/lib.js\" integrity=\"sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC\" crossorigin=\"anonymous\"></script>" },
  { id: "neg-docker-digest", text: "docker pull nginx@sha256:0d17b565c37bcbd895e9d92315a05c1c3c9a29f762b011a10c54a66cd53c9b31" },
  { id: "neg-docker-compose", text: "image: registry.example.com/app@sha256:b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9" },
  { id: "neg-hex-colors", text: ":root { --primary: #4f46e5; --accent: #f59e0b; --muted: #6b7280; --bg: #0f172a; --surface: #1e293b; }" },
  { id: "neg-long-url-1", text: "https://docs.example.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-saml/troubleshooting-saml-authentication#the-user-is-not-provisioned" },
  { id: "neg-long-url-2", text: "See https://www.google.com/maps/place/Golden+Gate+Bridge/@37.8199286,-122.4804438,17z/data=!3m1!4b1 for the meetup location." },
  { id: "neg-long-url-3", text: "https://registry.npmjs.org/@typescript-eslint/eslint-plugin/-/eslint-plugin-6.21.0.tgz" },
  { id: "neg-etag", text: "< HTTP/1.1 200 OK\n< ETag: \"5d8c72a5edda8d6a:0\"\n< Content-Length: 4523" },
  { id: "neg-cert-fingerprint", text: "SHA256 Fingerprint=A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90:A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90" },
  { id: "neg-machine-id", text: "cat /etc/machine-id\n9f8e7d6c5b4a39281706f5e4d3c2b1a0" },
  { id: "neg-kernel", text: "Linux build-42 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux" },
  { id: "neg-yarn-lock", text: "react@^18.2.0:\n  version \"18.2.0\"\n  resolved \"https://registry.yarnpkg.com/react/-/react-18.2.0.tgz#555bd98592883255fa00de14f1151a917b5d77d5\"" },
  { id: "neg-go-sum", text: "github.com/stretchr/testify v1.8.4/go.mod h1:sz/lmYIOXD/1dqDmKjjqLyZ2RngseejIcXlSw2iwfAo=" },
  { id: "neg-code-ids", text: "const authorizationHeader = buildAuthorizationHeaderFromRequestContext(ctx);\nif (!authorizationHeader) throw new UnauthorizedError();" },
  { id: "neg-code-const", text: "const DEFAULT_RETRY_BACKOFF_MILLISECONDS = 250;\nconst MAX_CONCURRENT_UPLOADS_PER_WORKER = 8;" },
  { id: "neg-password-prose", text: "Password policy: minimum 14 characters, at least one digit, rotated every 90 days. Password reuse across environments is forbidden." },
  { id: "neg-token-prose", text: "The lexer produces a token stream; each token carries its source position for error reporting. Token types are defined in tokens.ts." },
  { id: "neg-secret-prose", text: "Keep the signing secret in your secret manager, never in the repo. The secret name should follow the team convention." },
  { id: "neg-api-key-docs", text: "To authenticate, pass your API key in the X-Api-Key header. You can create an API key on the settings page. Keep your api key private." },
  { id: "neg-csv-ids", text: "order_id,customer_ref,total\nORD-2026-000381,CUST-8842,129.99\nORD-2026-000382,CUST-1204,58.00" },
  { id: "neg-base32-2fa-prose", text: "Scan the QR code with your authenticator app, or note down the recovery codes shown once during setup." },
  { id: "neg-py-hashlib", text: "import hashlib\n\ndef digest(path):\n    h = hashlib.sha256()\n    with open(path, 'rb') as f:\n        for chunk in iter(lambda: f.read(8192), b''):\n            h.update(chunk)\n    return h.hexdigest()" },
  { id: "neg-js-crypto", text: "const hash = crypto.createHash('sha256').update(payload).digest('hex');\nres.setHeader('x-content-digest', hash);" },
  { id: "neg-requirements", text: "numpy==1.26.4\npandas==2.2.2\nscikit-learn==1.4.2\nrequests==2.32.3" },
  { id: "neg-k8s-name", text: "pod/api-server-7d9f8b6c54-x2vqk   1/1   Running   0   4d2h\npod/worker-6b7f9d8c45-mn8lp      1/1   Running   2   4d2h" },
  { id: "neg-semver-hashes", text: "app@2.14.3+build.1852.gf9e8d7c deployed; previous release was app@2.14.2+build.1798.ga1b2c3d" },
  { id: "neg-css-grid", text: ".grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }" },
  { id: "neg-sql", text: "UPDATE user_sessions SET expires_at = now() + interval '30 minutes' WHERE session_id = 1829471;" },
  { id: "neg-cron", text: "0 3 * * * /usr/local/bin/backup.sh --full --retain 14 >> /var/log/backup.log 2>&1" },
  { id: "neg-mac-addr", text: "eth0: link up, MAC 3c:22:fb:9a:41:d8, MTU 9000" },
  { id: "neg-ipv6", text: "listening on [2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8443" },
  { id: "neg-b32-ulid", text: "event id 01J2Qln3RT5XKWBZ0Y8FA6GQ2M logged at 14:02:11 (ULIDs sort lexicographically)" },
  { id: "neg-vin", text: "The VIN 1HGCM82633A004352 decodes to a 2003 Honda Accord EX." },
  { id: "neg-jwt-lookalike", text: "the tutorial shows a fake token eyJhbGciOi.eyJzdWIiOi.c2lnbmF0dXJl but it's truncated placeholder text, not a real JWT" },
  // Redacted placeholders and canonical docs examples - these appear verbatim
  // in READMEs and tutorials all over the internet and must NOT be flagged.
  { id: "neg-google-placeholder", text: "Set GOOGLE_MAPS_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX in .env.local (get a key from the Cloud console)." },
  { id: "neg-ghp-placeholder", text: "export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # replace with your PAT" },
  { id: "neg-slack-placeholder", text: "SLACK_BOT_TOKEN=xoxb-your-bot-token-here goes in the app config; find yours under OAuth & Permissions." },
  { id: "neg-aws-docs-example", text: "The AWS documentation uses aws_access_key_id = AKIAIOSFODNN7EXAMPLE and aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY as its canonical sample pair." }
];

module.exports = { positives, negatives };
