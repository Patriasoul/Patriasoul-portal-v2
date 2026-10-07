(()=>{"use strict";
const auth=window.PatriaSoulAuth;
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const val=(id,v)=>{const e=$("#"+id);if(e)e.value=v??""};
const get=(id)=>$("#"+id)?.value.trim()||"";
const statusLabel=s=>({draft:"Nacrt",review:"Za provjeru",published:"Objavljeno",archived:"Arhivirano"}[s]||s||"—");
let client=null,currentUser=null,currentId=null;

function message(text,ok=false){const e=$("#article-editor-message");if(!e)return;e.textContent=text;e.className="ps-editor-message "+(ok?"is-ok":"is-error");}
function sourcesFrom(value){return value.split(/\n/).map(x=>x.trim()).filter(Boolean);}
function sourceText(data){return Array.isArray(data?.sources)?data.sources.join("\n"):"";}

async function openEditor(id=null){
  client=client||await auth.client();
  currentUser=currentUser||await auth.getUser();
  currentId=id||null;
  $("#article-editor")?.scrollIntoView({behavior:"smooth",block:"start"});
  message("Učitavanje…");
  if(!id){
    val("article-id","");val("article-title","");val("article-kicker","");val("article-category","Domovina");
    val("article-subcategory","");val("article-path","clanci/domovina/novi-clanak.html");val("article-image-url","");
    val("article-image-alt","");val("article-excerpt","");val("article-body","");val("article-sources","");
    val("article-status","draft"); message("Novi članak — spreman za unos.");
    return;
  }
  const r=await client.from("portal_articles").select("id,slug,path,title,kicker,category,subcategory,excerpt,body_html,image_url,image_alt,author_display,status,published_at,source_data").eq("id",id).single();
  if(r.error){message("Članak nije moguće učitati: "+r.error.message);return;}
  const a=r.data||{};
  val("article-id",a.id);val("article-title",a.title);val("article-kicker",a.kicker);val("article-category",a.category);
  val("article-subcategory",a.subcategory);val("article-path",a.path||a.slug);val("article-image-url",a.image_url);val("article-image-alt",a.image_alt);
  val("article-excerpt",a.excerpt);val("article-body",a.body_html);val("article-sources",sourceText(a.source_data));val("article-status",a.status||"draft");
  message("Učitano: "+(a.title||"Bez naslova"));
}

async function save(){
  try{
    client=client||await auth.client();currentUser=currentUser||await auth.getUser();
    if(!currentUser)throw new Error("Niste prijavljeni.");
    const title=get("article-title"), path=get("article-path"), body=get("article-body"), category=get("article-category");
    if(!title||!path||!body||!category)throw new Error("Naslov, putanja, kategorija i tekst članka su obavezni.");
    if(!/^clanci\//.test(path))throw new Error("Putanja članka mora počinjati s clanci/.");
    const status=get("article-status")||"draft", now=new Date().toISOString(), id=get("article-id");
    const payload={
      title,kicker:get("article-kicker"),category,subcategory:get("article-subcategory"),excerpt:get("article-excerpt"),
      body_html:body,image_url:get("article-image-url"),image_alt:get("article-image-alt"),author_display:"Čuvari nasljeđa",
      status,published_at:status==="published"?now:null,updated_by:currentUser.id,updated_at:now,
      source_data:{sources:sourcesFrom(get("article-sources"))}
    };
    let article,err;
    if(id){
      const r=await client.from("portal_articles").update(payload).eq("id",id).select("*").single();article=r.data;err=r.error;
    }else{
      const slug=path.split("/").pop().replace(/\.html$/i,"");
      const r=await client.from("portal_articles").insert({...payload,slug,path,created_by:currentUser.id}).select("*").single();article=r.data;err=r.error;
    }
    if(err)throw err;
    const revision={article_id:article.id,revision_no:Date.now(),snapshot:article,note:status==="published"?"Objava članka":"Spremanje uredničke verzije",created_by:currentUser.id};
    const rr=await client.from("portal_article_revisions").insert(revision);if(rr.error)throw rr.error;
    currentId=article.id;val("article-id",article.id);
    message("Spremljeno: "+statusLabel(status),true);
    if(window.PatriaSoulAdmin?.refreshArticles) await window.PatriaSoulAdmin.refreshArticles();
  }catch(e){console.error(e);message("Spremanje nije uspjelo: "+(e?.message||"nepoznata greška"));}
}

function clear(){openEditor(null);}
window.PatriaSoulArticleEditor={open:openEditor,save,clear};
})();