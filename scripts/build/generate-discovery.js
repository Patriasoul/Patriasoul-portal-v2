const fs=require("fs"),path=require("path");
const root=process.cwd(),base="https://patriasoul-portal-v2.patriasoul.workers.dev/";
const urls=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if([".git","node_modules","_site","kviz"].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith(".html")&&e.name!=="404.html"&&e.name!=="googlef31b6b8a66adf403.html"&&e.name!=="prijava.html"&&e.name!=="registracija.html"&&e.name!=="racun.html"&&e.name!=="administracija.html"&&e.name!=="newsletter.html"&&e.name!=="kolacici.html"){const rel=path.relative(root,p).replaceAll(path.sep,"/");urls.push(rel.endsWith("/index.html")?base+rel.slice(0,-"index.html".length):base+rel);}}}
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

const months={siječnja:0,veljače:1,ožujka:2,travnja:3,svibnja:4,lipnja:5,srpnja:6,kolovoza:7,rujna:8,listopada:9,studenoga:10,prosinca:11};
const rssDate=value=>{
  const m=String(value||"").match(/(\\d{1,2})\\.\\s*([^\\s]+)\\s*(\\d{4})/);
  if(!m)return new Date().toUTCString();
  return new Date(Date.UTC(+m[3],months[m[2]]??0,+m[1],12,0,0)).toUTCString();
};
const xml=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const latestArticles=[...articles].filter(x=>x.title&&x.url).sort((a,b)=>Date.parse(rssDate(b.date))-Date.parse(rssDate(a.date))).slice(0,50);
const rssItems=latestArticles.map(a=>`    <item>
      <title>${xml(a.title)}</title>
      <link>${base}${a.url}</link>
      <guid isPermaLink="true">${base}${a.url}</guid>
      <description>${xml(a.description||"PatriaSoul članak.")}</description>
      <pubDate>${rssDate(a.date)}</pubDate>
      <category>${xml(a.category||"PatriaSoul")}</category>
    </item>`).join("\\n");
const rss='<?xml version="1.0" encoding="UTF-8"?>\\n'+
  '<rss version="2.0">\\n  <channel>\\n'+
  '    <title>PatriaSoul — Čuvar nasljeđa</title>\\n'+
  '    <link>'+base+'</link>\\n'+
  '    <description>Najnovije priče i članci portala PatriaSoul.</description>\\n'+
  '    <language>hr</language>\\n'+
  '    <link rel="self" href="'+base+'rss.xml" />\\n'+
  rssItems+'\\n  </channel>\\n</rss>\\n';
fs.writeFileSync("rss.xml",rss);
console.log("DISCOVERY:",unique.length,"URL-ova;",articles.length,"članaka; RSS:",latestArticles.length,"stavki");