const fs=require("fs"),path=require("path");
const root=process.cwd(),base="https://patriasoul.github.io/Patriasoul-portal-v2/";
const urls=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if([".git","node_modules","_site","kviz"].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith(".html")&&e.name!=="404.html")urls.push(base+path.relative(root,p).replaceAll(path.sep,"/"));}}
walk(root);
const unique=[...new Set(urls)].sort();
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  unique.map(u => '  <url><loc>' + u + '</loc></url>').join("\n") +
  '\n</urlset>\n';
fs.writeFileSync("sitemap.xml", sitemap);
fs.writeFileSync("robots.txt","User-agent: *\nAllow: /\nSitemap: "+base+"sitemap.xml\n");
const strip=x=>x.replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
const slug=x=>x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const articles=[];
for(const u of unique.filter(x=>x.includes("/clanci/"))){
  const rel=u.replace(base,""),s=fs.readFileSync(rel,"utf8");
  const title=strip((s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||rel);
  const description=strip((s.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)||[])[1]||"PatriaSoul članak.");
  const category=rel.split("/")[1]||"PatriaSoul";
  const kicker=strip((s.match(/class=["'][^"']*\b(?:article-kicker|kicker)\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i)||[])[1]||"");
  const parts=kicker.split(/[·|]/).map(x=>slug(x.trim())).filter(Boolean);
  const subcategory=parts.find(x=>x!==slug(category))||"";
  const hero=s.match(/<img[^>]+class=["'][^"']*article-hero[^"']*["'][^>]*>/i);
  const imgTag=hero?hero[0]:(s.match(/<img[^>]+>/i)||[])[0]||"";
  const image=(imgTag.match(/src=["']([^"']+)/i)||[])[1]||"";
  const alt=(imgTag.match(/alt=["']([^"']*)/i)||[])[1]||title;
  const meta=strip((s.match(/class=["']article-meta["'][^>]*>([\s\S]*?)<\/[^>]+>/i)||[])[1]||"");
  const date=(meta.match(/·\s*([^·]+?)\s*·/)||[])[1]?.trim()||"";
  articles.push({url:rel,title,description,category,subcategory,image,alt,date,text:strip(s).slice(0,6000)});
}
fs.writeFileSync("data/search-index.json",JSON.stringify(articles,null,2)+"\n");
console.log("DISCOVERY:",unique.length,"URL-ova;",articles.length,"članaka");