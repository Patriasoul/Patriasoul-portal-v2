"use strict";

const fs = require("fs");
const path = require("path");

const API = "https://hr.wikipedia.org/w/api.php";
const REST = "https://hr.wikipedia.org/api/rest_v1/feed/onthisday/events";
const MONTHS = ["siječnja","veljače","ožujka","travnja","svibnja","lipnja","srpnja","kolovoza","rujna","listopada","studenoga","prosinca"];

function pad(n){ return String(n).padStart(2,"0"); }

function clean(value){
  return String(value||"")
    .replace(/<[^>]+>/g," ")
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g,"$1")
    .replace(/\[\[([^\]]+)\]\]/g,"$1")
    .replace(/\{\{[^}]+\}\}/g," ")
    .replace(/&nbsp;/g," ")
    .replace(/''+/g,"")
    .replace(/\s+/g," ")
    .trim();
}

function parseEvents(source){
  const text=String(source||"");
  const match=text.match(/(?:^|\n)={2,}\s*(?:Događaji|Događaji na današnji dan)\s*={2,}([\s\S]*?)(?=\n={2,}[^=]+={2,}|$)/i);
  if(!match) return [];
  const events=[];
  for(const raw of match[1].split("\n")){
    const line=clean(raw.replace(/^\s*[*#:]+\s*/,""));
    if(!line) continue;
    const m=line.match(/^(\d{1,4})\.?\s*(?:pr\.\s*Kr\.\s*)?(?:[-–—:.]\s*|\s{2,})(.+)$/i);
    if(!m) continue;
    const year=Number(m[1]);
    const text=clean(m[2]);
    if(Number.isFinite(year) && text) events.push({year,text});
  }
  return events.slice(0,40);
}

function parseHtmlEvents(source){
  const text=String(source||"")
    .replace(/<br\s*\/?>/gi,"\n")
    .replace(/<li[^>]*>/gi,"\n")
    .replace(/<\/li>/gi,"")
    .replace(/<[^>]+>/g," ");
  return parseEvents(text);
}

async function fetchJson(url, timeoutMs=12000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(url,{signal:controller.signal,headers:{"User-Agent":"PatriaSoul/1.2 (na-danasnji-dan; https://patriasoul.github.io/Patriasoul-portal-v2/)","Accept":"application/json"}});
    if(!response.ok) throw new Error("HTTP "+response.status);
    return await response.json();
  }finally{ clearTimeout(timer); }
}

function extractFeedEvents(feed){
  return (feed?.events||[]).map(e=>({year:Number(e.year),text:clean(e.text||e.pages?.[0]?.extract||"")})).filter(e=>Number.isFinite(e.year)&&e.text);
}

async function fetchPage(page){
  const [day,monthName]=page.split("._");
  const month=MONTHS.indexOf(monthName)+1;
  const feedUrl=REST+"/"+pad(month)+"/"+pad(day);
  try{
    return extractFeedEvents(await fetchJson(feedUrl));
  }catch(_){
    try{
      const params=new URLSearchParams({action:"parse",page,prop:"wikitext",format:"json",formatversion:"2"});
      const json=await fetchJson(API+"?"+params.toString());
      const events=parseEvents(json.parse?.wikitext||"");
      if(events.length) return events;
      const htmlParams=new URLSearchParams({action:"parse",page,prop:"text",format:"json",formatversion:"2"});
      const htmlJson=await fetchJson(API+"?"+htmlParams.toString());
      return parseHtmlEvents(htmlJson.parse?.text||"");
    }catch(_){ return []; }
  }
}

async function fetchConcurrent(pages, limit=8){
  const result={};
  let next=0;
  async function worker(){
    while(true){
      const index=next++;
      if(index>=pages.length) return;
      const page=pages[index];
      result[page]=await fetchPage(page);
      console.log(page+": "+result[page].length+" događaja ("+(index+1)+"/"+pages.length+")");
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,pages.length)},worker));
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

  const titles=pages.map(x=>x.title);
  const data=await fetchConcurrent(titles,8);
  const dates={};

  for(const item of pages){
    dates[item.key]={
      date:item.key,
      source:"Hrvatska Wikipedija",
      source_url:"https://hr.wikipedia.org/wiki/"+encodeURIComponent(item.title.replace(/ /g,"_")),
      events:data[item.title] || []
    };
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
