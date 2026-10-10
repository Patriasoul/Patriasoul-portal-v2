const fs=require("fs"),path=require("path");

const root=process.cwd();
const base="https://patriasoul-portal-v2.patriasoul.workers.dev/";
const excluded=new Set(["404.html","googlef31b6b8a66adf403.html","prijava.html","registracija.html","racun.html","administracija.html","newsletter.html","kolacici.html"]);
const escHtml=s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const escJson=s=>JSON.stringify(String(s||""));
const strip=s=>String(s||"").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/\s+/g," ").trim();
const abs=(u,rel)=>{
  if(!u)return "";
  if(/^https?:\/\//i.test(u))return u;
  if(u.startsWith("/"))return new URL(u,base).href;
  return new URL(u,new URL(rel,base)).href;
};
const pageUrl=rel=>rel.endsWith("/index.html")?base+rel.slice(0,-"index.html".length):base+rel;
const walk=d=>{
  const out=[];
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    if([".git","node_modules","_site","kviz"].includes(e.name))continue;
    const p=path.join(d,e.name);
    if(e.isDirectory())out.push(...walk(p));
    else if(e.name.endsWith(".html")&&!excluded.has(e.name))out.push(p);
  }
  return out;
};
let changed=0,articles=0;
for(const file of walk(root)){
  const rel=path.relative(root,file).replaceAll(path.sep,"/");
  let s=fs.readFileSync(file,"utf8");
  const title=strip((s.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1])||"PatriaSoul — Hrvatska. Povijest. Znanje. Identitet.";
  let desc=(s.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)||[])[1]||"";
  if(!desc){
    const h1=strip((s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]);
    desc=h1? h1+" — PatriaSoul.": "PatriaSoul — hrvatska povijest, domovina, vjera, baština, obitelj i znanje.";
  }
  const url=pageUrl(rel);
  const canonical='<link rel="canonical" href="'+escHtml(url)+'">';
  const og=[
    '<meta property="og:locale" content="hr_HR">',
    '<meta property="og:site_name" content="PatriaSoul">',
    '<meta property="og:title" content="'+escHtml(title)+'">',
    '<meta property="og:description" content="'+escHtml(desc)+'">',
    '<meta property="og:url" content="'+escHtml(url)+'">',
    '<meta property="og:type" content="'+(rel.startsWith("clanci/")?"article":"website")+'">'
  ];
  const hero=(s.match(/<img[^>]+class=["'][^"']*article-hero[^"']*["'][^>]+>/i)||[])[0]||"";
  const firstImg=(s.match(/<img[^>]+>/i)||[])[0]||"";
  const imgTag=hero||firstImg;
  const img=(imgTag.match(/src=["']([^"']+)["']/i)||[])[1]||"";
  if(img){
    const imageUrl=abs(img,rel);
    const imageAlt=strip((imgTag.match(/alt=["']([^"']*)["']/i)||[])[1])||title;
    og.push('<meta property="og:image" content="'+escHtml(imageUrl)+'">');
    og.push('<meta property="og:image:alt" content="'+escHtml(imageAlt)+'">');
  }
  og.push('<meta name="twitter:card" content="summary_large_image">');
  og.push('<meta name="twitter:title" content="'+escHtml(title)+'">');
  og.push('<meta name="twitter:description" content="'+escHtml(desc)+'">');
  if(img)og.push('<meta name="twitter:image" content="'+escHtml(abs(img,rel))+'">');
  const marker='data-patriasoul-seo="1"';
  s=s.replace(/\n?\s*<meta[^>]+data-patriasoul-seo="1"[^>]*>\n?/g,"\n");
  s=s.replace(/\n?\s*<link[^>]+data-patriasoul-seo="1"[^>]*>\n?/g,"\n");
  s=s.replace(/\n?\s*<script[^>]+data-patriasoul-seo="1"[\s\S]*?<\/script>\n?/g,"\n");
  const headBlock='\n'+canonical.replace(">"," "+marker+">")+'\n'+og.map(x=>x.replace(">"," "+marker+">")).join("\n");
  s=s.replace(/<head>/i,"<head>"+headBlock);
  if(rel.startsWith("clanci/")){
    articles++;
    const metaText=strip((s.match(/class=["']article-meta["'][^>]*>([\s\S]*?)<\/[^>]+>/i)||[])[1]||"");
    const date=(metaText.match(/(?:Objavljeno|Ažurirano|\b)(?:\s*[:·-]\s*)?([0-9]{1,2}\.\s*[0-9]{1,2}\.\s*[0-9]{4})/i)||metaText.match(/([0-9]{1,2}\.\s*[0-9]{1,2}\.\s*[0-9]{4})/))?.[1]||"";
    const iso=date?date.split(".").map(x=>x.trim()).filter(Boolean):[];
    const dateIso=iso.length===3?iso[2]+"-"+iso[1].padStart(2,"0")+"-"+iso[0].padStart(2,"0"):"";
    const author=(s.match(/(?:autor|author)["':>\s]+(?:<[^>]+>\s*)?([^<\n|·]+)/i)||[])[1]?.trim()||"PatriaSoul";
    const articleOg=[];
    if(dateIso){
      articleOg.push('<meta property="article:published_time" content="'+dateIso+'T00:00:00+02:00">');
      articleOg.push('<meta property="article:modified_time" content="'+dateIso+'T00:00:00+02:00">');
    }
    articleOg.push('<meta property="article:author" content="'+escHtml(author)+'">');
    const articleOgBlock=articleOg.map(x=>x.replace(">"," "+marker+">")).join("\n");
    s=s.replace(/<head>/i,"<head>"+articleOgBlock+"\n");
    const json={
      "@context":"https://schema.org",
      "@type":"Article",
      "mainEntityOfPage":{"@type":"WebPage","@id":url},
      "headline":strip((s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1])||title,
      "description":desc,
      "url":url,
      "author":{"@type":"Organization","name":author||"PatriaSoul"},
      "publisher":{"@type":"Organization","name":"PatriaSoul"},
      ...(img?{image:[abs(img,rel)]}:{}),
      ...(dateIso?{datePublished:dateIso,dateModified:dateIso}:{})
    };
    const jsonScript='<script type="application/ld+json" '+marker+'>'+JSON.stringify(json)+'</script>';
    s=s.replace(/<\/head>/i,jsonScript+"\n</head>");
  }
  const before=fs.readFileSync(file,"utf8");
  if(before!==s){fs.writeFileSync(file,s);changed++;}
}
console.log("SEO BUILD:",changed,"HTML stranica obrađeno;",articles,"članaka sa Article schema.");
