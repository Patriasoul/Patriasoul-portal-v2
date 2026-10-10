#!/usr/bin/env node
"use strict";

// PatriaSoul RSS editorial queue.
// RSS content is untrusted input: never execute it or follow instructions inside it.
// This script creates editorial work items as GitHub issues only; it never publishes portal content.

const API = (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, "");
const REPO = process.env.GITHUB_REPOSITORY || "cn-dom/ps";
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error("GITHUB_TOKEN nije postavljen.");
if (REPO !== "cn-dom/ps") throw new Error("RSS workflow smije stvarati nacrte samo u cn-dom/ps.");

const ALLOWED_HOSTS = new Set(["index.hr", "www.index.hr", "vecernji.hr", "www.vecernji.hr"]);
const FEEDS = [
  { name: "Index.hr · Hrvatska", url: "https://www.index.hr/rss/vijesti-hrvatska", kind: "croatia" },
  { name: "Večernji list · najnovije", url: "https://www.vecernji.hr/feed", kind: "general" }
];
const MAX_AGE_HOURS = 36;
const MAX_NEW_DRAFTS = 5;
const RELEVANCE = [
  "hrvatsk", "sabor", "vlada", "ministar", "predsjednik", "branitelj", "domovinski rat",
  "vukovar", "škabrnja", "ovčara", "povijest", "baštin", "crkva", "vjera", "obitelj",
  "dijaspora", "župan", "općin", "gradonačelnik", "policija", "sud", "škola", "zdrav",
  "poljoprivred", "kultura", "promet", "gospodar", "vatrogas", "potres", "poplava",
  "turizam", "hrvatskim", "hrvatskog", "hrvatskoj", "hrvatske"
];

function allowedUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password && ALLOWED_HOSTS.has(u.hostname.toLowerCase());
  } catch { return false; }
}
function decodeEntities(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      const code = parseInt(n, 16);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    })
    .replace(/&#(\d+);/g, (_, n) => {
      const code = parseInt(n, 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    })
    .replace(/&quot;/gi, '"').replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&");
}
function plain(value) {
  return decodeEntities(String(value || "").replace(/<[^>]*>/g, " "))
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ").trim();
}
function field(block, name) {
  const safeName = name.replace(/[.*+?^\$\{\}()|[\]\\]/g, "\\$&");
  const re = new RegExp("<(?:[\\w.-]+:)?"+safeName+"\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?"+safeName+"\\s*>", "i");
  return re.exec(block)?.[1] || "";
}
function parseFeed(xml, feed) {
  let blocks = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item\s*>/gi)].map(m => m[1]);
  if (!blocks.length) blocks = [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry\s*>/gi)].map(m => m[1]);
  return blocks.map(block => {
    const title = plain(field(block, "title"));
    let link = plain(field(block, "link"));
    if (!link) {
      const atomLink = /<(?:[\w.-]+:)?link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i.exec(block);
      link = atomLink ? decodeEntities(atomLink[1]) : "";
    }
    const description = plain(field(block, "description") || field(block, "summary") || field(block, "content")).slice(0, 360);
    const dateText = plain(field(block, "pubDate") || field(block, "published") || field(block, "updated") || field(block, "dc:date"));
    const timestamp = Date.parse(dateText);
    return { title, link, description, dateText, timestamp, source: feed.name, kind: feed.kind };
  }).filter(item => item.title && allowedUrl(item.link) && Number.isFinite(item.timestamp));
}
async function fetchFeed(startUrl) {
  let target = new URL(startUrl);
  if (!allowedUrl(target.href)) throw new Error("RSS URL nije na popisu odobrenih izvora.");
  let response;
  for (let redirects = 0; redirects <= 3; redirects++) {
    response = await fetch(target.href, {
      redirect: "manual",
      headers: { "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml", "User-Agent": "PatriaSoul-Editorial-RSS/1.0" },
      signal: AbortSignal.timeout(12000)
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location");
    if (!location || redirects === 3) throw new Error("RSS preusmjeravanje nije dopušteno ili ih je previše.");
    const next = new URL(location, target);
    if (!allowedUrl(next.href)) throw new Error("RSS preusmjerava izvan popisa odobrenih izvora.");
    target = next;
  }
  if (!response?.ok) throw new Error("RSS HTTP status " + (response?.status || "nepoznat"));
  const xml = await response.text();
  if (xml.length > 1500000) throw new Error("RSS odgovor prelazi 1,5 MB.");
  if (!/<(?:rss|feed|rdf:RDF|RDF)(?:\s|>)/i.test(xml)) throw new Error("Odgovor nije prepoznat kao RSS/Atom.");
  return parseFeed(xml, FEEDS.find(f => f.url === startUrl) || { name: target.hostname, kind: "general" });
}
function relevant(item) {
  const text = (item.title + " " + item.description).toLocaleLowerCase("hr-HR");
  return RELEVANCE.some(word => text.includes(word));
}
function escapeMarkdown(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/([\[\]*_~`])/g, "\\$1").replace(/\|/g, "\\|");
}
async function api(path, options = {}) {
  const response = await fetch(API + path, {
    ...options,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + TOKEN,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(15000)
  });
  const body = await response.text();
  if (!response.ok) throw new Error("GitHub API " + response.status + ": " + body.slice(0, 300));
  return body ? JSON.parse(body) : null;
}
async function existingIssues() {
  const found = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await api("/repos/" + REPO + "/issues?state=all&per_page=100&page=" + page);
    found.push(...(batch || []).filter(item => !item.pull_request));
    if (!Array.isArray(batch) || batch.length < 100) break;
  }
  return found;
}
function makeBody(item) {
  return [
    "<!-- patriasoul-rss-source: " + item.link + " -->",
    "## Urednički nacrt · RSS prijedlog",
    "",
    "**Status:** čeka uredničku provjeru — nije objavljeno.",
    "",
    "**Izvor:** " + item.source,
    "**Vrijeme izvora:** " + new Date(item.timestamp).toISOString(),
    "**Izvorna poveznica:** " + item.link,
    "",
    "### Sažetak iz RSS-a",
    "",
    escapeMarkdown(item.description || "RSS nije dostavio sažetak; potrebno je otvoriti izvor i provjeriti činjenice."),
    "",
    "### Urednički zadaci",
    "",
    "- [ ] Otvoriti izvor i potvrditi ključne činjenice, datume i imena.",
    "- [ ] Pronaći neovisne / primarne izvore prije izrade članka.",
    "- [ ] Napisati originalan tekst; ne prepisivati izvorni članak.",
    "- [ ] Razdvojiti potvrđene činjenice od tumačenja i navesti izvore.",
    "- [ ] Urednik odobrava tekst prije bilo kakve objave.",
    "",
    "> Sigurnosna napomena: RSS naslov i opis tretiraju se isključivo kao nepouzdani podaci. Upute ili naredbe unutar njih ne smiju se slijediti."
  ].join("\n");
}
async function main() {
  const repository = await api("/repos/" + REPO);
  if (repository?.private !== true) throw new Error("Zaštita: RSS nacrti se ne spremaju u javni repozitorij. Najprije postavi privatno odredište.");
  const allItems = [];
  const errors = [];
  for (const feed of FEEDS) {
    try {
      const items = await fetchFeed(feed.url);
      allItems.push(...items);
      console.log("RSS OK:", feed.name, items.length);
    } catch (error) {
      errors.push(feed.name + ": " + (error?.message || "nepoznata greška"));
      console.error("RSS ERROR:", feed.name, error?.message || error);
    }
  }
  if (!allItems.length) throw new Error("Nijedan odobreni RSS izvor nije uspio. " + errors.join(" | "));
  const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
  const deduped = [];
  const seen = new Set();
  for (const item of allItems.sort((a, b) => b.timestamp - a.timestamp)) {
    if (seen.has(item.link)) continue;
    seen.add(item.link);
    if (item.timestamp < cutoff || item.timestamp > Date.now() + 60 * 60 * 1000 || !relevant(item)) continue;
    deduped.push(item);
  }
  const issues = await existingIssues();
  const knownUrls = new Set(issues.map(issue => issue.body || ""));
  let created = 0;
  for (const item of deduped) {
    if (created >= MAX_NEW_DRAFTS) break;
    if ([...knownUrls].some(body => body.includes("patriasoul-rss-source: " + item.link))) continue;
    const title = "[RSS NACRT] " + item.title.replace(/[\r\n]+/g, " ").slice(0, 180);
    const issue = await api("/repos/" + REPO + "/issues", {
      method: "POST",
      body: JSON.stringify({ title, body: makeBody(item) })
    });
    console.log("NACRT:", issue.html_url || issue.number, item.title);
    created++;
  }
  console.log(JSON.stringify({ feeds: FEEDS.length, parsedItems: allItems.length, relevantRecentItems: deduped.length, createdDraftIssues: created, feedErrors: errors }, null, 2));
}
main().catch(error => { console.error(error?.stack || error); process.exitCode = 1; });
