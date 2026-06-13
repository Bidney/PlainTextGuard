import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

function fail(message) {
  console.error(`Validation failed: ${message}`);
  process.exit(1);
}

function assertFile(filePath) {
  if (!fs.existsSync(path.join(root, filePath))) {
    fail(`Missing required file: ${filePath}`);
  }
}

if (manifest.manifest_version !== 3) {
  fail("manifest_version must be 3");
}

if (!manifest.name || !manifest.version || !manifest.description) {
  fail("manifest must include name, version, and description");
}

const permissions = manifest.permissions || [];
if (permissions.includes("clipboardRead")) {
  fail("clipboardRead permission is not allowed for this project");
}

const allowedPermissions = new Set(["storage", "clipboardWrite"]);
for (const permission of permissions) {
  if (!allowedPermissions.has(permission)) {
    fail(`Unexpected permission: ${permission}`);
  }
}

assertFile("src/rules.js");
assertFile("src/ai-copy-guard.js");
assertFile("src/ai-copy-guard.css");
assertFile("src/popup.html");
assertFile("src/popup.js");
assertFile("src/popup.css");
assertFile("assets/icon16.png");
assertFile("assets/icon48.png");
assertFile("assets/icon128.png");
assertFile("PRIVACY.md");
assertFile("LICENSE");

for (const script of manifest.content_scripts || []) {
  for (const jsFile of script.js || []) assertFile(jsFile);
  for (const cssFile of script.css || []) assertFile(cssFile);
}

console.log(`PlainText Guard ${manifest.version} validation passed.`);
