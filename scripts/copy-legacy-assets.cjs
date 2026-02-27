/**
 * Copy built assets to legacy filenames that cached index.html may reference.
 * Rool host CDN serves stale index.html; this ensures old HTML loads our current assets.
 */
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "../dist/assets");

// Automatically find the current built files
const files = fs.readdirSync(dir);
const currentJs = files.find(f => f.startsWith("index-") && f.endsWith(".js"));
const currentCss = files.find(f => f.startsWith("index-") && f.endsWith(".css"));

console.log(`Current JS: ${currentJs}`);
console.log(`Current CSS: ${currentCss}`);

const legacyJs = [
  "index-B_rwgBJR.js",
  "index-k9AX46oR.js",
  "index-k9AX460R.js",
  "index-BguAxMGL.js",
  "index-D9UTSra9.js",
  "index-BzsZuzFu.js", // From Step 828
  "index-CVYxUthX.js", // From Step 904
];

const legacyCss = [
  "index-BD3U6wCH.css",
  "index-DtiyZExr.css",
  "index-ezVMZviE.css",
  "index-B285skHp.css", // From Step 904
];

if (currentJs) {
  for (const dest of legacyJs) {
    if (dest === currentJs) continue;
    fs.copyFileSync(path.join(dir, currentJs), path.join(dir, dest));
    console.log(`  Map: ${currentJs} -> ${dest}`);
  }
}

if (currentCss) {
  for (const dest of legacyCss) {
    if (dest === currentCss) continue;
    fs.copyFileSync(path.join(dir, currentCss), path.join(dir, dest));
    console.log(`  Map: ${currentCss} -> ${dest}`);
  }
}
