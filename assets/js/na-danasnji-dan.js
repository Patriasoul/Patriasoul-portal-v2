(() => {
"use strict";
const HR_API = "https://hr.wikipedia.org/w/api.php";
const $ = (s) => document.querySelector(s);
const pad = (n) => String(n).padStart(2,"0");
const hrMonths = ["siječnja","veljače","ožujka","travnja","svibnja","lipnja","srpnja","kolovoza","rujna","listopada","studenoga","prosinca"];
const categoryFor = (e) => {
  const text = (String(e.text || "") + " " + String(e.pages?.[0]?.normalizedtitle || "")).toLowerCase();
  if (/olympic|football|soccer|basketball|tennis|sport|championship|world cup|games/.test(text)) return "Sport";
  if (/science|scientist|space|moon|nasa|physics|chemistry|medicine|medical|discovery|invention|technology|computer|atom|nobel/.test(text)) return "Znanost";
  if (/film|movie|music|artist|painting|literature|author|writer|poet|theatre|theater|culture|book|opera|concert/.test(text)) return "Kultura";
  return "Povijest";
};
const cleanText = (text) => String(text || "").replace(/\s+/g," ").trim();
const yearFor = (e) => Number(e.year);
const state = { date:new Date(), events:[] };

function dateLabel(d){ return new Intl.DateTimeFormat("hr-HR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(d); }
function renderDate(d){
  $("#today-date").textContent = dateLabel(d);
  $("#date-picker").value = d.toISOString().slice(0,10);
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

async function fetchJson(url){
  const r=await fetch(url,{headers:{"Accept":"application/json"}});
  if(!r.ok) throw new Error("Dohvat nije uspio.");
  return r.json();
}

async function fetchCroatianEvents(d){
  const page = d.getDate() + "._" + hrMonths[d.getMonth()];
  const url = HR_API + "?action=parse&page=" + encodeURIComponent(page) + "&prop=text&format=json&origin=*";
  const json = await fetchJson(url);
  const html = json?.parse?.text?.["*"];
  if(!html) throw new Error("Hrvatska Wikipedija nije vratila stranicu.");

  const doc = new DOMParser().parseFromString(html,"text/html");
  const headings = Array.from(doc.querySelectorAll("h2"));
  const heading = headings.find(h => cleanText(h.textContent).replace("[uredi]","").trim().toLowerCase() === "događaji");
  if(!heading) return [];

  const events=[];
  let node=heading.nextElementSibling;
  while(node && !/^h2$/i.test(node.tagName)){
    if(node.matches("ul")){
      node.querySelectorAll(":scope > li").forEach(li=>{
        const text=cleanText(li.textContent);
        if(!text) return;
        const m=text.match(/^(\d{1,4})\.?\s*[–-]\s*(.*)$/);
        if(!m) return;
        events.push({
          year:Number(m[1]),
          text:m[2],
          localizedTitle:m[2].split(/[,.]/)[0].trim() || "Događaj",
          localizedText:m[2]
        });
      });
    }
    node=node.nextElementSibling;
  }
  return events;
}

function eventCard(e, featured=false){
  const year = yearFor(e);
  const category = categoryFor(e);
  const title = e.localizedTitle || "Događaj";
  const text = e.localizedText || "";
  const yearLabel = Number.isFinite(year) ? String(year) : "—";
  return featured
    ? '<div class="ps-event-meta"><span class="ps-event-year">'+yearLabel+'</span><span class="ps-event-category">'+category+'</span></div><h3>'+escapeHtml(title)+'</h3><p>'+escapeHtml(text)+'</p>'
    : '<article class="ps-event-card"><div class="ps-event-meta"><span class="ps-event-year">'+yearLabel+'</span><span class="ps-event-category">'+category+'</span></div><h3>'+escapeHtml(title)+'</h3><p>'+escapeHtml(text)+'</p></article>';
}
function render(events){
  const grid=$("#events-grid"),feature=$("#featured-event"),featureContent=$("#featured-event-content"),empty=$("#events-empty");
  grid.innerHTML=""; feature.hidden=true; empty.hidden=true;
  if(!events.length){empty.hidden=false;return;}
  const sorted=events.slice().sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0));
  feature.hidden=false;
  featureContent.innerHTML=eventCard(sorted[0],true);
  sorted.slice(1,16).forEach(e=>grid.insertAdjacentHTML("beforeend",eventCard(e,false)));
}
async function load(d){
  state.date=d; renderDate(d);
  $("#today-status").textContent="Događaji se automatski dohvaćaju i prikazuju na hrvatskom…";
  $("#events-grid").innerHTML='<div class="ps-event-loading">Učitavanje događaja…</div>';
  $("#featured-event").hidden=true; $("#events-empty").hidden=true;
  try{
    const localized = await fetchCroatianEvents(d);
    state.events=localized;
    render(localized);
    $("#today-status").textContent=localized.length
      ? ("Prikazano "+localized.length+" događaja na hrvatskom jeziku.")
      : "Za ovaj datum nema dostupnih događaja s hrvatskim opisom.";
  }catch(err){
    state.events=[];
    $("#events-grid").innerHTML='<div class="ps-event-error">Događaje trenutačno nije moguće automatski dohvatiti. Pokušaj ponovno za nekoliko trenutaka.</div>';
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
  try{await navigator.clipboard.writeText(location.href.split("#")[0]);$("#share-status").textContent="Poveznica je kopirana.";}
  catch(_){$("#share-status").textContent="Kopiranje nije dostupno u ovom pregledniku.";}
});
load(new Date());
})();