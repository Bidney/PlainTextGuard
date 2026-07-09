// Shim to load the extension's src/rules.js (an IIFE that attaches to `window`)
// into Node without modifying the repo file.
"use strict";

const path = require("path");

const REPO = path.resolve(__dirname, "..", "..");
const RULES_PATH = path.join(REPO, "src", "rules.js");

if (typeof global.window === "undefined") {
  global.window = {};
}

require(RULES_PATH); // IIFE runs, attaches window.PlainTextGuardRules

module.exports = global.window.PlainTextGuardRules;
