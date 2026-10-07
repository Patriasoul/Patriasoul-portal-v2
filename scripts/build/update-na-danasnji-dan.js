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
  const source=String(wikitext||"");
  const match=source.match(/(?:^|\\n)==+\\s*Događaji\\s*==+[\\s\\S]*?(?=\\n==+\\s*[^=]+\\s*==+|$)/i);
  if(!match) return [];
  const section=match[0];
  const events=[];
  for(const line of section.split("\\n")){
    const m=line.match(/^\\*+\\s*(\\d{1,4})\\.?\\s*(?:[-–—:.]|\\s{2,})(.+?)\\s*$/);
    if(!m) continue;
    const text=clean(m[2]);
    if(text) events.push({year:Number(m[1]),text});
  }
  return events;
}

function parseHtmlEvents(html){
  const source=String(html||"");
  const heading=source.search(/<span[^>]+id=["']Događaji["'][^>]*>\\s*Događaji\\s*<\\/span>/i);
  if(heading<0) return [];
  const after=source.slice(heading);
  const end=after.search(/<h[2-6][^>]*>.*?<span[^>]+class=["']mw-headline/i);
  const section=end>0?after.slice(0,end):after;
  const events=[];
  for(const li of section.matchAll(/<li[^>]*>([\\s\\S]*?)<\\/li>/gi)){
    const text=clean(li[1].replace(/<[^>]+>/g," "));
    const m=text.match(/^(\\d{1,4})\\.?\\s*(?:[-–—:.]|\\s{2,})(.+)$/);
    if(m) events.push({year:Number(m[1]),text:clean(m[2])});
  }
  return events;
}

async function fetchBatch(pages){
  const result={};

  for(const page of pages){
    const [day, monthName] = page.split("._");
    const month = MONTHS.indexOf(monthName) + 1;
    let events=[];

    // Prvo pokušaj službeni hrvatski OnThisDay feed.
    try{
      const feedUrl="https://hr.wikipedia.org/api/rest_v1/feed/onthisday/events/"+month+"/"+day;
      const feed=await fetchJson(feedUrl);
      events=(feed.events || [])
        .map(e=>({
          year:Number(e.year),
          text:clean(e.text || e.pages?.[0]?.extract || "")
        }))
        .filter(e=>Number.isFinite(e.year) && e.text);
    }catch(_){}

    // Ako feed nije dostupan, koristi hrvatski MediaWiki API.
    if(!events.length){
      try{
        const params=new URLSearchParams({
          action:"parse",
          page,
          prop:"wikitext",
          format:"json",
          formatversion:"2"
        });
        const json=await fetchJson(API+"?"+params.toString());
        const content=json.parse?.wikitext || "";
        events=parseEvents(content);
        if(!events.length){
          const htmlParams=new URLSearchParams({
            action:"parse",
            page,
            prop:"text",
            format:"json",
            formatversion:"2"
          });
          const htmlJson=await fetchJson(API+"?"+htmlParams.toString());
          events=parseHtmlEvents(htmlJson.parse?.text || "");
        }
      }catch(_){}
    }

    result[page]=events;
    console.log(page+": "+events.length+" događaja");
  }

  return result;
}

