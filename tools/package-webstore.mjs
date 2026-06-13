import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const distDir = path.join(root, "dist");
const packageName = `plaintext-guard-webstore-${manifest.version}.zip`;
const outputPath = path.join(distDir, packageName);

fs.mkdirSync(distDir, { recursive: true });
if (fs.existsSync(outputPath)) fs.rmSync(outputPath);

const files = [
  "manifest.json",
  "src/rules.js",
  "src/ai-copy-guard.js",
  "src/ai-copy-guard.css",
  "src/popup.html",
  "src/popup.js",
  "src/popup.css",
  "assets/icon16.png",
  "assets/icon48.png",
  "assets/icon128.png"
];

for (const file of files) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing package file: ${file}`);
  }
}

execFileSync("zip", ["-q", "-r", outputPath, ...files], { cwd: root, stdio: "inherit" });
console.log(`Created ${outputPath}`);
console.log("Chrome Web Store upload check: manifest.json is at the ZIP root.");
