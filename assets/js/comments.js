(()=>{"use strict";
const article=document.querySelector(".article-page");if(!article)return;
const loadScript=(src)=>new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=src;s.async=true;s.onload=resolve;s.onerror=reject;document.head.append(s)});
const portalScript=document.querySelector('script[src*="/assets/js/portal.js"]');
const authSrc=portalScript?new URL("auth.js",portalScript.src).href:"../assets/js/auth.js";
const escape=(v)=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const loginUrl=()=>{const p=new URL("../../stranice/prijava.html",location.href);p.searchParams.set("next",location.href);return p.href};
async function boot(){
 addStyle();
 const old=document.querySelector(".ps-comments");if(old)old.remove();
 const section=document.createElement("section");section.className="ps-comments";
 section.innerHTML='<div class="ps-comments-head"><span>KOMENTARI</span><h2>Recite što mislite</h2><p>Za komentiranje morate biti prijavljeni na PatriaSoul. Anonimno komentiranje nije omogućeno.</p></div><div class="ps-comments-content"></div>';
 const related=article.querySelector(".article-related");if(related)related.after(section);else article.append(section);
 const box=section.querySelector(".ps-comments-content");
 try{if(!window.PatriaSoulAuth)await loadScript(authSrc);const auth=window.PatriaSoulAuth;const client=await auth.client();let user=await auth.getUser();
 const render=async()=>{
   const path=location.pathname.replace(/^\/+/,"/");
   const {data:rows,error}=await client.from("article_comments").select("id,user_id,author_name,body,created_at").eq("article_path",path).order("created_at",{ascending:false});
   if(error)throw error;
   const list=(rows||[]).map(c=>'<article class="ps-comment"><div class="ps-comment-top"><span class="ps-comment-author">'+escape(c.author_name)+'</span><time class="ps-comment-date">'+new Intl.DateTimeFormat("hr-HR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(c.created_at))+'</time></div><div class="ps-comment-body">'+escape(c.body)+'</div>'+(user&&user.id===c.user_id?'<button class="ps-comment-delete" data-delete="'+c.id+'">Obriši moj komentar</button>':"")+'</article>').join("");
   box.querySelectorAll(".ps-comment-list").forEach(x=>x.remove());
   const listEl=document.createElement("div");listEl.className="ps-comment-list";listEl.innerHTML=list||'<p>Nema komentara. Budite prvi prijavljeni čitatelj koji će ostaviti komentar.</p>';box.append(listEl);
   listEl.querySelectorAll("[data-delete]").forEach(btn=>btn.onclick=async()=>{const {error}=await client.from("article_comments").delete().eq("id",btn.dataset.delete);if(error)alert("Komentar nije moguće obrisati.");else render()});
 };
 const renderGate=()=>{
   box.querySelector(".ps-comment-form,.ps-comments-login")?.remove();
   if(!user){
     const gate=document.createElement("div");gate.className="ps-comments-login";gate.innerHTML='<strong>Komentiranje je dostupno samo prijavljenim korisnicima.</strong><p>Prijavite se svojim PatriaSoul računom kako biste mogli objaviti komentar.</p><a href="'+loginUrl()+'">Prijavi se na PatriaSoul</a>';box.prepend(gate);
   }else{
     const name=escape(user.user_metadata?.display_name||user.email?.split("@")[0]||"Čitatelj");
     const form=document.createElement("form");form.className="ps-comment-form";form.innerHTML='<label>Vaš komentar</label><textarea maxlength="2000" required placeholder="Napišite svoj komentar..."></textarea><small>Objavljujete kao <strong>'+name+'</strong>. Komentar je povezan s vašim PatriaSoul računom.</small><button type="submit">Objavi komentar</button><div class="ps-comment-error" hidden></div>';
     box.prepend(form);
     form.onsubmit=async e=>{e.preventDefault();const err=form.querySelector(".ps-comment-error");err.hidden=true;const body=form.querySelector("textarea").value.trim();if(!body)return;const displayName=user.user_metadata?.display_name||user.email?.split("@")[0]||"Čitatelj";const {error}=await client.from("article_comments").insert({article_path:location.pathname.replace(/^\/+/,"/"),user_id:user.id,author_name:displayName,body});if(error){err.textContent="Komentar nije objavljen. Pokušajte ponovno.";err.hidden=false;return}form.querySelector("textarea").value="";await render()};
   }
 };
 await renderGate();await render();
 client.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;renderGate();render()});
 }catch(error){box.innerHTML='<div class="ps-comments-login"><strong>Komentari trenutno nisu dostupni.</strong><p>Prijava i komentiranje bit će ponovno dostupni čim se uspostavi korisnička sesija.</p></div>';console.error(error)}
}
boot();
})();