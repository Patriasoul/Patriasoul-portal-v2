(()=>{"use strict";
const $=s=>document.querySelector(s);
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const dayLabel=v=>v==="today"?"Danas":v==="tomorrow"?"Sutra":v==="day_after_tomorrow"?"Prekosutra":"";
const severity=v=>{const x=String(v||"").toLowerCase();if(x==="minor"||x==="moderate")return"Žuto upozorenje";if(x==="severe")return"Narančasto upozorenje";if(x==="extreme")return"Crveno upozorenje";return"Upozorenje";};
const cleanWarnings=list=>{const seen=new Set();return (Array.isArray(list)?list:[]).filter(x=>x&&x.event&&!/^zeleno/i.test(x.event)&&!/^yellow/i.test(x.event)&&!/^green/i.test(x.event)&&!/^no warnings/i.test(x.description||"")&&/upozorenje/i.test(x.event)).filter(x=>{const k=[x.day,x.event,(x.areas||[]).join(",")].join("|");if(seen.has(k))return false;seen.add(k);return true}).slice(0,12);};
function render(j){
 const w=$("#weather-safety-warning"),s=$("#weather-safety-sea"); if(!w||!s)return;
 if(!j){w.innerHTML="<strong>DHMZ:</strong> Službeni podaci trenutno nisu dostupni.";s.innerHTML="<strong>DHMZ Jadran i more:</strong> Službeni zapis trenutno nije dostupan.";return;}
 const warnings=cleanWarnings(j.warnings);
 w.innerHTML=warnings.length?"<strong>Aktivna DHMZ upozorenja</strong><div class='ps-dhmz-warning-list'>"+warnings.map(x=>"<div class='ps-dhmz-warning'><div class='ps-dhmz-warning-top'><b>"+escapeHtml(severity(x.severity))+"</b><span>"+escapeHtml(dayLabel(x.day))+"</span></div><strong class='ps-dhmz-warning-title'>"+escapeHtml(x.event.replace(/^Žuto upozorenje za\s*/i,"").replace(/^Narančasto upozorenje za\s*/i,"").replace(/^Crveno upozorenje za\s*/i,""))+"</strong>"+(x.areas?.length?"<div class='ps-dhmz-warning-area'>"+escapeHtml(x.areas.slice(0,8).join(", "))+"</div>":"")+(x.description?"<p>"+escapeHtml(x.description)+"</p>":"")+"</div>").join("")+"</div>":"<strong>DHMZ:</strong> Trenutno nema aktivnih upozorenja u službenom zapisu.";
 const ad=(j.adriatic_text||[]).filter(Boolean).slice(0,5),sa=(j.sailors_text||[]).filter(Boolean).slice(0,5);
 s.innerHTML=ad.length||sa.length?"<strong>DHMZ Jadran i more</strong><div class='ps-dhmz-text-list'>"+ad.concat(sa).map(x=>"<p>"+escapeHtml(x)+"</p>").join("")+"</div>":"<strong>DHMZ Jadran i more:</strong> Trenutni službeni tekst nije dostupan.";
 if(j.updated_at){const d=new Date(j.updated_at);if(!Number.isNaN(d.getTime())){const t=new Intl.DateTimeFormat("hr-HR",{dateStyle:"short",timeStyle:"short"}).format(d);[w,s].forEach(el=>{const small=document.createElement("small");small.className="ps-dhmz-updated";small.textContent="Ažurirano: "+t;el.appendChild(small);});}}
}
async function load(){
 const w=$("#weather-safety-warning"),s=$("#weather-safety-sea");
 if(w)w.innerHTML="Dohvaćam službena DHMZ upozorenja…";if(s)s.innerHTML="Dohvaćam službeni DHMZ pregled Jadrana…";
 try{const res=await fetch("../data/dhmz-data.json?"+Date.now(),{cache:"no-store"});if(!res.ok)throw new Error("DHMZ HTTP "+res.status);render(await res.json());}
 catch(e){console.warn("PatriaSoul DHMZ:",e);render(null);}
}
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",load,{once:true});}else{load();}
})();