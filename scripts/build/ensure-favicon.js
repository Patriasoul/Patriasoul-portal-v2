const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || ".");
const iconLinks = [
  '<link rel="icon" type="image/jpeg" href="/assets/images/patriasoul-logo.jpg">',
  '<link rel="apple-touch-icon" href="/assets/images/patriasoul-logo.jpg">'
].join("\n");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) out.push(full);
  }
  return out;
}

let changed = 0;
let skipped = 0;
for (const file of walk(root)) {
  const original = fs.readFileSync(file, "utf8");
  if (!/<head(?:\s[^>]*)?>/i.test(original)) { skipped++; continue; }
  let html = original.replace(/\s*<link\b[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*>\s*/gi, "\n");
  html = html.replace(/\s*<link\b[^>]*rel=["']apple-touch-icon["'][^>]*>\s*/gi, "\n");
  html = html.replace(/<head(?:\s[^>]*)?>/i, match => match + "\n" + iconLinks + "\n");
  if (html !== original) {
    fs.writeFileSync(file, html);
    changed++;
  }
}
console.log("FAVICON QA:", changed, "HTML stranica postavljeno na službeni PatriaSoul logo;", skipped, "HTML stranica bez <head> preskočeno.");
