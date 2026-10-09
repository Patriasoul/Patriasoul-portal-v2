(()=>{"use strict";
if(window.PatriaSoulHeaderNotices)return;window.PatriaSoulHeaderNotices=true;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=s=>{try{return new Intl.DateTimeFormat("hr-HR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(s))}catch{return ""}};
const quizCommunity=id=>"https://patriasoul.github.io/kviz/?mode=community#community-comment-"+encodeURIComponent(id);
const noticeScript=document.querySelector('script[src*="/assets/js/notifications.js"]');const portalScript=document.querySelector('script[src*="/assets/js/portal.js"]');const siteRoot=new URL("../../",(noticeScript||portalScript)?.src||location.href);const forumUrl=id=>new URL("stranice/domoljubni-forum.html?topic="+encodeURIComponent(id),siteRoot).href;
function mount(){
 const header=document.querySelector(".ps-header")||document.querySelector(".psf-head");const actions=header?.querySelector(".ps-brand-actions")||(header?.classList.contains("psf-head")?header:header?.querySelector(".psf-actions"));if(!actions||document.querySelector(".ps-notice-tools"))return;
 const tools=document.createElement("div");tools.className="ps-notice-tools";tools.innerHTML='<button class="ps-notice-trigger ps-notice-message" type="button" aria-label="Poruke i odgovori" title="Poruke i odgovori" aria-expanded="false"><span aria-hidden="true">✉</span><i class="ps-notice-count" hidden></i></button><button class="ps-notice-trigger ps-notice-bell" type="button" aria-label="Obavijesti foruma" title="Obavijesti foruma" aria-expanded="false"><span aria-hidden="true">🔔</span><i class="ps-notice-count" hidden></i></button><section class="ps-notice-panel" hidden aria-live="polite"><div class="ps-notice-panel-head"><strong>Obavijesti</strong><button type="button" data-notice-close aria-label="Zatvori">×</button></div><div class="ps-notice-list"></div></section>';
 actions.prepend(tools);
 const message=tools.querySelector(".ps-notice-message"),bell=tools.querySelector(".ps-notice-bell"),panel=tools.querySelector(".ps-notice-panel"),list=tools.querySelector(".ps-notice-list");
 let currentUser=null,client=null,kind="community",communityRows=[],forumRows=[];
 const setCount=(btn,n)=>{const b=btn.querySelector(".ps-notice-count");b.hidden=!n;b.textContent=n>9?"9+":String(n);btn.classList.toggle("has-unread",n>0)};
 const open=(k)=>{kind=k;panel.hidden=false;message.setAttribute("aria-expanded",String(k==="community"));bell.setAttribute("aria-expanded",String(k==="forum"));message.classList.toggle("is-selected",k==="community");bell.classList.toggle("is-selected",k==="forum");render()};
 const render=()=>{const rows=kind==="community"?communityRows:forumRows;const label=kind==="community"?"Poruke i odgovori":"Obavijesti foruma";panel.querySelector(".ps-notice-panel-head strong").textContent=label;if(!currentUser){list.innerHTML='<p class="ps-notice-empty">Prijavite se svojim PatriaSoul računom za pregled obavijesti.</p>';return}if(!rows.length){list.innerHTML='<p class="ps-notice-empty">Nema novih obavijesti.</p>';return}list.innerHTML=rows.map(r=>'<a class="ps-notice-item" href="'+esc(r.href)+'" data-notice-kind="'+kind+'" data-notice-id="'+esc(r.id)+'"><span class="ps-notice-item-title">'+esc(r.title)+'</span><span class="ps-notice-item-text">'+esc(r.text||"")+'</span><time>'+esc(fmt(r.created_at))+'</time></a>').join("")};
 async function load(){try{await window.PatriaSoulAuthReady;const auth=window.PatriaSoulAuth;client=await auth.client();currentUser=await auth.getUser();if(!currentUser){setCount(message,0);setCount(bell,0);return}const [c,f]=await Promise.all([
 client.from("community_notifications").select("id,user_id,actor_id,comment_id,type,created_at").eq("user_id",currentUser.id).is("read_at",null).order("created_at",{ascending:false}).limit(30),
 client.from("forum_notifications").select("id,user_id,actor_id,topic_id,post_id,type,created_at").eq("user_id",currentUser.id).is("read_at",null).order("created_at",{ascending:false}).limit(30)
 ]);if(c.error)throw c.error;if(f.error)throw f.error;
 const comments=c.data||[],forums=f.data||[];
 const ids=[...new Set(comments.map(x=>x.comment_id).filter(Boolean))],actors=[...new Set([...comments,...forums].map(x=>x.actor_id).filter(Boolean))],topicIds=[...new Set(forums.map(x=>x.topic_id).filter(Boolean))],postIds=[...new Set(forums.map(x=>x.post_id).filter(Boolean))];
 const [cr,pr,tr,ar]=await Promise.all([
 ids.length?client.from("community_comments").select("id,content,article_slug,parent_id").in("id",ids):Promise.resolve({data:[]}),
 postIds.length?client.from("forum_posts").select("id,content").in("id",postIds):Promise.resolve({data:[]}),
 topicIds.length?client.from("forum_topics").select("id,title").in("id",topicIds):Promise.resolve({data:[]}),
 actors.length?client.from("profiles").select("id,display_name").in("id",actors):Promise.resolve({data:[]})
 ]);
 const by=(arr,key="id")=>new Map((arr||[]).map(x=>[x[key],x]));const cm=by(cr.data),po=by(pr.data),to=by(tr.data),ac=by(ar.data);
 communityRows=comments.map(x=>{const c=cm.get(x.comment_id),a=ac.get(x.actor_id);return {...x,href:quizCommunity(c?.parent_id||x.comment_id),title:(a?.display_name||"Član PatriaSoul")+" · "+(x.type==="mention"?"spomenuo/la vas":"odgovorio/la na komentar"),text:c?.content||"Otvori zajednicu i nastavi razgovor."}});
 forumRows=forums.map(x=>{const a=ac.get(x.actor_id),t=to.get(x.topic_id),p=po.get(x.post_id);return {...x,href:forumUrl(x.topic_id),title:(a?.display_name||"Član PatriaSoul")+" · "+(x.type==="reply"?"odgovor na temu":"nova aktivnost na forumu"),text:(t?.title||"Forumska tema")+(p?.content?" — "+p.content:"")}});
 setCount(message,communityRows.length);setCount(bell,forumRows.length);if(!panel.hidden)render();
 }catch(e){console.warn("PatriaSoul obavijesti:",e);list.innerHTML='<p class="ps-notice-empty">Obavijesti se trenutačno ne mogu učitati. Pokušajte ponovno.</p>'}}
 message.addEventListener("click",()=>{open("community");load()});bell.addEventListener("click",()=>{open("forum");load()});tools.querySelector("[data-notice-close]").addEventListener("click",()=>{panel.hidden=true;message.setAttribute("aria-expanded","false");bell.setAttribute("aria-expanded","false")});
 list.addEventListener("click",async e=>{const a=e.target.closest("[data-notice-id]");if(!a)return;e.preventDefault();const table=a.dataset.noticeKind==="community"?"community_notifications":"forum_notifications";try{await client.from(table).update({read_at:new Date().toISOString()}).eq("id",a.dataset.noticeId).eq("user_id",currentUser.id)}catch(err){console.warn("Označavanje obavijesti:",err)}location.href=a.href});
 document.addEventListener("click",e=>{if(!tools.contains(e.target)){panel.hidden=true;message.setAttribute("aria-expanded","false");bell.setAttribute("aria-expanded","false")}});
 window.addEventListener("focus",load);document.addEventListener("visibilitychange",()=>{if(!document.hidden)load()});load();window.setInterval(()=>{if(!document.hidden)load()},60000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();