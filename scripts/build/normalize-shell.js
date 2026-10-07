const fs=require("fs"),path=require("path");
const ROOT=process.cwd();
const VERSION="20261007-13";
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
    if(/<(?:article|main|div)[^>]*class=["'][^"']*article-page/i.test(html)){
      const fallback='<section class="ps-comments ps-comments-static"><div class="ps-comments-head"><span>KOMENTARI</span><h2>Recite što mislite</h2><p>Za komentiranje morate biti prijavljeni na PatriaSoul. Anonimno komentiranje nije omogućeno.</p></div><div class="ps-comments-content"><div class="ps-comments-login"><strong>Komentiranje je dostupno samo prijavljenim korisnicima.</strong><p>Prijavite se svojim PatriaSoul računom kako biste mogli objaviti komentar.</p><a href="'+loginPath(full)+'?next='+encodeURIComponent(articlePath(full))">Prijavi se na PatriaSoul</a></div></div></section>';
      // Na člancima su Povezano i Komentari dio sadržaja članka.
      // Portal.js stvara footer dinamički, zato se mora izvršiti TEK NAKON tih blokova.
      const portalRe=/<script[^>]+src=["'][^"']*assets\/js\/portal\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi;
      const commentsRe=/<script[^>]+src=["'][^"']*assets\/js\/comments\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi;
      html=html.replace(portalRe,"");
      html=html.replace(commentsRe,"");
      html=html.replace(/<section[^>]*class=["'][^"']*ps-comments[^"']*["'][\s\S]*?<\/section>/gi,"");
      html=html.replace(/<footer[^>]*class=["']site-footer["'][\s\S]*?<\/footer>/gi,"");

      const relatedMatch=html.match(/<section[^>]*class=["'][^"']*article-related(?:\s|["'])[^>]*>[\s\S]*?<\/section>/i);
      if(relatedMatch){
        html=html.replace(relatedMatch[0],relatedMatch[0]+fallback);
      }else{
        html=html.replace(/<\/main>/i,fallback+"</main>");
      }

      const relPortal=portalPath(full);
      const relComments=commentsPath(full);
      const portalTag='<script src="'+relPortal+'?v='+VERSION+'"></script>';
      const commentTag='<script src="'+relComments+'?v='+VERSION+'" data-ps-comments="true"></script>';
      html=html.replace(/<\/body>/i,portalTag+commentTag+"</body>");
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
function commentsPath(file){
  const rel=path.relative(path.dirname(file),ROOT).split(path.sep).filter(Boolean);
  return rel.length?"../".repeat(rel.length)+"assets/js/comments.js":"assets/js/comments.js";
}
function articlePath(file){
  const rel=path.relative(path.dirname(file),file).split(path.sep).join("/");
  return "/Patriasoul-portal-v2/"+rel;
}
function loginPath(file){
  const rel=path.relative(path.dirname(file),ROOT).split(path.sep).filter(Boolean);
  return rel.length?"../".repeat(rel.length)+"stranice/prijava.html":"stranice/prijava.html";
}
walk(ROOT);
console.log("SHELL NORMALIZE:",changed,"HTML stranica");