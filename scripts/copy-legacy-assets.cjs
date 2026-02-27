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
  ["index.js", "index-BguAxMGL.js"],  // From Step 426
  ["index.css", "index-DtiyZExr.css"], // From Step 426
  ["index.js", "index-D9UTSra9.js"],  // From Step 531
  ["index.css", "index-ezVMZviE.css"], // From Step 531
];

for (const [src, dest] of legacy) {
  const srcPath = path.join(dir, src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(dir, dest));
  }
}
