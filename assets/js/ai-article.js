(()=>{"use strict";
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const set=(id,v)=>{const e=$("#"+id);if(e)e.value=v??""};
const get=(id)=>$("#"+id)?.value.trim()||"";
const status=(text,ok=false)=>{const e=$("#ai-status");if(e){e.textContent=text;e.className="ps-editor-message "+(ok?"is-ok":"")}};

const ALLOWED_RSS_HOSTS=new Set(["index.hr","www.index.hr","vecernji.hr","www.vecernji.hr"]);
function isAllowedFeedUrl(value){
  try{const u=new URL(value);return u.protocol==="https:"&&ALLOWED_RSS_HOSTS.has(u.hostname.toLowerCase())&&!u.username&&!u.password}
  catch(_){return false}
}
function validateFeedUrl(value){
  let parsed;try{parsed=new URL(value)}catch(_){throw new Error("RSS poveznica nije valjana.")}
  if(!isAllowedFeedUrl(parsed.href))throw new Error("Dopušteni RSS izvori su Index.hr i Večernji list. Novi izvori moraju se prethodno odobriti u konfiguraciji PatriaSoula.");
  return parsed;
}
const FEED_KEY="patriasoul_ai_rss_feeds_v2";
const LAST_KEY="patriasoul_ai_rss_last_refresh_v1";
const DEFAULT_FEEDS=[
  {name:"Index.hr · Hrvatska",url:"https://www.index.hr/rss/vijesti-hrvatska",enabled:true},
  {name:"Večernji list · najnovije",url:"https://www.vecernji.hr/feed",enabled:true}
];
let feeds=[];
let rssItems=[];
let selectedRss=new Set();
let imageItems=[];

function stripHtml(s){const d=document.createElement("div");d.innerHTML=String(s||"");return (d.textContent||d.innerText||"").replace(/\s+/g," ").trim()}
function wordCount(html){const text=stripHtml(html).replace(/[^a-zA-Z0-9À-ž]+/g," ").trim();return text?text.split(/\s+/).length:0}
function slugify(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/đ/g,"d").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,90)}
function jsonFromAI(raw){
  let s=String(raw||"").trim().replace(/^\uFEFF/,"");
  const fence=s.match(/```(?:json)?\s*([\s\S]*?)```/i);if(fence)s=fence[1].trim();
  const a=s.indexOf("{"),b=s.lastIndexOf("}");if(a>=0&&b>a)s=s.slice(a,b+1);
  return JSON.parse(s);
}
function loadFeeds(){
  try{const saved=JSON.parse(localStorage.getItem(FEED_KEY)||"null");feeds=Array.isArray(saved)&&saved.length?saved:DEFAULT_FEEDS.map(x=>({...x}));}
  catch(_){feeds=DEFAULT_FEEDS.map(x=>({...x}))}
  renderFeeds();
}
function saveFeeds(){localStorage.setItem(FEED_KEY,JSON.stringify(feeds))}
function feedName(url){
  try{return new URL(url).hostname.replace(/^www\./,"")}
  catch(_){return "RSS izvor"}
}
function renderFeeds(){
  const box=$("#ai-rss-feeds");if(!box)return;
  box.innerHTML=feeds.map((f,i)=>'<div class="ps-ai-feed-row"><label><input type="checkbox" data-feed-toggle="'+i+'" '+(f.enabled!==false?"checked":"")+'> <strong>'+esc(f.name||feedName(f.url))+'</strong></label><small>'+esc(f.url)+'</small><button type="button" class="ps-admin-danger" data-feed-remove="'+i+'">Ukloni</button></div>').join("");
  box.querySelectorAll("[data-feed-toggle]").forEach(el=>el.addEventListener("change",()=>{feeds[Number(el.dataset.feedToggle)].enabled=el.checked;saveFeeds()}));
  box.querySelectorAll("[data-feed-remove]").forEach(el=>el.addEventListener("click",()=>{feeds.splice(Number(el.dataset.feedRemove),1);saveFeeds();renderFeeds()}));
}
function parseXml(xml,source){
  const doc=new DOMParser().parseFromString(xml,"text/xml");
  const nodes=[...doc.querySelectorAll("item")];
  if(nodes.length)return nodes.map(n=>({title:stripHtml(n.querySelector("title")?.textContent),description:stripHtml(n.querySelector("description")?.textContent),link:(n.querySelector("link")?.textContent||"").trim(),date:(n.querySelector("pubDate")?.textContent||n.querySelector("dc\\:date")?.textContent||"").trim(),source})).filter(x=>x.title);
  return [...doc.querySelectorAll("entry")].map(n=>({title:stripHtml(n.querySelector("title")?.textContent),description:stripHtml(n.querySelector("summary")?.textContent||n.querySelector("content")?.textContent),link:(n.querySelector("link")?.getAttribute("href")||"").trim(),date:(n.querySelector("published")?.textContent||n.querySelector("updated")?.textContent||"").trim(),source})).filter(x=>x.title);
}
async function fetchText(url){
  const parsed=validateFeedUrl(url);
  const endpoint="/api/rss?url="+encodeURIComponent(parsed.href);
  const r=await fetch(endpoint,{cache:"no-store",headers:{"Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml, */*"}});
  if(!r.ok){
    let detail="";
    try{detail=(await r.text()).slice(0,180)}catch(_){}
    throw new Error("RSS poslužitelj vratio je HTTP "+r.status+(detail?": "+detail:""));
  }
  return r.text();
}
async function fetchFeed(feed){
  const xml=await fetchText(feed.url);
  const items=parseXml(xml,feed.name||feedName(feed.url));
  if(!items.length)throw new Error("Izvor ne sadrži prepoznatljive RSS/Atom stavke.");
  return items;
}
async function refreshAllFeeds(){
  const enabled=feeds.filter(f=>f.enabled!==false&&f.url);
  if(!enabled.length)throw new Error("Nema uključenih RSS izvora.");
  status("Učitavam "+enabled.length+" RSS izvora preko PatriaSoul poslužitelja…");
  const results=await Promise.all(enabled.map(async f=>{try{return {feed:f,items:await fetchFeed(f),error:null}}catch(error){return {feed:f,items:[],error:error?.message||"nepoznata greška"}}}));
  const seen=new Set();
  rssItems=results.flatMap(x=>x.items).filter(x=>x.title&&x.link).filter(x=>{const k=x.link||x.title;if(seen.has(k))return false;seen.add(k);return true});
  rssItems.sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0));
  rssItems=rssItems.slice(0,60);
  selectedRss=new Set();
  renderRSS();
  const failed=results.filter(x=>x.error);
  if(!rssItems.length){
    const details=failed.map(x=>(x.feed.name||feedName(x.feed.url))+": "+x.error).join(" | ");
    throw new Error("Nijedan RSS izvor nije uspio. "+details);
  }
  localStorage.setItem(LAST_KEY,String(Date.now()));
  status("RSS učitan · "+rssItems.length+" stavki"+(failed.length?" · Neuspjeli izvori: "+failed.map(x=>x.feed.name||feedName(x.feed.url)).join(", "):" · Svi izvori rade."),true);
}
async function loadSingleRSS(){
  const raw=get("ai-rss-url");if(!raw)throw new Error("Unesi RSS poveznicu.");
  const parsed=validateFeedUrl(raw);
  const feed={name:feedName(parsed.href),url:parsed.href};
  const items=await fetchFeed(feed);rssItems=items.slice(0,30);selectedRss=new Set();renderRSS();
  status("RSS učitan · "+rssItems.length+" stavki iz "+feed.name+".",true);
}
function renderRSS(){
  const box=$("#ai-rss-results");if(!box)return;
  box.hidden=false;
  box.innerHTML='<div class="ps-ai-result-head"><strong>RSS članci · '+rssItems.length+'</strong><span>Označi članke koje želiš da AI obradi.</span></div>'+rssItems.map((x,i)=>'<label class="ps-ai-rss-item '+(selectedRss.has(i)?"is-selected":"")+'"><input type="checkbox" data-rss-check="'+i+'" '+(selectedRss.has(i)?"checked":"")+'><span><strong>'+esc(x.title)+'</strong><small>'+esc(x.source||"")+' · '+esc(x.date||"")+(x.description?" · "+esc(x.description.slice(0,180)):"")+'</small></span></label>').join("");
  box.querySelectorAll("[data-rss-check]").forEach(el=>el.addEventListener("change",()=>{const i=Number(el.dataset.rssCheck);if(el.checked)selectedRss.add(i);else selectedRss.delete(i);el.closest(".ps-ai-rss-item")?.classList.toggle("is-selected",el.checked)}));
}
async function searchImages(query){
  const url="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(query)+"&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1400&format=json&origin=*";
  const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("Pretraga fotografija nije dostupna.");
  const data=await r.json();
  imageItems=Object.values(data.query?.pages||{}).map(p=>({title:p.title?.replace(/^File:/,"")||"",url:p.imageinfo?.[0]?.thumburl||p.imageinfo?.[0]?.url||"",original:p.imageinfo?.[0]?.url||"",description:stripHtml(p.imageinfo?.[0]?.extmetadata?.ImageDescription?.value||""),credit:stripHtml(p.imageinfo?.[0]?.extmetadata?.Credit?.value||"")})).filter(x=>x.url);
  renderImages();if(imageItems[0])applyImage(imageItems[0]);
}
function renderImages(){
  const box=$("#ai-image-results");if(!box)return;
  box.hidden=!imageItems.length;
  box.innerHTML=imageItems.map((x,i)=>'<button type="button" class="ps-ai-image" data-image-index="'+i+'" title="'+esc(x.title)+'"><img src="'+esc(x.url)+'" alt="'+esc(x.title)+'" loading="lazy"><span>'+esc(x.title)+'</span></button>').join("");
  box.querySelectorAll("[data-image-index]").forEach(b=>b.addEventListener("click",()=>applyImage(imageItems[Number(b.dataset.imageIndex)])));
}
function applyImage(x){
  if(!x)return;set("article-image-url",x.original||x.url);set("article-image-alt",x.title.replace(/\.[a-z0-9]+$/i,"").replace(/_/g," "));
  document.querySelectorAll(".ps-ai-image").forEach(y=>y.classList.remove("is-selected"));
  const idx=imageItems.indexOf(x),el=document.querySelector('[data-image-index="'+idx+'"]');el?.classList.add("is-selected");
}
async function generate(){
  const topic=get("ai-topic"),mode=get("ai-mode");
  const chosen=[...selectedRss].map(i=>rssItems[i]).filter(Boolean);
  if(!topic&&!chosen.length&&!rssItems.length)throw new Error("Upiši temu ili učitaj RSS.");
  if(!window.puter?.ai?.chat)throw new Error("Puter AI nije učitan.");
  const sourceItems=chosen.length?chosen:rssItems;
  const rss=sourceItems.map((x,i)=>"RSS "+(i+1)+": "+x.title+"\nIZVOR: "+x.source+"\nDATUM: "+x.date+"\nOPIS: "+x.description+"\nURL: "+x.link).join("\n\n");
  status(chosen.length?"AI obrađuje "+chosen.length+" odabranih RSS članaka…":"AI piše članak…");
  const prompt=`Ti si glavni urednik portala PatriaSoul. Piši na hrvatskom prema uredničkom standardu: činjenice prije senzacije, ne izmišljaj činjenice, citate, izvore, osobe ili događaje. Razlikuj činjenicu, tumačenje, svjedočanstvo i tradiciju. Ako podatak nije potvrđen iz dostavljenih izvora, nemoj ga predstavljati kao činjenicu. Tekst mora biti originalan, jasan, opsežan i spreman za uredničku provjeru. OBVEZNA DULJINA: najmanje 1.500 riječi u body_html; ciljaj 1.700–2.200 riječi, a za složene teme i više. Nemoj umjetno ponavljati iste tvrdnje. Razvij uvod, najmanje 6 smislenih H2 cjelina (po potrebi H3), kontekst, potvrđene činjenice, značenje teme i zaključak. Ako izvori ne omogućuju sigurno proširenje, jasno navedi ograničenja, ali napiši najpotpuniji provjerljiv tekst.

ZADATAK: ${topic||"Od odabranih RSS vijesti napravi jedan smislen, originalan PatriaSoul članak; ne prepisuj izvorni tekst."}
NAČIN: ${mode}

DOSTUPNI RSS IZVORI:
${rss||"Nema RSS izvora."}

Vrati ISKLJUČIVO valjani JSON bez Markdown oznaka, sa sljedećim poljima:
{"title":"naslov","kicker":"kratka rubrika","category":"jedna od: Domovina, Povijest, Vjera, Obitelj, Čuvari nasljeđa","subcategory":"najtočnija podkategorija","slug":"kratak-latinicni-slug","excerpt":"sažetak do 450 znakova","body_html":"HTML članka s h2/h3 podnaslovima i p elementima, bez html/body oznaka","seo_title":"SEO naslov do 60 znakova","meta_description":"SEO opis oko 150-160 znakova","keywords":["5 do 10 ključnih riječi"],"image_query":"precizan upit na engleskom za Wikimedia Commons fotografiju","image_alt":"točan opis fotografije","sources":[{"title":"naslov izvora","url":"URL samo iz dostavljenog RSS-a"}]}
Ako RSS nije dovoljan za siguran članak, jasno ograniči tvrdnje i ostavi sources praznim umjesto izmišljanja URL-ova.`;
  let raw="";const response=await puter.ai.chat([{role:"user",content:prompt}],{model:"gpt-6-luna"});
  if(typeof response==="string")raw=response;else if(response?.message?.content)raw=response.message.content;else if(response?.text)raw=response.text;if(!raw&&response?.output)raw=JSON.stringify(response.output);if(!raw)throw new Error("AI nije vratio sadržaj.");
  let article=jsonFromAI(raw);
  let words=wordCount(article.body_html);
  if(words<1500){
    status("Članak ima "+words+" riječi. AI ga proširuje do najmanje 1.500 riječi…");
    const expandPrompt="Proširi ovaj PatriaSoul članak tako da body_html ima NAJMANJE 1.500 riječi, cilj 1.700–2.200. Ne dodaj izmišljene činjenice, citate, izvore, datume ili događaje. Proširi kontekst i relevantne podnaslove bez ponavljanja. Zadrži sve postojeće JSON ključeve i vrati ISKLJUČIVO valjani JSON bez Markdowna. Ne mijenjaj izvore.\\n\\nULAZNI ČLANAK:\\n"+JSON.stringify(article);
    const expanded=await puter.ai.chat([{role:"user",content:expandPrompt}],{model:"gpt-6-luna"});
    const expandedRaw=typeof expanded==="string"?expanded:expanded?.message?.content||expanded?.text||(expanded?.output?JSON.stringify(expanded.output):"");
    if(expandedRaw){const candidate=jsonFromAI(expandedRaw);if(wordCount(candidate.body_html)>words)article=candidate;words=wordCount(article.body_html)}
  }
  const editorPanel=$("#article-editor");if(editorPanel)editorPanel.hidden=false;
  fill(article);
  // Novi AI članak uvijek ulazi u CMS kao nacrt; nikad ne nasljeđuje status prethodnog članka.
  set("article-status","draft");
  const count=wordCount(article.body_html);
  status("Članak je prenesen u CMS urednik · "+count+" riječi"+(count<1500?" · UPOZORENJE: ispod minimuma 1.500 riječi.":" · duljina zadovoljena.")+" · status: Nacrt",count>=1500);
  // Nakon generiranja prikaži korisniku stvarna polja u koja će članak spremiti.
  requestAnimationFrame(()=>$("#article-editor")?.scrollIntoView({behavior:"smooth",block:"start"}));
}
function fill(d){
  set("article-title",d.title);set("article-kicker",d.kicker);set("article-category",d.category);set("article-subcategory",d.subcategory);
  set("article-path","clanci/"+slugify(d.category||"domovina")+"/"+(slugify(d.slug||d.title)||"novi-clanak")+".html");
  set("article-excerpt",d.excerpt);set("article-body",d.body_html);set("article-seo-title",d.seo_title||d.title);set("article-meta-description",d.meta_description||d.excerpt);set("article-seo-keywords",Array.isArray(d.keywords)?d.keywords.join(", "):"");
  set("article-sources",(Array.isArray(d.sources)?d.sources:[]).map(x=>x?.url).filter(Boolean).join("\n"));
  if(d.image_alt)set("article-image-alt",d.image_alt);
  status("Članak je generiran · tražim odgovarajuću fotografiju…",true);
  if(d.image_query)searchImages(d.image_query).then(()=>status("Članak + SEO + fotografija spremni za pregled.",true)).catch(()=>status("Članak + SEO spremni; fotografiju možeš odabrati ručno.",true));
  else status("Članak + SEO spremni za pregled.",true);
}
function addFeed(){
  const input=$("#ai-rss-new-url"),url=input?.value.trim();if(!url)return;
  let parsed;try{parsed=validateFeedUrl(url)}catch(e){status("RSS: "+(e.message||e),false);return}
  if(feeds.some(f=>f.url===parsed.href)){status("RSS: taj izvor već postoji.",false);return}
  feeds.push({name:feedName(parsed.href),url:parsed.href,enabled:true});saveFeeds();renderFeeds();if(input)input.value="";status("RSS izvor dodan.",true);
}
async function bootRSS(){
  loadFeeds();
  const last=Number(localStorage.getItem(LAST_KEY)||0);
  if(!last||Date.now()-last>24*60*60*1000){
    try{await refreshAllFeeds()}catch(e){status("RSS automatsko osvježavanje: "+(e.message||e),false)}
  }
}
window.PatriaSoulAIArticle={generateFromRSS:async item=>{
  if(!item||!item.title||!item.link)throw new Error("RSS prijedlog nema naslov ili izvornu poveznicu.");
  rssItems=[{title:item.title,description:item.description||"",link:item.link,date:item.date||"",source:item.source||"RSS izvor"}];
  selectedRss=new Set([0]);
  set("ai-topic","Napiši originalan, provjeren članak na temelju ove vijesti. Naslov vijesti: "+item.title+"\nSažetak: "+(item.description||"Nije dostavljen.")+"\nIzvorna poveznica: "+item.link+"\nNemoj prepisivati izvor. Provjeri što je potvrđeno i ne izmišljaj činjenice.");
  set("ai-mode","rss");
  $("#article-ai")?.scrollIntoView({behavior:"smooth",block:"start"});
  await generate();
}};
$("#ai-rss-refresh-all")?.addEventListener("click",()=>refreshAllFeeds().catch(e=>status("RSS: "+(e.message||e),false)));
$("#ai-rss-load")?.addEventListener("click",()=>loadSingleRSS().catch(e=>status("RSS: "+(e.message||e),false)));
$("#ai-rss-add")?.addEventListener("click",addFeed);
$("#ai-rss-new-url")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addFeed()}});
$("#ai-rss-selected-generate")?.addEventListener("click",()=>generate().catch(e=>status("AI: "+(e.message||e),false)));
$("#ai-generate")?.addEventListener("click",()=>generate().catch(e=>status("AI: "+(e.message||e),false)));
bootRSS();
})();