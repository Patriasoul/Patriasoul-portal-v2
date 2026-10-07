"use strict";

const fs = require("fs");
const path = require("path");

const API = "https://hr.wikipedia.org/w/api.php";
const MONTHS = ["siječnja","veljače","ožujka","travnja","svibnja","lipnja","srpnja","kolovoza","rujna","listopada","studenoga","prosinca"];

function pad(n){ return String(n).padStart(2,"0"); }

async function fetchJson(url){
  const response = await fetch(url, {
    headers: { "User-Agent": "PatriaSoul/1.0 (na-danasnji-dan)" }
  });
  if(!response.ok) throw new Error("HTTP "+response.status);
  return response.json();
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
  const match = String(wikitext || "").match(
    /(?:^|\n)==+\s*Događaji\s*==+([\s\S]*?)(?=\n==+\s*[^=]+\s*==+|$)/i
  );
  if(!match) return [];

  const events=[];
  for(const line of match[1].split("\n")){
    const m=line.match(/^\*+\s*(\d{1,4})\.?\s*[.\-–—:]\s*(.+?)\s*$/);
    if(!m) continue;
    const text=clean(m[2]);
    if(!text) continue;
    events.push({year:Number(m[1]),text});
  }
  return events;
}

async function fetchBatch(pages){
  const params = new URLSearchParams({
    action:"query",
    prop:"revisions",
    rvprop:"content",
    rvslots:"main",
    format:"json",
    formatversion:"2",
    titles:pages.join("|")
  });
  const json=await fetchJson(API+"?"+params.toString());
  const result={};
  for(const page of (json.query?.pages || [])){
    result[page.title]=page.missing
      ? []
      : parseEvents(page.revisions?.[0]?.slots?.main?.content || "");
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
  const BATCH=40;

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
