"use strict";

const fs = require("fs");
const path = require("path");

const API = "https://hr.wikipedia.org/w/api.php";
const MONTHS = ["siječnja","veljače","ožujka","travnja","svibnja","lipnja","srpnja","kolovoza","rujna","listopada","studenoga","prosinca"];

function pad(n){ return String(n).padStart(2,"0"); }

async function fetchJson(url, attempts=3){
  let lastError;
  for(let attempt=1;attempt<=attempts;attempt++){
    try{
      const response=await fetch(url,{headers:{"User-Agent":"PatriaSoul/1.1 (na-danasnji-dan; https://patriasoul.github.io/Patriasoul-portal-v2/)","Accept":"application/json"}});
      if(!response.ok) throw new Error("HTTP "+response.status);
      return await response.json();
    }catch(error){
      lastError=error;
      if(attempt<attempts) await new Promise(resolve=>setTimeout(resolve,attempt*1000));
    }
  }
  throw lastError;
}

function clean(value){
  return String(value || "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi,"")
    .replace(/<ref[^>]*\/>/gi,"")
    .replace(/\{\{[^{}]*\}\}/g,"")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,"$2")
    .replace(/\[\[([^\]]+)\]\]/g,"$1")
    .replace(/'''?/g,"")
    .replace(/&nbsp;/gi," ")
    .replace(/&amp;/gi,"&")
    .replace(/\s+/g," ")
    .trim();
}

function parseEvents(wikitext){
  const source=String(wikitext || "");
  const match=source.match(/(?:^|\n)==+\s*Događaji\s*==+[\s\S]*?(?=\n==+\s*[^=]+\s*==+|$)/i);
  if(!match) return [];
  const events=[];
  for(const line of match[0].split("\n")){
    const m=line.match(/^\*+\s*(\d{1,4})\.?\s*(?:pr\.\s*Kr\.\s*)?(?:[-–—:.]|\s{2,})(.+?)\s*$/i);
    if(!m) continue;
    const text=clean(m[2]);
    if(text) events.push({year:Number(m[1]),text});
  }
  return events;
}

function parseHtmlEvents(html){
  const source=String(html || "");
  const heading=source.search(/<span[^>]+id=["']Događaji["'][^>]*>\s*Događaji\s*<\/span>/i);
  if(heading<0) return [];
  const after=source.slice(heading);
  const end=after.search(/<h[2-6][^>]*>.*?<span[^>]+class=["']mw-headline/i);
  const section=end>0 ? after.slice(0,end) : after;
  const events=[];
  for(const li of section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)){
    const text=clean(li[1].replace(/<[^>]+>/g," "));
    const m=text.match(/^(\d{1,4})\.?\s*(?:pr\.\s*Kr\.\s*)?(?:[-–—:.]|\s{2,})(.+)$/i);
    if(m) events.push({year:Number(m[1]),text:clean(m[2])});
  }
  return events;
}

async function fetchBatch(pages){
  const result={};
  for(const page of pages){
    const [day,monthName]=page.split("._");
    const month=MONTHS.indexOf(monthName)+1;
    let events=[];
    try{
      const feedUrl="https://api.wikimedia.org/feed/v1/wikipedia/hr/onthisday/events/"+month+"/"+day;
      const feed=await fetchJson(feedUrl);
      events=(feed.events||[]).map(e=>({year:Number(e.year),text:clean(e.text||e.pages?.[0]?.extract||"")})).filter(e=>Number.isFinite(e.year)&&e.text);
    }catch(_){}
    if(!events.length){
      try{
        const params=new URLSearchParams({action:"parse",page,prop:"wikitext",format:"json",formatversion:"2"});
        const json=await fetchJson(API+"?"+params.toString());
        events=parseEvents(json.parse?.wikitext||"");
        if(!events.length){
          const htmlParams=new URLSearchParams({action:"parse",page,prop:"text",format:"json",formatversion:"2"});
          const htmlJson=await fetchJson(API+"?"+htmlParams.toString());
          events=parseHtmlEvents(htmlJson.parse?.text||"");
        }
      }catch(_){}
    }
    result[page]=events;
    console.log(page+": "+events.length+" događaja");
  }
  return result;
}

(async()=>{
  const pages=[];
  for(let month=1;month<=12;month++){
    const days=new Date(Date.UTC(2028,month,0)).getUTCDate();
    for(let day=1;day<=days;day++){
      pages.push({
        title: day+"._"+MONTHS[month-1],
        key: pad(month)+"-"+pad(day)
      });
    }
  }

  const dates={};
  const BATCH=1;

  for(let i=0;i<pages.length;i+=BATCH){
    const batch=pages.slice(i,i+BATCH);
    const data=await fetchBatch(batch.map(x=>x.title));

    for(const item of batch){
      dates[item.key]={
        date:item.key,
        source:"Hrvatska Wikipedija",
        source_url:"https://hr.wikipedia.org/wiki/"+encodeURIComponent(item.title.replace(/ /g,"_")),
        events:data[item.title] || []
      };
    }

    console.log("Dohvaćeno",Math.min(i+BATCH,pages.length),"/",pages.length);
  }

  const nonEmpty=Object.values(dates).filter(d=>d.events.length>0).length;
  if(nonEmpty<100) throw new Error("Premalo dohvaćenih datuma: "+nonEmpty+". Prekid kako se ne bi objavio prazan kalendar.");

  const output={
    source:"Hrvatska Wikipedija",
    source_url:"https://hr.wikipedia.org/",
    updated_at:new Date().toISOString(),
    dates
  };

  const target=path.join(process.cwd(),"data","na-danasnji-dan.json");
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(output,null,2)+"\n","utf8");
  console.log("Zapisano:",target);
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
