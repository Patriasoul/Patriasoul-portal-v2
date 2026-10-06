const fs=require("fs"),path=require("path");
const root=path.join(process.cwd(),"clanci");
let files=[];
function walk(d){
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    const p=path.join(d,e.name);
    if(e.isDirectory())walk(p);
    else if(/^clanak-.*\.html$/i.test(e.name))files.push(p);
  }
}
walk(root);

const problems=[];
for(const file of files){
  const s=fs.readFileSync(file,"utf8");
  const images=[...s.matchAll(/<img\b[^>]*>/gi)];
  if(!images.length){
    problems.push(file+" — NEMA NASLOVNE SLIKE");
    continue;
  }
  const hero=images.find(m=>/class=["'][^"']*article-hero/i.test(m[0]))||images[0];
  const src=(hero[0].match(/src=["']([^"']+)["']/i)||[])[1]||"";
  const alt=(hero[0].match(/alt=["']([^"']*)["']/i)||[])[1]||"";
  if(!src) problems.push(file+" — SLIKA NEMA src");
  if(!alt.trim()) problems.push(file+" — SLIKA NEMA alt");
  if(src.startsWith("data:")) problems.push(file+" — data image");
  if(/assets\/images\/articles\/.*\.svg$/i.test(src)) problems.push(file+" — SVG placeholder: "+src);
}
console.log("ČLANCI:",files.length);
if(problems.length){
  console.error("SLIKE FAIL");
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("SLIKE OK — svaki članak ima naslovnu sliku, alt tekst i nema lokalni SVG placeholder.");