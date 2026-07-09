// Part 1.3: demonstrate the data destruction caused by
// cleanText(text, { strictAscii: true }) on multilingual / symbol text.
"use strict";

const rules = require("./load-rules");

const CASES = [
  "café",
  "naïve résumé",
  "jalapeño",
  "façade",
  "Herr Müller aus Zürich",
  "Die Größe überschreitet das Limit",
  "La configuración se actualizó con éxito",
  "Пожалуйста, проверьте настройки",
  "配置文件已更新，请重新启动服务",
  "設定を保存しました",
  "설정이 저장되었습니다",
  "Price: €49.99 (£42, ¥6800)",
  "GPU at 72°C",
  "Acme™ Widget® © 2026",
  "4.7 kΩ ±5%",
  "π ≈ 3.14159, area = πr²",
  "Deployed \u{1F389}\u{1F680} all green ✅",
  "Zürich → Genève express", // arrow IS on the safe list, umlauts are not
  "It’s done — “ship it”…" // fully on the safe list: survives via replacements
];

function visible(s) {
  return s === "" ? "(empty string)" : JSON.stringify(s);
}

console.log("=".repeat(78));
console.log("cleanText(text, { strictAscii: true }) - data-destruction demonstration");
console.log("=".repeat(78));
console.log("");
console.log("original".padEnd(42) + "cleaned (strictAscii)".padEnd(38) + "chars lost");
console.log("-".repeat(96));

let totalIn = 0, totalOut = 0;
for (const original of CASES) {
  const cleaned = rules.cleanText(original, { strictAscii: true });
  const inLen = Array.from(original).length;
  const outLen = Array.from(cleaned).length;
  totalIn += inLen;
  totalOut += outLen;
  const lost = inLen - outLen;
  const lostPct = ((100 * Math.max(lost, 0)) / inLen).toFixed(0) + "%";
  console.log(
    visible(original).padEnd(42) +
    visible(cleaned).padEnd(38) +
    (lost > 0 ? lost + " (" + lostPct + ")" : (lost < 0 ? "expanded" : "0"))
  );
}

console.log("-".repeat(96));
console.log(
  "TOTAL: " + totalIn + " chars in -> " + totalOut + " chars out (" +
  ((100 * (totalIn - totalOut)) / totalIn).toFixed(1) + "% of all characters silently deleted)"
);
console.log("\nNote: characters on the curated SAFE_REPLACEMENT_RULES list are transliterated");
console.log("(em dash -> '-', smart quotes -> straight quotes), but EVERY other non-ASCII");
console.log("character is deleted outright: accents, whole non-Latin scripts, currency,");
console.log("degrees, trademark signs, emoji. 'café' -> 'caf' class corruption.");
