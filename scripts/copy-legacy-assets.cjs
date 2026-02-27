/**
 * Copy built assets to legacy filenames that cached index.html may reference.
 * Rool host CDN serves stale index.html; this ensures old HTML loads our current assets.
 */
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "../dist/assets");

const legacy = [
  ["index.js", "index-B_rwgBJR.js"],
  ["index.css", "index-BD3U6wCH.css"],
  ["index.js", "index-k9AX46oR.js"],
  ["index.js", "index-k9AX460R.js"],
];

for (const [src, dest] of legacy) {
  const srcPath = path.join(dir, src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(dir, dest));
  }
}
