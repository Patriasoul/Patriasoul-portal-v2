const fs=require("fs"),path=require("path");
const root=path.join(process.cwd(),"clanci");
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith(".html"))normalizeFile(p)}}
function normalizeFile(file){
  let s=fs.readFileSync(file,"utf8");
  s=s.replace(/<header[\s\S]*?<\/header>/i,"");
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
  for(const [re,to] of fixes)s=s.replace(re,to);
  if(!/articles\.css/i.test(s))s=s.replace("</head>",'<link rel="stylesheet" href="../../assets/css/articles.css"></head>');
  s=s.replace("</body>",'<script src="../../assets/js/portal.js"></script></body>');
  fs.writeFileSync(file,s);
}
function normalizePage(file){let s=fs.readFileSync(file,'utf8');s=s.replace(/<header[\s\S]*?<\/header>/i,'').replace(/<link[^>]+(?:portal\.css|legal-page\.css|editorial-standard\.css|community\.css)[^>]*>\s*/gi,'').replace(/<script[^>]+portal\.js[^>]*><\/script>/gi,'');const fixes=[[/href="index\.html"/g,'href="../index.html"'],[/href="vjera\.html"/g,'href="../kategorije/vjera/"'],[/href="obitelj\.html"/g,'href="../kategorije/domovina/obitelj.html"'],[/href="domovina\.html"/g,'href="../kategorije/domovina/"'],[/href="vrijeme\.html"/g,'href="../kategorije/domovina/hrvatska-danas.html"'],[/href="cuvari-nasljeda\.html"/g,'href="../cuvari-nasljedja/"'],[/href="o-nama\.html"/g,'href="../stranice/o-patriasoul.html"']];for(const [re,to] of fixes)s=s.replace(re,to);if(!/portal\.js/i.test(s))s=s.replace('</body>','<script src="../assets/js/portal.js"></script></body>');fs.writeFileSync(file,s)}
function walkPages(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walkPages(p);else if(e.name.endsWith('.html'))normalizePage(p)}}
walk(root);walkPages(path.join(process.cwd(),'stranice'));
console.log("Normalizirano",root);