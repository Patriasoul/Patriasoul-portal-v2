(() => {
"use strict";
const API = "https://en.wikipedia.org/api/rest_v1/feed/onthisday";
const $ = (s) => document.querySelector(s);
const pad = (n) => String(n).padStart(2,"0");
const hrMonths = ["siječnja","veljače","ožujka","travnja","svibnja","lipnja","srpnja","kolovoza","rujna","listopada","studenoga","prosinca"];
const categoryFor = (e) => {
  const text = (String(e.text || "") + " " + String(e.pages?.[0]?.normalizedtitle || "")).toLowerCase();
  if (/olympic|olympics|football|soccer|basketball|tennis|sport|championship|world cup|games/.test(text)) return "Sport";
  if (/science|scientist|space|moon|nasa|physics|chemistry|medicine|medical|discovery|invention|technology|computer|atom|nobel/.test(text)) return "Znanost";
  if (/film|movie|music|artist|painting|literature|author|writer|poet|theatre|theater|culture|book|opera|concert/.test(text)) return "Kultura";
  return "Povijest";
};
const cleanText = (text) => String(text || "").replace(/\s+/g," ").trim();
const titleFor = (e) => cleanText(e.pages?.[0]?.normalizedtitle || e.pages?.[0]?.title || e.text || "Događaj");
const linkFor = (e) => e.pages?.[0]?.content_urls?.desktop?.page || e.pages?.[0]?.content_urls?.mobile?.page || "https://en.wikipedia.org/";
const yearFor = (e) => Number(e.year);
const state = { date:new Date(), events:[] };

function dateLabel(d){
  return new Intl.DateTimeFormat("hr-HR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(d);
}
function apiUrl(d){
  return API + "/events/" + pad(d.getMonth()+1) + "/" + pad(d.getDate());
}
function sourceUrl(d){
  return "https://en.wikipedia.org/wiki/" + encodeURIComponent(new Intl.DateTimeFormat("en-US",{month:"long"}).format(d)) + "_" + d.getDate();
}
function renderDate(d){
  $("#today-date").textContent = dateLabel(d);
  $("#date-picker").value = d.toISOString().slice(0,10);
  $("#source-link").href = sourceUrl(d);
}
function eventCard(e, featured=false){
  const year = yearFor(e);
  const category = categoryFor(e);
  const title = titleFor(e);
  const text = cleanText(e.text);
  const link = linkFor(e);
  const yearLabel = Number.isFinite(year) ? String(year) : "—";
  return (featured ? '<div class="ps-event-meta"><span class="ps-event-year">'+yearLabel+'</span><span class="ps-event-category">'+category+'</span></div><h3>'+escapeHtml(title)+'</h3><p>'+escapeHtml(text)+'</p><a class="ps-event-source" href="'+escapeAttr(link)+'" target="_blank" rel="noopener">Izvor događaja →</a>' : '<article class="ps-event-card"><div class="ps-event-meta"><span class="ps-event-year">'+yearLabel+'</span><span class="ps-event-category">'+category+'</span></div><h3>'+escapeHtml(title)+'</h3><p>'+escapeHtml(text)+'</p><a class="ps-event-source" href="'+escapeAttr(link)+'" target="_blank" rel="noopener">Provjeri izvor →</a></article>');
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function escapeAttr(v){return escapeHtml(v);}
function render(events){
  const grid = $("#events-grid"), feature = $("#featured-event"), featureContent = $("#featured-event-content"), empty=$("#events-empty");
  grid.innerHTML=""; feature.hidden=true; empty.hidden=true;
  if(!events.length){empty.hidden=false;return;}
  const sorted = events.slice().sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0));
  feature.hidden=false;
  featureContent.innerHTML=eventCard(sorted[0],true);
  sorted.slice(1,16).forEach(e=>grid.insertAdjacentHTML("beforeend",eventCard(e,false)));
}
async function load(d){
  state.date = d; renderDate(d);
  $("#today-status").textContent="Događaji se automatski dohvaćaju…";
  $("#events-grid").innerHTML='<div class="ps-event-loading">Učitavanje događaja…</div>';
  $("#featured-event").hidden=true; $("#events-empty").hidden=true;
  try{
    const r=await fetch(apiUrl(d),{headers:{"Accept":"application/json"}});
    if(!r.ok) throw new Error("Izvor trenutno nije dostupan.");
    const json=await r.json();
    const events=Array.isArray(json.events)?json.events:[];
    state.events=events;
    render(events);
    $("#today-status").textContent=events.length ? ("Učitano "+events.length+" događaja. Izvor: Wikimedia/Wikipedia.") : "Izvor nije vratio događaje za ovaj datum.";
  }catch(err){
    state.events=[];
    $("#events-grid").innerHTML='<div class="ps-event-error">Događaje trenutačno nije moguće automatski dohvatiti. Pokušaj ponovno za nekoliko trenutaka ili otvori izvor.</div>';
    $("#today-status").textContent="Automatsko učitavanje nije uspjelo.";
  }
}
function shift(days){const d=new Date(state.date);d.setDate(d.getDate()+days);load(d);}
$("#date-prev").addEventListener("click",()=>shift(-1));
$("#date-next").addEventListener("click",()=>shift(1));
$("#date-today").addEventListener("click",()=>load(new Date()));
$("#date-picker").addEventListener("change",e=>{if(e.target.value){const [y,m,day]=e.target.value.split("-").map(Number);load(new Date(y,m-1,day));}});
$("#share-button").addEventListener("click",async()=>{
  const url=location.href.split("#")[0];
  const title="Na današnji dan — "+dateLabel(state.date);
  try{
    if(navigator.share){await navigator.share({title,text:title,url});$("#share-status").textContent="Podijeljeno.";}
    else{await navigator.clipboard.writeText(url);$("#share-status").textContent="Poveznica je kopirana.";}
  }catch(_){}
});
$("#copy-button").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(location.href.split("#")[0]);$("#share-status").textContent="Poveznica je kopirana.";}catch(_){$("#share-status").textContent="Kopiranje nije dostupno u ovom pregledniku.";}
});
load(new Date());
})();