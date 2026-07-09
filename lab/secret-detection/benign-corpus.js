// Benign corpus: realistic text a developer might legitimately copy or paste
// into an AI chat site. None of these contain secrets. Every flag raised on
// these samples is a false positive relative to the owner's stated goal
// (detect API keys / secrets at paste time).
"use strict";

const SAMPLES = [
  // ---------------------------------------------------------------- plain-tech
  {
    id: "tech-01",
    category: "plain-tech",
    text: "This library provides robust error handling and automatic retries with exponential backoff. Failures are logged with structured context."
  },
  {
    id: "tech-02",
    category: "plain-tech",
    text: "We leverage the GitHub REST API to fetch pull request metadata and cache it locally for an hour."
  },
  {
    id: "tech-03",
    category: "plain-tech",
    text: "Migrating from Postgres 14 to Postgres 16 requires a full dump and restore because of the catalog changes."
  },
  {
    id: "tech-04",
    category: "plain-tech",
    text: "The payload travels from the client to the server over a persistent WebSocket connection."
  },
  {
    id: "tech-05",
    category: "plain-tech",
    text: "fix: unlock the mutex before returning early from the request handler\n\nWithout this, a timeout in the middle of a batch left the lock held forever."
  },
  {
    id: "tech-06",
    category: "plain-tech",
    text: "Code review: this looks robust overall. Could we elevate the log level to warn when the retry budget is exhausted, so operators notice sooner?"
  },
  {
    id: "tech-07",
    category: "plain-tech",
    text: "Seamless integration with your existing CI pipeline: add one job to the workflow and the scanner runs on every push."
  },
  {
    id: "tech-08",
    category: "plain-tech",
    text: "It is important to note that the cache is invalidated on every deploy, so the first request after a release is slow."
  },
  {
    id: "tech-09",
    category: "plain-tech",
    text: "Not only does batching reduce request latency, but also improves throughput under sustained load."
  },
  {
    id: "tech-10",
    category: "plain-tech",
    text: "In this chapter we delve into the internals of the V8 garbage collector and how scavenging differs from mark-compact."
  },
  {
    id: "tech-11",
    category: "plain-tech",
    text: "Whether you're running on bare metal or on Kubernetes, the operator handles rolling upgrades for you."
  },
  {
    id: "tech-12",
    category: "plain-tech",
    text: "Supported runtimes range from Node 18 to Node 22. Older versions may work but are untested."
  },
  {
    id: "tech-13",
    category: "plain-tech",
    text: "chore: rotate application logs from /var/log/app to /var/log/archive nightly via cron"
  },
  {
    id: "tech-14",
    category: "plain-tech",
    text: "Rename the feature flag before we unlock the beta for external users. The flag name leaks the internal project codename."
  },
  {
    id: "tech-15",
    category: "plain-tech",
    text: "The migration copies rows from the staging table to the partitioned table in batches of 10000, pausing between batches to keep replication lag low."
  },
  {
    id: "tech-16",
    category: "plain-tech",
    text: "docs: clarify how to upgrade from v2 to v3 of the SDK, including the breaking change to the pagination cursor."
  },

  // ---------------------------------------------------------------- control (no trigger words)
  {
    id: "ctrl-01",
    category: "control",
    text: "The parser reads the input stream and emits a token for each lexeme. Whitespace is skipped unless the grammar marks it significant."
  },
  {
    id: "ctrl-02",
    category: "control",
    text: "Refactor complete. All 214 unit tests pass locally and in CI. No behavior changes intended."
  },
  {
    id: "ctrl-03",
    category: "control",
    text: "Please rebase your branch on main and squash the fixup commits before merging."
  },
  {
    id: "ctrl-04",
    category: "control",
    text: "The scheduler wakes every 500 ms, scans the ready queue, and dispatches at most eight jobs per tick."
  },

  // ---------------------------------------------------------------- multilingual
  {
    id: "lang-fr-01",
    category: "multilingual",
    text: "Le café est prêt. À bientôt !"
  },
  {
    id: "lang-fr-02",
    category: "multilingual",
    text: "Veuillez vérifier les paramètres réseau avant de relancer le déploiement."
  },
  {
    id: "lang-de-01",
    category: "multilingual",
    text: "Die Größe der Datei überschreitet das Limit. Bitte prüfen Sie die Einstellungen und versuchen Sie es erneut."
  },
  {
    id: "lang-de-02",
    category: "multilingual",
    text: "Herr Müller hat die Änderungen schon übernommen."
  },
  {
    id: "lang-es-01",
    category: "multilingual",
    text: "La configuración se actualizó con éxito. ¡Buena suerte con el lanzamiento de mañana!"
  },
  {
    id: "lang-ru-01",
    category: "multilingual",
    text: "Пожалуйста, проверьте настройки перед запуском сервиса."
  },
  {
    id: "lang-zh-01",
    category: "multilingual",
    text: "配置文件已更新，请重新启动服务以使更改生效。"
  },
  {
    id: "lang-ja-01",
    category: "multilingual",
    text: "設定を保存しました。サービスを再起動してください。"
  },
  {
    id: "lang-ko-01",
    category: "multilingual",
    text: "설정이 저장되었습니다. 서비스를 다시 시작하세요."
  },
  {
    id: "lang-emoji-01",
    category: "multilingual",
    text: "Deployed to prod \u{1F389}\u{1F680} all checks green ✅"
  },
  {
    id: "lang-mixed-01",
    category: "multilingual",
    text: "Danke schön! Merci beaucoup ! 谢谢!"
  },

  // ---------------------------------------------------------------- symbols
  {
    id: "sym-01",
    category: "symbols",
    text: "The GPU stabilizes at 72°C under sustained load with the stock cooler."
  },
  {
    id: "sym-02",
    category: "symbols",
    text: "Pricing: €49.99 per seat (about £42 or ¥6800 at current rates)."
  },
  {
    id: "sym-03",
    category: "symbols",
    text: "Acme™ and Widget® are registered trademarks of Acme Corp. © 2026 Acme Corp."
  },
  {
    id: "sym-04",
    category: "symbols",
    text: "Use a 4.7 kΩ pull-up resistor, ±5% tolerance is fine."
  },
  {
    id: "sym-05",
    category: "symbols",
    text: "π ≈ 3.14159, so the area is πr² — close enough for the estimate."
  },
  {
    id: "sym-06",
    category: "symbols",
    text: "It’s done — finally. She said “ship it” and we shipped it…"
  },

  // ---------------------------------------------------------------- code
  {
    id: "code-js-01",
    category: "code",
    text: "const results = await Promise.all(urls.map(async (url) => {\n  const res = await fetch(url, { signal: controller.signal });\n  if (!res.ok) throw new Error(`HTTP ${res.status}`);\n  return res.json();\n}));"
  },
  {
    id: "code-py-01",
    category: "code",
    text: "def chunked(iterable, size):\n    buf = []\n    for item in iterable:\n        buf.append(item)\n        if len(buf) == size:\n            yield buf\n            buf = []\n    if buf:\n        yield buf"
  },
  {
    id: "code-sh-01",
    category: "code",
    text: "git fetch origin\ngit switch -c fix/timeout origin/main\nnpm ci\nnpm test -- --grep 'retry'"
  },
  {
    id: "code-json-01",
    category: "code",
    text: "{\n  \"name\": \"sample-app\",\n  \"version\": \"2.4.1\",\n  \"scripts\": {\n    \"build\": \"tsc -p tsconfig.json\",\n    \"test\": \"vitest run\"\n  }\n}"
  },
  {
    id: "code-sql-01",
    category: "code",
    text: "SELECT o.id, o.total\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nWHERE o.created_at >= now() - interval '7 days'\nORDER BY o.total DESC\nLIMIT 20;"
  },
  {
    id: "code-yaml-01",
    category: "code",
    text: "jobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test"
  },
  {
    id: "code-diff-01",
    category: "code",
    text: "--- a/src/retry.js\n+++ b/src/retry.js\n@@ -12,7 +12,7 @@\n-  const delay = base * attempt;\n+  const delay = base * 2 ** attempt;\n   await sleep(delay);"
  },
  {
    id: "code-log-01",
    category: "code",
    text: "2026-07-08T14:12:03Z INFO server listening on :8080\n2026-07-08T14:12:09Z WARN upstream latency 812ms exceeds budget\n2026-07-08T14:12:10Z INFO request completed status=200 bytes=5123"
  }
];

module.exports = SAMPLES;
