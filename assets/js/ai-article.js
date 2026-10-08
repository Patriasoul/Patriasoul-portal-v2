(()=>{"use strict";
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const set=(id,v)=>{const e=$("#"+id);if(e)e.value=v??""};
const get=(id)=>$("#"+id)?.value.trim()||"";
const status=(text,ok=false)=>{const e=$("#ai-status");if(e){e.textContent=text;e.className="ps-editor-message "+(ok?"is-ok":"")}};

let rssItems=[];
let imageItems=[];

function stripHtml(s){const d=document.createElement("div");d.innerHTML=String(s||"");return (d.textContent||d.innerText||"").replace(/\s+/g," ").trim()}
function slugify(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/đ/g,"d").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,90)}
function jsonFromAI(raw){
  let s=String(raw||"").trim().replace(/^\uFEFF/,"");
  const fence=s.match(/\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`/i);if(fence)s=fence[1].trim();
  const a=s.indexOf("{"),b=s.lastIndexOf("}");
  if(a>=0&&b>a)s=s.slice(a,b+1);
  return JSON.parse(s);
}
function parseXml(xml){
  const doc=new DOMParser().parseFromString(xml,"text/xml");
  const nodes=[...doc.querySelectorAll("item")];
  if(nodes.length)return nodes.map(n=>({title:stripHtml(n.querySelector("title")?.textContent),description:stripHtml(n.querySelector("description")?.textContent),link:(n.querySelector("link")?.textContent||"").trim(),date:(n.querySelector("pubDate")?.textContent||n.querySelector("dc\\:date")?.textContent||"").trim()})).filter(x=>x.title);
  return [...doc.querySelectorAll("entry")].map(n=>({title:stripHtml(n.querySelector("title")?.textContent),description:stripHtml(n.querySelector("summary")?.textContent||n.querySelector("content")?.textContent),link:(n.querySelector("link")?.getAttribute("href")||"").trim(),date:(n.querySelector("published")?.textContent||n.querySelector("updated")?.textContent||"").trim()})).filter(x=>x.title);
}
async function fetchText(url){
  const r=await fetch(url,{cache:"no-store"});
  if(!r.ok)throw new Error("RSS HTTP "+r.status);
  return r.text();
}
async function loadRSS(){
  const url=get("ai-rss-url");if(!url)throw new Error("Unesi RSS poveznicu.");
  status("Učitavam RSS…");
  let xml="";
  try{xml=await fetchText(url)}catch(e){
    const proxy="https://api.allorigins.win/raw?url="+encodeURIComponent(url);
    xml=await fetchText(proxy);
  }
  rssItems=parseXml(xml).slice(0,20);
  if(!rssItems.length)throw new Error("RSS je učitan, ali nema prepoznatih članaka.");
  renderRSS();
  status("RSS učitan · "+rssItems.length+" stavki",true);
}
function renderRSS(){
  const box=$("#ai-rss-results");if(!box)return;
  box.hidden=false;
  box.innerHTML='<div class="ps-ai-result-head"><strong>RSS izvori</strong><span>Odaberi stavku ili ostavi temu praznu za više izvora.</span></div>'+rssItems.map((x,i)=>'<button type="button" class="ps-ai-rss-item" data-rss-index="'+i+'"><strong>'+esc(x.title)+'</strong><small>'+esc(x.date||"")+(x.description?" · "+esc(x.description.slice(0,180)):"")+'</small></button>').join("");
  box.querySelectorAll("[data-rss-index]").forEach(b=>b.addEventListener("click",()=>{const x=rssItems[Number(b.dataset.rssIndex)];set("ai-topic",x.title);document.querySelectorAll(".ps-ai-rss-item").forEach(y=>y.classList.remove("is-selected"));b.classList.add("is-selected")}));
}
async function searchImages(query){
  const url="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(query)+"&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1400&format=json&origin=*";
  const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("Pretraga fotografija nije dostupna.");
  const data=await r.json();
  imageItems=Object.values(data.query?.pages||{}).map(p=>({title:p.title?.replace(/^File:/,"")||"",url:p.imageinfo?.[0]?.thumburl||p.imageinfo?.[0]?.url||"",original:p.imageinfo?.[0]?.url||"",description:stripHtml(p.imageinfo?.[0]?.extmetadata?.ImageDescription?.value||"") ,credit:stripHtml(p.imageinfo?.[0]?.extmetadata?.Credit?.value||"")})).filter(x=>x.url);
  renderImages();
  if(imageItems[0])applyImage(imageItems[0]);
}
function renderImages(){
  const box=$("#ai-image-results");if(!box)return;
  box.hidden=!imageItems.length;
  box.innerHTML=imageItems.map((x,i)=>'<button type="button" class="ps-ai-image" data-image-index="'+i+'" title="'+esc(x.title)+'"><img src="'+esc(x.url)+'" alt="'+esc(x.title)+'" loading="lazy"><span>'+esc(x.title)+'</span></button>').join("");
  box.querySelectorAll("[data-image-index]").forEach(b=>b.addEventListener("click",()=>applyImage(imageItems[Number(b.dataset.imageIndex)])));
}
function applyImage(x){
  if(!x)return;
  set("article-image-url",x.original||x.url);
  set("article-image-alt",x.title.replace(/\.[a-z0-9]+$/i,"").replace(/_/g," "));
  document.querySelectorAll(".ps-ai-image").forEach(y=>y.classList.remove("is-selected"));
  const idx=imageItems.indexOf(x),el=document.querySelector('[data-image-index="'+idx+'"]');el?.classList.add("is-selected");
}
async function generate(){
  const topic=get("ai-topic"),mode=get("ai-mode");
  if(!topic&&!rssItems.length)throw new Error("Upiši temu ili prvo učitaj RSS.");
  if(!window.puter?.ai?.chat)throw new Error("Puter AI nije učitan.");
  const rss=rssItems.map((x,i)=>"RSS "+(i+1)+": "+x.title+"\nDATUM: "+x.date+"\nOPIS: "+x.description+"\nURL: "+x.link).join("\n\n");
  status("AI piše članak…");
  const prompt=`Ti si glavni urednik portala PatriaSoul. Piši na hrvatskom prema uredničkom standardu: činjenice prije senzacije, ne izmišljaj činjenice, citate, izvore, osobe ili događaje. Razlikuj činjenicu, tumačenje, svjedočanstvo i tradiciju. Ako podatak nije potvrđen iz dostavljenih izvora, nemoj ga predstavljati kao činjenicu. Tekst mora biti originalan, jasan, opsežan i spreman za uredničku provjeru.\n\nZADATAK: ${topic||"Odaberi najvažniju temu iz dostavljenog RSS-a."}\nNAČIN: ${mode}\n\nDOSTUPNI RSS IZVORI:\n${rss||"Nema RSS izvora."}\n\nVrati ISKLJUČIVO valjani JSON bez Markdown oznaka, sa sljedećim poljima:\n{\n"title":"naslov",\n"kicker":"kratka rubrika",\n"category":"jedna od: Domovina, Povijest, Vjera, Obitelj, Čuvari nasljeđa",\n"subcategory":"najtočnija podkategorija",\n"slug":"kratak-latinicni-slug",\n"excerpt":"sažetak do 450 znakova",\n"body_html":"HTML članka s h2/h3 podnaslovima i p elementima, bez html/body oznaka",\n"seo_title":"SEO naslov do 60 znakova",\n"meta_description":"SEO opis oko 150-160 znakova",\n"keywords":["5 do 10 ključnih riječi"],\n"image_query":"precizan upit na engleskom za Wikimedia Commons fotografiju",\n"image_alt":"točan opis fotografije",\n"sources":[{"title":"naslov izvora","url":"URL samo iz dostavljenog RSS-a"}]\n}\nAko RSS nije dovoljan za siguran članak, jasno ograniči tvrdnje i ostavi sources praznim umjesto izmišljanja URL-ova.`;
  let raw="";
  const response=await puter.ai.chat([{role:"user",content:prompt}],{model:"gpt-6-luna"});
  if(typeof response==="string")raw=response;else if(response?.message?.content)raw=response.message.content;else if(response?.text)raw=response.text;
  if(!raw&&response?.output)raw=JSON.stringify(response.output);
  if(!raw)throw new Error("AI nije vratio sadržaj.");
  const data=jsonFromAI(raw);
  fill(data);
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
  window.PatriaSoulArticleEditor?.open?.();
}
$("#ai-rss-load")?.addEventListener("click",()=>loadRSS().catch(e=>status("RSS: "+(e.message||e),false)));
$("#ai-generate")?.addEventListener("click",()=>generate().catch(e=>status("AI: "+(e.message||e),false)));
})();