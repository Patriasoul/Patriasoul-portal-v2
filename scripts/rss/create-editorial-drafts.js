#!/usr/bin/env node
"use strict";

// PatriaSoul RSS -> private Supabase editorial queue.
// RSS is untrusted input: no embedded instructions are executed or followed.
// This job only inserts review candidates. It never generates or publishes articles.

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL)) throw new Error("SUPABASE_URL nije postavljen ili nije valjan.");
if (!SERVICE_KEY) throw new Error("Nedostaje GitHub Actions tajna SUPABASE_SERVICE_ROLE_KEY. RSS nacrti nisu spremljeni.");

const ALLOWED_HOSTS = new Set(["index.hr", "www.index.hr", "vecernji.hr", "www.vecernji.hr"]);
const FEEDS = [
  { name: "Index.hr · Hrvatska", url: "https://www.index.hr/rss/vijesti-hrvatska" },
  { name: "Večernji list · najnovije", url: "https://www.vecernji.hr/feed" }
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
      const c = parseInt(n, 16); return Number.isFinite(c) && c >= 0 && c <= 0x10ffff ? String.fromCodePoint(c) : "";
    })
    .replace(/&#(\d+);/g, (_, n) => {
      const c = parseInt(n, 10); return Number.isFinite(c) && c >= 0 && c <= 0x10ffff ? String.fromCodePoint(c) : "";
    })
    .replace(/&quot;/gi, '"').replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&");
}
function plain(value) {
  return decodeEntities(String(value || "").replace(/<[^>]*>/g, " "))
    .replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}
function field(block, name) {
  const safe = name.replace(/[.*+?^\$\{\}()|[\]\\]/g, "\\$&");
  return new RegExp("<(?:[\\w.-]+:)?"+safe+"\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?"+safe+"\\s*>", "i").exec(block)?.[1] || "";
}
function parseFeed(xml, feed) {
  let blocks = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item\s*>/gi)].map(m => m[1]);
  if (!blocks.length) blocks = [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry\s*>/gi)].map(m => m[1]);
  return blocks.map(block => {
    const title = plain(field(block, "title"));
    let link = plain(field(block, "link"));
    if (!link) {
      const atom = /<(?:[\w.-]+:)?link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i.exec(block);
      link = atom ? decodeEntities(atom[1]) : "";
    }
    const summary = plain(field(block, "description") || field(block, "summary") || field(block, "content")).slice(0, 700);
    const published = plain(field(block, "pubDate") || field(block, "published") || field(block, "updated") || field(block, "dc:date"));
    return { title, link, summary, publishedAt: Date.parse(published), sourceName: feed.name };
  }).filter(x => x.title && allowedUrl(x.link) && Number.isFinite(x.publishedAt));
}
async function fetchFeed(feed) {
  let target = new URL(feed.url), response;
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (!allowedUrl(target.href)) throw new Error("RSS URL ili preusmjeravanje nije na popisu odobrenih izvora.");
    response = await fetch(target.href, {
      redirect: "manual",
      headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml", "User-Agent": "PatriaSoul-Editorial-RSS/1.0" },
      signal: AbortSignal.timeout(12000)
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location");
    if (!location || redirects === 3) throw new Error("RSS preusmjeravanje nije dopušteno ili ih je previše.");
    target = new URL(location, target);
  }
  if (!response?.ok) throw new Error("RSS HTTP status " + (response?.status || "nepoznat"));
  const xml = await response.text();
  if (xml.length > 1500000) throw new Error("RSS odgovor prelazi 1,5 MB.");
  if (!/<(?:rss|feed|rdf:RDF|RDF)(?:\s|>)/i.test(xml)) throw new Error("Odgovor nije prepoznat kao RSS/Atom.");
  return parseFeed(xml, feed);
}
function relevant(item) {
  const text = (item.title + " " + item.summary).toLocaleLowerCase("hr-HR");
  return RELEVANCE.some(word => text.includes(word));
}
async function main() {
  const headers = { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" };
  const collected = [], errors = [];
  for (const feed of FEEDS) {
    try {
      const items = await fetchFeed(feed);
      collected.push(...items);
      console.log("RSS OK:", feed.name, items.length);
    } catch (e) {
      errors.push(feed.name + ": " + (e?.message || "nepoznata greška"));
      console.error("RSS ERROR:", feed.name, e?.message || e);
    }
  }
  if (!collected.length) throw new Error("Nijedan odobreni RSS izvor nije uspio. " + errors.join(" | "));
  const cutoff = Date.now() - MAX_AGE_HOURS * 3600000;
  const seen = new Set(), candidates = [];
  for (const item of collected.sort((a,b) => b.publishedAt-a.publishedAt)) {
    if (seen.has(item.link)) continue;
    seen.add(item.link);
    if (item.publishedAt < cutoff || item.publishedAt > Date.now()+3600000 || !relevant(item)) continue;
    candidates.push(item);
  }
  let attempted = 0;
  for (const item of candidates) {
    if (attempted >= MAX_NEW_DRAFTS) break;
    const row = {
      source_url: item.link,
      source_name: item.sourceName,
      source_published_at: new Date(item.publishedAt).toISOString(),
      title: item.title.slice(0, 300),
      summary: item.summary,
      status: "pending",
      editorial_notes: "Čeka uredničku provjeru. Provjeri činjenice i primarne izvore; napiši originalan tekst. Ne objavljuj bez odobrenja."
    };
    const response = await fetch(SUPABASE_URL + "/rest/v1/rss_editorial_drafts?on_conflict=source_url", {
      method: "POST", headers, body: JSON.stringify([row]), signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error("Supabase REST " + response.status + ": " + (await response.text()).slice(0, 350));
    attempted++;
  }
  console.log(JSON.stringify({ feeds: FEEDS.length, parsedItems: collected.length, relevantRecentItems: candidates.length, insertAttempts: attempted, feedErrors: errors }, null, 2));
}
main().catch(e => { console.error(e?.stack || e); process.exitCode = 1; });
