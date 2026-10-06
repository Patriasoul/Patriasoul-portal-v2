const fs=require("fs"),path=require("path");
const root=path.join(process.cwd(),"clanci");
const files=[];
function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p);
    else if(/^clanak-.*\.html$/.test(e.name)) files.push(p);
  }
}
walk(root);
let problems=[];
for(const file of files){
  const s=fs.readFileSync(file,"utf8");
  const rel=path.relative(process.cwd(),file).replace(/\\/g,"/");
  const checks=[
    [/<meta[^>]+name="author"[^>]+content="Čuvari nasljeđa"/i,"autor Čuvari nasljeđa"],
    [/<link[^>]+rel="canonical"/i,"canonical"],
    [/<meta[^>]+property="og:title"/i,"Open Graph naslov"],
    [/<meta[^>]+property="og:image"/i,"Open Graph slika"],
    [/application\/ld\+json/i,"JSON-LD"],
    [/class="article-related"/i,"povezani članci"],
    [/<img\b[^>]+src="[^"]+"/i,"slika"],
    [/<img\b[^>]+alt="[^"]+"/i,"alt tekst"]
  ];
  for(const [re,label] of checks) if(!re.test(s)) problems.push(rel+": nedostaje "+label);
  const relatedCards=(s.match(/class="article-related-card"/g)||[]).length;
  if(relatedCards<2) problems.push(rel+": manje od 2 povezana članka ("+relatedCards+")");
  const relatedLinks=[...s.matchAll(/class="article-related-card"[^>]*href="([^"]+)"/gi)].map(m=>m[1]);
  if(relatedLinks.some(h=>h.includes(path.basename(file)))) problems.push(rel+": poveznica na sam članak");
  const relatedImages=(s.match(/class="article-related-card"[\s\S]*?<img\b/gi)||[]).length;
  if(relatedImages<2) problems.push(rel+": povezani članci nemaju 2 slike");
  if(/Piše:\s*PatriaSoul|Autor:\s*PatriaSoul/i.test(s)) problems.push(rel+": stari autor PatriaSoul");
  if(/data:image\//i.test(s)) problems.push(rel+": data URI slika");
}
console.log("PatriaSoul — QA sustava 75 članaka");
console.log("Članci:",files.length);
if(problems.length){console.error("PROBLEMI");for(const p of problems)console.error("-",p);process.exit(1);}
console.log("OK — autori, metadata, slike i povezani članci prisutni.");
