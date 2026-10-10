const fs=require("fs");

const sitemap=fs.readFileSync("sitemap.xml","utf8");
if(!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) throw new Error("Sitemap nema XML deklaraciju.");
if(!sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) throw new Error("Sitemap nema ispravan urlset namespace.");
if(!sitemap.trim().endsWith("</urlset>")) throw new Error("Sitemap nije pravilno zatvoren.");
if(sitemap.includes("googlef31b6b8a66adf403.html")) throw new Error("Google verification datoteka ne smije biti u sitemapu.");

const locs=sitemap
  .split("<loc>")
  .slice(1)
  .map(part=>part.split("</loc>")[0].trim())
  .filter(Boolean);

if(!locs.length) throw new Error("Sitemap nema nijedan <loc> URL.");
const unique=[...new Set(locs)];
if(unique.length!==locs.length) throw new Error("Sitemap sadrži duplikate URL-ova.");

const bad=locs.filter(u=>!u.startsWith("https://ps.patriasoul.workers.dev/"));
if(bad.length) throw new Error("Sitemap sadrži URL izvan PatriaSoul Pages domene.");

const robots=fs.readFileSync("robots.txt","utf8");
if(!robots.includes("User-agent: *")) throw new Error("robots.txt nema User-agent.");
if(!robots.includes("Allow: /")) throw new Error("robots.txt nema Allow: /.");
if(!robots.includes("Sitemap: https://ps.patriasoul.workers.dev/sitemap.xml")) throw new Error("robots.txt ne pokazuje na službeni Workers sitemap.");

console.log("DISCOVERY QA: OK —",locs.length,"URL-ova u sitemapu.");
