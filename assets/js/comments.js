(()=>{"use strict";
const article=document.querySelector(".article-page");if(!article)return;
const loadScript=(src)=>new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=src;s.async=true;s.onload=resolve;s.onerror=reject;document.head.append(s)});
const portalScript=document.querySelector('script[src*="/assets/js/portal.js"]');
const authSrc=portalScript?new URL("auth.js",portalScript.src).href:"../assets/js/auth.js";
const addStyle=()=>{if(document.getElementById("ps-comments-style"))return;const s=document.createElement("style");s.id="ps-comments-style";s.textContent=".ps-comments{width:100%;max-width:820px;margin:42px auto 20px;padding:28px 0 10px;border-top:4px solid var(--ps-blue,#17395f)}.ps-comments-head span{color:var(--ps-red,#b51f35);font-size:.7rem;font-weight:900;letter-spacing:.14em}.ps-comments-head h2{margin:7px 0 4px;color:var(--ps-blue,#17395f);font:800 1.7rem/1.2 Georgia,serif}.ps-comments-head p{margin:0 0 22px;color:var(--ps-muted,#68747d);font-size:.9rem}.ps-comments-login,.ps-comment-form{padding:18px;border:1px solid var(--ps-border,#d9dde1);border-radius:10px;background:#fff}.ps-comments-login strong{display:block;color:var(--ps-blue,#17395f);margin-bottom:6px}.ps-comments-login p{margin:0 0 13px;color:var(--ps-muted,#68747d);font-size:.9rem}.ps-comments-login a,.ps-comment-form button{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:7px;padding:10px 15px;background:var(--ps-blue,#17395f);color:#fff;text-decoration:none;font-weight:800;cursor:pointer}.ps-comment-form{display:grid;gap:10px;margin-bottom:18px}.ps-comment-form label{font-weight:800;color:var(--ps-blue,#17395f);font-size:.85rem}.ps-comment-form textarea{width:100%;min-height:110px;resize:vertical;border:1px solid var(--ps-border,#d9dde1);border-radius:7px;padding:11px;font:inherit}.ps-comment-form small{color:var(--ps-muted,#68747d)}.ps-comment-error{color:#b51f35;font-size:.85rem}.ps-comment-list{display:grid;gap:12px}.ps-comment{padding:16px;border:1px solid var(--ps-border,#d9dde1);border-radius:10px;background:#fff}.ps-comment-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.ps-comment-author{font-weight:900;color:var(--ps-blue,#17395f)}.ps-comment-date{font-size:.76rem;color:var(--ps-muted,#68747d)}.ps-comment-body{margin:10px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.65}.ps-comment-delete{margin-top:10px;border:0;background:none;color:#b51f35;font-weight:800;cursor:pointer;padding:0}@media(max-width:560px){.ps-comments{margin-top:34px}.ps-comment-top{align-items:flex-start;flex-direction:column;gap:3px}}";document.head.append(s)};
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