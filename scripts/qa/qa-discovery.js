const fs=require("fs");

const sitemap=fs.readFileSync("sitemap.xml","utf8");
if(!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) throw new Error("Sitemap nema XML deklaraciju.");
if(!sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) throw new Error("Sitemap nema ispravan urlset namespace.");
if(!sitemap.trim().endsWith("</urlset>")) throw new Error("Sitemap nije pravilno zatvoren.");
if(sitemap.includes("googlef31b6b8a66adf403.html")) throw new Error("Google verification datoteka ne smije biti u sitemapu.");
const locs=[...sitemap.matchAll(/<loc>([^<]+)<\\/loc>/g)].map(m=>m[1]);
const unique=[...new Set(locs)];
if(unique.length!==locs.length) throw new Error("Sitemap sadrži duplikate URL-ova.");
const bad=locs.filter(u=>!u.startsWith("https://patriasoul.github.io/Patriasoul-portal-v2/"));
if(bad.length) throw new Error("Sitemap sadrži URL izvan PatriaSoul Pages domene.");
const robots=fs.readFileSync("robots.txt","utf8");
if(!robots.includes("User-agent: *")) throw new Error("robots.txt nema User-agent.");
if(!robots.includes("Allow: /")) throw new Error("robots.txt nema Allow: /.");
if(!robots.includes("Sitemap: https://patriasoul.github.io/Patriasoul-portal-v2/sitemap.xml")) throw new Error("robots.txt ne pokazuje na ispravan sitemap.");
console.log("DISCOVERY QA: OK —",locs.length,"URL-ova u sitemapu.");
