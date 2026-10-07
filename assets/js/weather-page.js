(()=>{"use strict";
const API="https://api.open-meteo.com/v1/forecast";
const cities=[
{name:"Zagreb",region:"Središnja Hrvatska",lat:45.815,lon:15.982},
{name:"Dugo Selo",region:"Zagrebačka regija",lat:45.806,lon:16.244},
{name:"Krapina",region:"Hrvatsko zagorje",lat:46.160,lon:15.878},
{name:"Varaždin",region:"Sjeverna Hrvatska",lat:46.305,lon:16.336},
{name:"Bjelovar",region:"Bilogora",lat:45.898,lon:16.842},
{name:"Sisak",region:"Banovina",lat:45.487,lon:16.375},
{name:"Karlovac",region:"Kordun",lat:45.492,lon:15.555},
{name:"Gospić",region:"Lika",lat:44.546,lon:15.375},
{name:"Rijeka",region:"Kvarner",lat:45.327,lon:14.442},
{name:"Pazin",region:"Istra",lat:45.240,lon:13.936},
{name:"Zadar",region:"Sjeverna Dalmacija",lat:44.119,lon:15.232},
{name:"Split",region:"Srednja Dalmacija",lat:43.508,lon:16.440},
{name:"Sinj",region:"Dalmatinska zagora",lat:43.703,lon:16.639},
{name:"Dubrovnik",region:"Južna Dalmacija",lat:42.650,lon:18.094},
{name:"Osijek",region:"Slavonija",lat:45.555,lon:18.695},
{name:"Vukovar",region:"Podunavlje",lat:45.351,lon:19.002}
];
const $=s=>document.querySelector(s);
const desc=c=>({0:"Vedro",1:"Pretežno vedro",2:"Djelomično oblačno",3:"Oblačno",45:"Magla",48:"Magla",51:"Rosulja",53:"Rosulja",55:"Jaka rosulja",61:"Slaba kiša",63:"Kiša",65:"Jaka kiša",71:"Slab snijeg",73:"Snijeg",75:"Jak snijeg",80:"Pljuskovi",81:"Pljuskovi",82:"Jaki pljuskovi",95:"Grmljavina",96:"Grmljavina i tuča",99:"Grmljavina i tuča"})[c]||"Promjenjivo";
const icon=c=>({0:"☀",1:"🌤",2:"⛅",3:"☁",45:"🌫",48:"🌫",51:"🌦",53:"🌦",55:"🌧",61:"🌦",63:"🌧",65:"🌧",71:"🌨",73:"🌨",75:"❄",80:"🌦",81:"🌧",82:"⛈",95:"⛈",96:"⛈",99:"⛈"})[c]||"•";
const n=v=>Number.isFinite(Number(v))?Math.round(Number(v)):"—";
let data=[],selected=0;
function url(c){return API+"?latitude="+c.lat+"&longitude="+c.lon+"&timezone=Europe%2FZagreb&forecast_days=7&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,surface_pressure,uv_index&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max";}
async function get(c){const r=await fetch(url(c),{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);return r.json();}
function render(){const region=$("#weather-region-grid"),sel=$("#weather-city-select");if(sel){sel.innerHTML=cities.map((c,i)=>"<option value=\""+i+"\">"+c.name+" — "+c.region+"</option>").join("");sel.value=String(selected);sel.onchange=()=>{selected=Number(sel.value);detail()};}
if(region)region.innerHTML=cities.map((c,i)=>{const d=data[i];if(!d)return "<article class=\"ps-weather-region-card\"><span class=\"name\">"+c.region+"</span><div class=\"temp\">—</div><div class=\"meta\">"+c.name+" · podaci nisu dostupni</div></article>";return "<button type=\"button\" class=\"ps-weather-region-card\" data-city=\""+i+"\"><span class=\"name\">"+c.region+"</span><div class=\"temp\">"+n(d.current.temperature_2m)+"°C</div><div class=\"meta\">"+c.name+" · "+icon(d.current.weather_code)+" "+desc(d.current.weather_code)+" · vjetar "+n(d.current.wind_speed_10m)+" km/h</div></button>"}).join("");
region?.querySelectorAll("[data-city]").forEach(b=>b.onclick=()=>{selected=Number(b.dataset.city);if(sel)sel.value=String(selected);detail();$("#weather-detail")?.scrollIntoView({behavior:"smooth",block:"start"})});
detail();}
function detail(){const d=data[selected],c=cities[selected],box=$("#weather-detail"),hour=$("#weather-hourly"),daily=$("#weather-daily");if(!d){if(box)box.innerHTML="<div class=\"ps-weather-error\">Podaci trenutno nisu dostupni.</div>";return;}const x=d.current||{};if(box)box.innerHTML="<div class=\"ps-weather-detail-head\"><div><div class=\"ps-weather-eyebrow\">"+c.region+"</div><h3>"+c.name+"</h3><div class=\"ps-weather-detail-temp\">"+n(x.temperature_2m)+"°C</div><div class=\"ps-weather-detail-desc\">"+icon(x.weather_code)+" "+desc(x.weather_code)+"</div></div></div><div class=\"ps-weather-stats\">"+[["Osjećaj",n(x.apparent_temperature),"°C"],["Vlaga",n(x.relative_humidity_2m),"%"],["Vjetar",n(x.wind_speed_10m)," km/h"],["Udari",n(x.wind_gusts_10m)," km/h"],["Tlak",n(x.surface_pressure)," hPa"],["UV",x.uv_index??"—",""]].map(a=>"<div class=\"ps-weather-stat\"><small>"+a[0]+"</small><strong>"+a[1]+a[2]+"</strong></div>").join("")+"</div>";
const h=d.hourly||{};if(hour)hour.innerHTML=(h.time||[]).slice(0,12).map((t,i)=>"<div class=\"ps-weather-hour\"><small>"+new Intl.DateTimeFormat("hr-HR",{hour:"2-digit",minute:"2-digit"}).format(new Date(t))+"</small><div>"+icon(h.weather_code[i])+"</div><strong>"+n(h.temperature_2m[i])+"°</strong><small>"+(h.precipitation_probability[i]??0)+"% oborina</small></div>").join("");
const q=d.daily||{};if(daily)daily.innerHTML=(q.time||[]).map((t,i)=>"<div class=\"ps-weather-day\"><small>"+new Intl.DateTimeFormat("hr-HR",{weekday:"short",day:"2-digit",month:"2-digit"}).format(new Date(t))+"</small><strong>"+icon(q.weather_code[i])+" "+desc(q.weather_code[i])+"</strong><div><b>"+n(q.temperature_2m_max[i])+"°</b> / "+n(q.temperature_2m_min[i])+"°</div><small>Oborine "+Number(q.precipitation_sum[i]||0).toFixed(1)+" mm · vjetar "+n(q.wind_speed_10m_max[i])+" km/h</small></div>").join("");}
async function load(){const status=$("#weather-live-status");if(status)status.textContent="Učitavanje vremena…";try{data=await Promise.all(cities.map(c=>get(c).catch(e=>{console.warn(c.name,e);return null})));if(!data.some(Boolean))throw new Error("Nema dostupnih podataka");render();if(status)status.textContent="Podaci dostupni";const u=$("#weather-updated");if(u)u.textContent="Ažurirano: "+new Intl.DateTimeFormat("hr-HR",{dateStyle:"short",timeStyle:"medium"}).format(new Date());}catch(e){console.error("PatriaSoul vrijeme",e);if(status)status.textContent="Podaci trenutno nisu dostupni";const box=$("#weather-region-grid");if(box)box.innerHTML="<div class=\"ps-weather-error\">Vremenski servis trenutno nije dostupan. Pokušaj ponovno.</div>";}}
document.addEventListener("DOMContentLoaded",()=>{$("#weather-refresh")?.addEventListener("click",load);load()});
})();