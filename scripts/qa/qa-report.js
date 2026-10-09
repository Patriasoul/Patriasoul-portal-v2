const fs = require("fs");
const path = require("path");
const root = process.cwd();
const outputDir = path.join(root, "qa-report");
fs.mkdirSync(outputDir, { recursive: true });
const ignored = new Set([".git", "node_modules", "_site", "dist", "coverage", "qa-report"]);
const htmlFiles = [];
const issues = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".well-known" && entry.name !== ".github") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (!ignored.has(entry.name)) walk(full); }
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) htmlFiles.push(full);
  }
}
function add(severity, code, file, detail) {
  issues.push({ severity, code, file: path.relative(root, file).replace(/\\/g, "/"), detail });
}
function attr(tag, name) {
  const m = tag.match(new RegExp("\\b" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i"));
  return m ? m[2].trim() : "";
}
function resolveLocal(fromFile, raw) {
  const value = raw.split("#")[0].split("?")[0].trim();
  if (!value || value.startsWith("#") || /^(https?:|mailto:|tel:|javascript:|data:|blob:|\/\/)/i.test(value)) return null;
  let candidate;
  if (value.startsWith("/")) {
    candidate = path.join(root, value.replace(/^\/+/, ""));
    if (fs.existsSync(candidate)) return candidate;
    const base = "/Patriasoul-portal-v2/";
    if (value.startsWith(base)) candidate = path.join(root, value.slice(base.length));
  } else {
    try { candidate = path.resolve(path.dirname(fromFile), decodeURIComponent(value)); }
    catch { candidate = path.resolve(path.dirname(fromFile), value); }
  }
  if (!path.extname(candidate) && fs.existsSync(path.join(candidate, "index.html"))) candidate = path.join(candidate, "index.html");
  return candidate;
}
walk(root);
htmlFiles.sort();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const title = (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [,""])[1].replace(/<[^>]+>/g, "").trim();
  const descriptionTag = (html.match(/<meta\b(?=[^>]*\bname\s*=\s*["']description["'])[^>]*>/i) || ["",""])[0];
  const descContent = attr(descriptionTag, "content");
  if (!title) add("error", "missing-title", file, "Nedostaje ili je prazan title.");
  if (!descContent) add("warning", "missing-description", file, "Nedostaje meta description ili nema content.");
  if (/\b(TODO|TBD|LOREM IPSUM|PLACEHOLDER TEXT|OVDJE DODATI)\b/i.test(html)) add("warning", "placeholder-text", file, "Pronađen mogući privremeni tekst; potrebna je ručna potvrda.");
  const tags = [...html.matchAll(/<(a|img|script|link|source)\b[^>]*>/gi)].map(function(m) { return { tag: m[1].toLowerCase(), raw: m[0] }; });
  for (const item of tags) {
    const name = item.tag === "a" || item.tag === "link" ? "href" : "src";
    const value = attr(item.raw, name);
    if ((item.tag === "img" || item.tag === "script" || item.tag === "link" || item.tag === "source") && !value && !(item.tag === "source" && attr(item.raw, "srcset"))) {
      if (item.tag === "img") add("error", "image-missing-src", file, "Slika nema src atribut.");
      continue;
    }
    if (item.tag === "img" && !/\balt\s*=/i.test(item.raw)) add("warning", "image-missing-alt", file, "Slika nema alt atribut.");
    if (!value) continue;
    const target = resolveLocal(file, value);
    if (target && !fs.existsSync(target)) add(item.tag === "img" ? "error" : "warning", item.tag === "img" ? "local-image-missing" : "local-link-missing", file, name + "=\"" + value + "\" ne vodi do lokalne datoteke.");
  }
  if (/^clanci\//.test(rel) && /clanak-.*\.html$/i.test(rel)) {
    const plain = html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
    if (plain.length < 900) add("warning", "article-possibly-incomplete", file, "Članak ima približno " + plain.length + " znakova vidljivog teksta; provjeriti potpunost.");
    if (!/<h1\b/i.test(html)) add("warning", "article-missing-h1", file, "Članak nema prepoznatljiv H1 naslov.");
  }
}
const counts = issues.reduce(function(acc, issue) { acc[issue.severity] = (acc[issue.severity] || 0) + 1; return acc; }, {});
const report = { generatedAt: new Date().toISOString(), repository: "Patriasoul/Patriasoul-portal-v2", htmlFilesScanned: htmlFiles.length, issueCount: issues.length, counts: counts, issues: issues };
fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2) + "\n");
const lines = ["# PatriaSoul v2 — izvještaj nadzora kvalitete", "", "- Vrijeme izrade: " + report.generatedAt, "- Pregledane HTML stranice: **" + report.htmlFilesScanned + "**", "- Ukupno upozorenja i grešaka: **" + issues.length + "**", "- Greške: **" + (counts.error || 0) + "**", "- Upozorenja: **" + (counts.warning || 0) + "**", "", "> Izvještaj je pomoćna provjera. Vanjske slike i poveznice ne provjeravaju se uživo; sumnjive nalaze treba ručno potvrditi.", ""];
if (!issues.length) lines.push("Nisu pronađeni problemi u provjerama koje ovaj izvještaj obuhvaća.");
else {
  for (const severity of ["error", "warning"]) {
    const subset = issues.filter(function(issue) { return issue.severity === severity; });
    if (!subset.length) continue;
    lines.push("## " + (severity === "error" ? "Greške" : "Upozorenja") + " (" + subset.length + ")", "");
    for (const issue of subset) lines.push("- **" + issue.code + "** — " + issue.file + ": " + issue.detail);
    lines.push("");
  }
}
fs.writeFileSync(path.join(outputDir, "report.md"), lines.join("\n") + "\n");
console.log("QA izvještaj: " + htmlFiles.length + " HTML stranica; " + (counts.error || 0) + " grešaka; " + (counts.warning || 0) + " upozorenja.");
console.log("Datoteke: qa-report/report.md, qa-report/report.json");
