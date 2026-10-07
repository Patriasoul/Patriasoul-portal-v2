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
          action:"query",
          prop:"revisions",
          rvprop:"content",
          rvslots:"main",
          format:"json",
          formatversion:"2",
          titles:page
        });
        const json=await fetchJson(API+"?"+params.toString());
        const p=json.query?.pages?.[0];
        const content=p?.revisions?.[0]?.slots?.main?.content || p?.revisions?.[0]?.content || "";
        events=parseEvents(content);
      }catch(_){}
    }

    result[page]=events;
  }

  return result;
}

