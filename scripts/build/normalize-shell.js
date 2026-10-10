const fs=require("fs"),path=require("path");
const ROOT=process.cwd();
const VERSION="20261010-3";
const SKIP=new Set(["kviz"]);
let changed=0;
function walk(dir){
  for(const name of fs.readdirSync(dir,{withFileTypes:true})){
    if(name.name==="node_modules"||name.name==="_site"||name.name.startsWith(".")) continue;
    const full=path.join(dir,name.name);
    if(name.isDirectory()){ if(!SKIP.has(path.relative(ROOT,full).split(path.sep)[0])) walk(full); continue; }
    if(!name.name.endsWith(".html")) continue;
    let html=fs.readFileSync(full,"utf8");
    const relPage=path.relative(ROOT,full).split(path.sep).join("/");
    // Čuvari nasljeđa je samostalno chat sučelje: bez globalnog portala (koji prikazuje obavijest o kolačićima)
    // i bez plutajućeg chat widgeta koji bi napravio chat unutar chata.
    if(relPage==="stranice/patria-ai-puter-test.html"){
      html=html.replace(/<script[^>]+src=["'][^"']*assets\/js\/portal\.js(?:\?[^"']*)?["'][^>]*><\/script>/ig,"");
      html=html.replace(/<script[^>]+src=["'][^"']*assets\/js\/ai-widget\.js(?:\?[^"']*)?["'][^>]*><\/script>/ig,"");
      // Ukloni i eventualno već umetnuti izbornik/zaglavlje portala iz samostalnog chata.
      html=html.replace(/<(nav|header)[^>]*(?:class|id)=["'][^"']*(?:site-nav|site-header|portal-nav|portal-header|main-nav|primary-nav|ps-nav|ps-header|menu)[^"']*["'][^>]*>[\s\S]*?<\/\1>/ig,"");
      html=html.replace(/<div[^>]*(?:class|id)=["'][^"']*(?:cookie|consent|portal-menu|site-menu|mobile-menu|nav-menu)[^"']*["'][^>]*>[\s\S]*?<\/div>/ig,"");
      fs.writeFileSync(full,html);
      changed++;
      continue;
    }
    if(/<script[^>]+src=["'][^"']*assets\/js\/portal\.js(?:\?[^"']*)?["'][^>]*><\/script>/i.test(html)){
      html=html.replace(/<script([^>]+)src=["'][^"']*assets\/js\/portal\.js(?:\?[^"']*)?["']([^>]*)><\/script>/ig,(m,a,b)=>'<script'+a+'src="'+portalPath(full)+'?v='+VERSION+'"'+b+'></script>');
    }else{
      const rel=portalPath(full);
      if(/<\/body>/i.test(html)) html=html.replace(/<\/body>/i,'<script src="'+rel+'?v='+VERSION+'"></script></body>');
    }
    if(/<(?:article|main|div)[^>]*class=["'][^"']*article-page/i.test(html)){
      const fallback=[
        '<section class="ps-comments ps-comments-static">',
        '<div class="ps-comments-head"><span>KOMENTARI</span><h2>Recite što mislite</h2>',
        '<p>Za komentiranje morate biti prijavljeni na PatriaSoul. Anonimno komentiranje nije omogućeno.</p></div>',
        '<div class="ps-comments-content"><div class="ps-comments-login">',
        '<strong>Komentiranje je dostupno samo prijavljenim korisnicima.</strong>',
        '<p>Prijavite se svojim PatriaSoul računom kako biste mogli objaviti komentar.</p>',
        '<a href="',
        loginPath(full),
        '?next=',
        encodeURIComponent(articlePath(full)),
        '">Prijavi se na PatriaSoul</a>',
        '</div></div></section>'
      ].join("");
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
      // Komentari moraju biti učitani prije portal.js jer portal.js odmah stvara footer.
      html=html.replace(/<\/body>/i,commentTag+portalTag+"</body>");
    }
    html=html.replace(/<footer class=["']site-footer["']><\/footer>/gi,"");
    // Globalni plutajući pomoćnik Čuvari nasljeđa (izostavi ga na samoj chat stranici da ne nastane rekurzivni iframe).
    const widgetTag='<script src="'+portalPath(full).replace(/portal\.js$/,"ai-widget.js")+'?v='+VERSION+'" defer></script>';
    if(!/assets\/js\/ai-widget\.js(?:\?[^"']*)?["']/i.test(html)){
      html=html.replace(/<\/body>/i,widgetTag+"</body>");
    }
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
  const rel=path.relative(ROOT,file).split(path.sep).join("/");
  return "/"+rel;
}
function loginPath(file){
  const rel=path.relative(path.dirname(file),ROOT).split(path.sep).filter(Boolean);
  return rel.length?"../".repeat(rel.length)+"stranice/prijava.html":"stranice/prijava.html";
}
walk(ROOT);
console.log("SHELL NORMALIZE:",changed,"HTML stranica");