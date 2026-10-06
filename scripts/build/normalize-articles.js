const fs=require("fs"),path=require("path");
const root=path.join(process.cwd(),"clanci");
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith(".html"))normalizeFile(p)}}
function normalizeFile(file){
  let s=fs.readFileSync(file,"utf8");
  s=s.replace(/<header[\s\S]*?<\/header>/i,"");
  s=s.replace(/Piše:\s*PatriaSoul/gi,"Autor: Čuvari nasljeđa");
  s=s.replace(/Autor:\s*PatriaSoul/gi,"Autor: Čuvari nasljeđa");
  s=s.replace(/<link[^>]+(?:portal\.css|community\.css)[^>]*>\s*/gi,"");
  s=s.replace(/<script[^>]+portal\.js[^>]*><\/script>/gi,"");
  const fixes=[
    [/href="cuvar-prijava\.html"/g,'href="../../cuvari-nasljedja/prijavi-pricu.html"'],
    [/href="pretraga\.html\?q=/g,'href="../../stranice/pretraga.html?q='],
    [/href="\.\.\/\.\.\/domovina\/obitelj\.html>/g,'href="../../kategorije/domovina/obitelj.html">'],
    [/href="\.\.\/domovina\/obitelj\.html>/g,'href="../../kategorije/domovina/obitelj.html">'],
    [/href="\.\.\/\.\.\/domovina\.html"/g,'href="../../kategorije/domovina/"'],[/href="\.\.\/\.\.\/domovina\.html>/g,'href="../../kategorije/domovina/">'],[/href="\.\.\/\.\.\/\.\.\/stranice\/o-patriasoul\.html>/g,'href="../../stranice/o-patriasoul.html">'],
    [/href="\.\.\/domovina\.html"/g,'href="../../kategorije/domovina/"'],
    [/href="\.\.\/\.\.\/\.\.\/stranice\/o-patriasoul\.html"/g,'href="../../stranice/o-patriasoul.html"'],
    [/href="\.\.\/\.\.\/clanci\/povijest\/clanak-ruder-boskovic\.html"/g,'href="../../clanci/domovina/clanak-ruder-boskovic.html"'],
    [/href="\.\.\/\.\.\/clanci\/povijest\/clanak-penkala\.html"/g,'href="../../clanci/domovina/clanak-penkala.html"'],
    [/href="vjera\.html"/g,'href="../../kategorije/vjera/"'],
    [/href="obitelj\.html"/g,'href="../../kategorije/domovina/obitelj.html"'],
    [/href="domovina\.html"/g,'href="../../kategorije/domovina/"'],
    [/href="vrijeme\.html"/g,'href="../../kategorije/domovina/hrvatska-danas.html"'],
    [/href="cuvari-nasljeda\.html"/g,'href="../../cuvari-nasljedja/"'],
    [/href="o-nama\.html"/g,'href="../../stranice/o-patriasoul.html"'],[/href="domovina\.html"/g,'href="../../kategorije/domovina/"'],[/href="urednicki-standard\.html"/g,'href="../../stranice/urednicki-standard.html"']
  ];
  // Ukloni sve stare relativne poveznice prema domovina.html, uključujući sidra.
  s=s.replace(/href=(["'])domovina\\.html#branitelji\\1/gi,'href="../../kategorije/domovina/branitelji-hrvatske.html"');
  s=s.replace(/href=(["'])domovina\\.html\\1/gi,'href="../../kategorije/domovina/"');
  s=s.replace(/href=(["'])\\.\\.\\/domovina\\.html#branitelji\\1/gi,'href="../../kategorije/domovina/branitelji-hrvatske.html"');
  s=s.replace(/href=(["'])\\.\\.\\/domovina\\.html\\1/gi,'href="../../kategorije/domovina/"');
  s=s.replace(/href=(["'])\\.\\.\\/\\.\\.\\/domovina\\.html#branitelji\\1/gi,'href="../../kategorije/domovina/branitelji-hrvatske.html"');
  s=s.replace(/href=(["'])\\.\\.\\/\\.\\.\\/domovina\\.html\\1/gi,'href="../../kategorije/domovina/"');
  s=s.replace(/href=(["'])\\.\\.\\/\\.\\.\\/\\.\\.\\/domovina\\.html(?:#branitelji)?\\1/gi,'href="../../kategorije/domovina/"');
  for(const [re,to] of fixes)s=s.replace(re,to);
  if(!/articles\.css/i.test(s))s=s.replace("</head>",'<link rel="stylesheet" href="../../assets/css/articles.css"></head>');
  s=s.replace("</body>",'<script src="../../assets/js/portal.js"></script></body>');
  s=enhanceArticle(s,file);
  fs.writeFileSync(file,s);
}

function enhanceArticle(s,file){
  const rel=path.relative(process.cwd(),file).replace(/\\/g,"/");
  const parts=rel.split("/");
  if(parts[0]!=="clanci" || !/^clanak-.*\.html$/.test(parts[parts.length-1])) return s;
  const category=parts[1];
  const categoryLabel={domovina:"Domovina",povijest:"Povijest",vjera:"Vjera","cuvari-nasljedja":"Čuvari nasljeđa"}[category]||"PatriaSoul";
  const title=((s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||"").replace(/<[^>]+>/g,"").trim();
  const deck=((s.match(/<p class="article-deck"[^>]*>([\s\S]*?)<\/p>/i)||[])[1]||"").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
  const description=((s.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)||[])[1]||deck||title).slice(0,160);
  const img=((s.match(/<img[^>]+src="([^"]+)"/i)||[])[1]||"").trim();
  const canonical="https://patriasoul.github.io/Patriasoul-portal-v2/"+rel;
  const imageAbs=img ? (img.startsWith("http")?img:new URL(img,canonical).href) : "";
  s=s.replace(/<meta[^>]+name="robots"[^>]*>\s*/gi,"");
  s=s.replace(/<meta[^>]+name="author"[^>]*>\s*/gi,"");
  s=s.replace(/<link[^>]+rel="canonical"[^>]*>\s*/gi,"");
  s=s.replace(/<meta[^>]+property="og:[^>]+>\s*/gi,"");
  s=s.replace(/<meta[^>]+name="twitter:[^>]+>\s*/gi,"");
  const meta=[
    '<meta name="author" content="Čuvari nasljeđa">',
    '<meta name="article:section" content="'+categoryLabel+'">',
    '<link rel="canonical" href="'+canonical+'">',
    '<meta property="og:type" content="article">',
    '<meta property="og:title" content="'+escAttr(title)+'">',
    '<meta property="og:description" content="'+escAttr(description)+'">',
    '<meta property="og:url" content="'+canonical+'">',
    '<meta property="og:site_name" content="PatriaSoul">',
    '<meta property="og:locale" content="hr_HR">',
    imageAbs?'<meta property="og:image" content="'+escAttr(imageAbs)+'">':"",
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="'+escAttr(title)+'">',
    '<meta name="twitter:description" content="'+escAttr(description)+'">',
    imageAbs?'<meta name="twitter:image" content="'+escAttr(imageAbs)+'">':""
  ].filter(Boolean).join("");
  s=s.replace(/<meta[^>]+name="description"[^>]*>/i,m=>m+meta);
  const ld={"@context":"https://schema.org","@type":"Article","headline":title,"description":description,"author":{"@type":"Organization","name":"Čuvari nasljeđa"},"publisher":{"@type":"Organization","name":"PatriaSoul"},"mainEntityOfPage":{"@type":"WebPage","@id":canonical},"url":canonical,"inLanguage":"hr-HR"};
  if(imageAbs) ld.image=[imageAbs];
  s=s.replace(/<script[^>]+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\\s*/gi,"");
  s=s.replace(/<\/head>/i,'<script type="application/ld+json">'+JSON.stringify(ld)+'</script></head>');
  s=s.replace(/<figcaption>PatriaSoul urednička ilustracija[\s\S]*?<\/figcaption>/gi,'<figcaption>Fotografija povezana s temom članka. Izvor i licenca navedeni su uz fotografiju kada su dostupni.</figcaption>');
  if(img) s=s.replace(/<img([^>]+)>/i,(m,a)=>m.includes("loading=")?m:'<img'+a+' loading="eager" decoding="async">');
  const dir=path.dirname(file);
  const name=path.basename(file);

  // Pametni odabir povezanih članaka: prvo tražimo zajedničke ključne riječi
  // iz naslova, a tek onda koristimo siguran fallback iz iste rubrike.
  const stopWords=new Set([
    "i","u","na","je","za","od","iz","s","sa","o","te","do","po","uz","kod","ka","kroz",
    "kako","što","koji","koja","koje","jedan","jedna","jedno","godina","godine","danas",
    "hrvatska","hrvatski","hrvatsko","hrvatske"
  ]);
  const fold=v=>String(v||"").toLocaleLowerCase("hr-HR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const keywords=v=>new Set(
    fold(v).replace(/[^a-z0-9\s-]/g," ").split(/\s+/)
      .map(x=>x.trim()).filter(x=>x.length>=4&&!stopWords.has(x))
  );
  const titleOf=raw=>((raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||"")
    .replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();

  const related=fs.readdirSync(dir)
    .filter(n=>/^clanak-.*\.html$/.test(n)&&n!==name);

  const currentTitle=titleOf(s);
  const currentKeys=keywords(currentTitle);
  const topicGroups=[
    ["znanost","znanstv","istraživ","istraživanj","fizik","kemij","matem","seizm","meteorolog","svemir","tehn","izum","torped","sigurnost","kibernet","računal"],
    ["knjizevnost","književ","pisac","pjesnik","poezij","judit","marul","mažuranić","starčević"],
    ["umjetnost","umjet","kipar","skladatelj","glazb","pejačević","meštrović"],
    ["bastina","baštin","glagolj","zakonik","kultura","običaj","tradic","alk","dvorac","republik"],
    ["domovinski-rat","vukovar","trpinj","branitelj","domovinsk","čavoglav","thompson","zadro","memorij","sjećanj","napad"],
    ["obitelj-dijaspora","obitelj","obiteljsk","dijaspora","hrvati","prezime","album","baka","djed","selo","škola","djetinj","svadb"],
    ["vjera","vjera","sveti","svetišt","crkv","krunic","marija","eufem","trsats","vepric","bibl"],
    ["aktualno","plać","zaposlen","gospodar","turiz","promet","pruga","zet","potres","pfas","med9","sport"]
  ];
  const groupsFor=title=>{
    const f=fold(title);
    return new Set(topicGroups.filter(([name,...terms])=>terms.some(t=>f.includes(fold(t)))).map(x=>x[0]));
  };
  const currentGroups=groupsFor(currentTitle);
  const scored=related.map(n=>{
    const raw=fs.readFileSync(path.join(dir,n),"utf8");
    const title=titleOf(raw);
    const keys=keywords(title);
    const groups=groupsFor(title);
    let score=0;
    for(const key of currentKeys) if(keys.has(key)) score+=1;
    for(const key of currentKeys) if(keys.has(key)&&key.length>=7) score+=0.35;
    for(const group of currentGroups) if(groups.has(group)) score+=1.5;
    return {n,raw,title,score};
  }).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,"hr"));

  const picks=[];
  for(const item of scored){
    if(item.score>0&&picks.length<3) picks.push(item);
  }
  if(picks.length<2){
    for(const item of scored) if(!picks.includes(item)&&picks.length<3) picks.push(item);
  }

  const cards=picks.slice(0,3).map(item=>{
    const t=item.title||item.n;
    const im=((item.raw.match(/<img[^>]+src="([^"]+)"/i)||[])[1]||"").trim();
    const alt=((item.raw.match(/<img[^>]+alt="([^"]*)"/i)||[])[1]||t).trim();
    const image=im ? '<img src="'+escAttr(im)+'" alt="'+escAttr(alt)+'" loading="lazy" decoding="async">' : "";
    return '<a class="article-related-card" href="'+item.n+'">'+image+'<span><b>'+categoryLabel+'</b><strong>'+escHtml(t)+'</strong><em>Pročitaj članak →</em></span></a>';
  }).join("");

  const categoryHref=category==="cuvari-nasljedja"?"../../cuvari-nasljedja/":"../../kategorije/"+category+"/index.html";
  const relatedHtml='<section class="article-related" aria-labelledby="povezani-naslovi"><h2 id="povezani-naslovi">Povezano</h2><div class="article-related-grid">'+cards+'</div><a class="article-related-all" href="'+categoryHref+'">Više iz rubrike '+categoryLabel+' →</a></section>';
  s=s.replace(/<section class="article-related"[\s\S]*?<\/section>/i,"");
  s=s.replace(/<\/body>/i,relatedHtml+"</body>");
  return s;
}
function escAttr(v){return String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function escHtml(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function normalizePage(file){let s=fs.readFileSync(file,'utf8');s=s.replace(/<header[\s\S]*?<\/header>/i,'').replace(/<link[^>]+(?:portal\.css|legal-page\.css|editorial-standard\.css|community\.css)[^>]*>\s*/gi,'').replace(/<script[^>]+portal\.js[^>]*><\/script>/gi,'');const fixes=[[/href="index\.html"/g,'href="../index.html"'],[/href="vjera\.html"/g,'href="../kategorije/vjera/"'],[/href="obitelj\.html"/g,'href="../kategorije/domovina/obitelj.html"'],[/href="domovina\.html"/g,'href="../kategorije/domovina/"'],[/href="vrijeme\.html"/g,'href="../kategorije/domovina/hrvatska-danas.html"'],[/href="cuvari-nasljeda\.html"/g,'href="../cuvari-nasljedja/"'],[/href="o-nama\.html"/g,'href="../stranice/o-patriasoul.html"']];for(const [re,to] of fixes)s=s.replace(re,to);if(!/portal\.js/i.test(s))s=s.replace('</body>','<script src="../assets/js/portal.js"></script></body>');fs.writeFileSync(file,s)}
function walkPages(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walkPages(p);else if(e.name.endsWith('.html'))normalizePage(p)}}
walk(root);walkPages(path.join(process.cwd(),'stranice'));

function generateArticleIndex(){
  const items=[];
  function collect(dir){
    for(const e of fs.readdirSync(dir,{withFileTypes:true})){
      const p=path.join(dir,e.name);
      if(e.isDirectory()) collect(p);
      else if(/^clanak-.*\.html$/.test(e.name)){
        const raw=fs.readFileSync(p,'utf8');
        const rel=path.relative(process.cwd(),p).replace(/\\/g,"/");
        const title=((raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||e.name).replace(/<[^>]+>/g,"").trim();
        const description=((raw.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)||[])[1]||"").trim();
        const image=((raw.match(/<img[^>]+src="([^"]+)"/i)||[])[1]||"").trim();
        const category=rel.split("/")[1]||"";
        items.push({title,description,image,category,url:rel,author:"Čuvari nasljeđa"});
      }
    }
  }
  collect(root);
  fs.mkdirSync(path.join(process.cwd(),'data'),{recursive:true});
  fs.writeFileSync(path.join(process.cwd(),'data/articles.json'),JSON.stringify(items.sort((a,b)=>a.title.localeCompare(b.title,'hr')),null,2));
  console.log("Indeks članaka:",items.length);
}
generateArticleIndex();
console.log("Normalizirano",root);