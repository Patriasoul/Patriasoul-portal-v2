const fs=require("fs"),path=require("path");
const ROOT=process.cwd();
const VERSION="20261007-2";
const SKIP=new Set(["kviz"]);
let changed=0;
function walk(dir){
  for(const name of fs.readdirSync(dir,{withFileTypes:true})){
    if(name.name==="node_modules"||name.name==="_site"||name.name.startsWith(".")) continue;
    const full=path.join(dir,name.name);
    if(name.isDirectory()){ if(!SKIP.has(path.relative(ROOT,full).split(path.sep)[0])) walk(full); continue; }
    if(!name.name.endsWith(".html")) continue;
    let html=fs.readFileSync(full,"utf8");
    if(/<script[^>]+src=["'][^"']*assets\/js\/portal\.js(?:\?[^"']*)?["'][^>]*><\/script>/i.test(html)){
      html=html.replace(/<script([^>]+)src=["'][^"']*assets\/js\/portal\.js(?:\?[^"']*)?["']([^>]*)><\/script>/ig,(m,a,b)=>'<script'+a+'src="'+portalPath(full)+'?v='+VERSION+'"'+b+'></script>');
    }else{
      const rel=portalPath(full);
      if(/<\/body>/i.test(html)) html=html.replace(/<\/body>/i,'<script src="'+rel+'?v='+VERSION+'"></script></body>');
    }
    html=html.replace(/<footer class=["']site-footer["']><\/footer>/gi,"");
    fs.writeFileSync(full,html);
    changed++;
  }
}
function portalPath(file){
  const rel=path.relative(path.dirname(file),ROOT).split(path.sep).filter(Boolean);
  return rel.length?"../".repeat(rel.length)+"assets/js/portal.js":"assets/js/portal.js";
}
walk(ROOT);
console.log("SHELL NORMALIZE:",changed,"HTML stranica");