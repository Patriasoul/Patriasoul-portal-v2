(() => {
  "use strict";
  const script = document.currentScript;
  const root = new URL("../../", script?.src || location.href).href;
  const link = (p) => root + p;
  const path = location.pathname;
  const active = (needle) => path.includes(needle) ? " is-active" : "";
  const header = document.createElement("header");
  header.className = "ps-header";
  header.innerHTML = `
    <div class="ps-topline"><div class="ps-container ps-topline-inner">
      <span>PatriaSoul · Hrvatska · Povijest · Znanje · Identitet</span>
      <span><time data-ps-date></time> <strong data-ps-clock></strong></span>
    </div></div>
    <div class="ps-brand-row"><div class="ps-container ps-brand-inner">
      <a class="ps-brand" href="${link("index.html")}"><strong>PatriaSoul</strong><span>Čuvaj nasljeđe</span></a>
      <div class="ps-brand-actions">
        <a class="ps-tiktok" href="https://www.tiktok.com/@patriasoul" target="_blank" rel="noopener">TikTok</a>
        <a class="ps-quiz-button" href="${link("kviz/")}">Hrvatski kviz</a>
      </div>
    </div></div>
    <nav class="ps-nav" aria-label="Glavna navigacija"><div class="ps-container ps-nav-inner">
      <a href="${link("index.html")}">Naslovnica</a>
      <a href="${link("stranice/najnovije.html")}">Najnovije</a>
      <div class="ps-nav-group${active("/kategorije/domovina")}">
        <a href="${link("kategorije/domovina/")}">Domovina <span>⌄</span></a>
        <div class="ps-dropdown">
          <a href="${link("kategorije/domovina/hrvatska-danas.html")}">Hrvatska danas</a>
          <a href="${link("kategorije/domovina/hrvatska-stvara.html")}">Hrvatska stvara</a>
          <a href="${link("kategorije/domovina/dijaspora.html")}">Dijaspora</a>
          <a href="${link("kategorije/domovina/branitelji-hrvatske.html")}">Branitelji Hrvatske</a>
          <a href="${link("kategorije/domovina/obitelj.html")}">Obitelj</a>
        </div>
      </div>
      <div class="ps-nav-group${active("/kategorije/povijest")}">
        <a href="${link("kategorije/povijest/")}">Povijest <span>⌄</span></a>
        <div class="ps-dropdown">
          <a href="${link("kategorije/povijest/bastina.html")}">Baština</a>
          <a href="${link("kategorije/povijest/glagoljica.html")}">Glagoljica</a>
          <a href="${link("kategorije/povijest/povijest-crkve.html")}">Povijest Crkve</a>
        </div>
      </div>
      <div class="ps-nav-group${active("/kategorije/vjera")}">
        <a href="${link("kategorije/vjera/")}">Vjera <span>⌄</span></a>
        <div class="ps-dropdown ps-dropdown-wide">
          <a href="${link("kategorije/vjera/vjera-i-zivot.html")}">Vjera i život</a>
          <a href="${link("kategorije/vjera/biblija.html")}">Biblija</a>
          <a href="${link("kategorije/vjera/svetista.html")}">Svetišta</a>
          <a href="${link("kategorije/vjera/crkvena-bastina.html")}">Crkvena baština</a>
          <a href="${link("kategorije/vjera/ljudi.html")}">Ljudi</a>
          <a href="${link("kategorije/vjera/svjedocanstva.html")}">Svjedočanstva</a>
          <a href="${link("kategorije/vjera/vjera-i-hrvatska-bastina.html")}">Vjera i hrvatska baština</a>
        </div>
      </div>
      <a class="${active("/cuvari-nasljedja")}" href="${link("cuvari-nasljedja/")}">Čuvari nasljeđa</a>
      <div class="ps-nav-group ps-more">
        <a href="${link("stranice/o-patriasoul.html")}">Više <span>⌄</span></a>
        <div class="ps-dropdown ps-dropdown-right">
          <a href="${link("stranice/o-patriasoul.html")}">O PatriaSoul</a>
          <a href="${link("stranice/kontakt.html")}">Kontakt</a>
          <a href="${link("stranice/pretraga.html")}">Pretraži</a>
          <a href="${link("stranice/prijava.html")}">Prijava / Registracija</a>
          <a href="${link("cuvari-nasljedja/prijavi-pricu.html")}">Pošalji priču</a>
        </div>
      </div>
    </div></nav>
    <div class="ps-service"><div class="ps-container ps-service-inner">
      <span class="ps-service-label">PatriaSoul</span>
      <a href="${link("kviz/")}">Hrvatski kviz</a>
      <a href="${link("stranice/najnovije.html")}">Najnovije vijesti</a>
      <a href="${link("cuvari-nasljedja/prijavi-pricu.html")}">Pošalji priču</a>
      <a href="${link("stranice/newsletter.html")}">Prati PatriaSoul</a>
    </div></div>
  `;
  document.body.prepend(header);

  const footer = document.createElement("footer");
  footer.className = "ps-footer";
  footer.innerHTML = `
    <div class="ps-container ps-footer-grid">
      <div class="ps-footer-brand">
        <strong>PatriaSoul — Čuvaj nasljeđe.</strong>
        <p>Činjenice prije senzacije. Izvor prije tvrdnje.</p>
        <p><a href="mailto:patriasoul@protonmail.com">patriasoul@protonmail.com</a></p>
      </div>
      <div class="ps-footer-col">
        <h3>Informacije</h3>
        <a href="${link("stranice/urednicki-standard.html")}">Urednički standard</a>
        <a href="${link("stranice/pravne-informacije.html")}">Pravne informacije</a>
        <a href="${link("stranice/privatnost.html")}">Privatnost</a>
        <a href="${link("stranice/pravilnik-o-igranju-kvizova.html")}">Pravilnik o igranju Hrvatskog kviza</a>
        <a href="${link("stranice/kolacici.html")}">Kolačići</a>
      </div>
      <div class="ps-footer-col">
        <h3>PatriaSoul</h3>
        <a href="${link("stranice/o-patriasoul.html")}">O PatriaSoul</a>
        <a href="${link("stranice/kontakt.html")}">Kontakt</a>
        <a href="${link("stranice/pretraga.html")}">Pretraži</a>
        <a href="${link("cuvari-nasljedja/prijavi-pricu.html")}">Pošalji priču</a>
        <a href="${link("stranice/newsletter.html")}">Prati PatriaSoul</a>
      </div>
      <div class="ps-footer-col">
        <h3>Na portalu</h3>
        <a href="${link("stranice/najnovije.html")}">Najnovije</a>
        <a href="${link("kategorije/domovina/")}">Domovina</a>
        <a href="${link("kategorije/povijest/")}">Povijest</a>
        <a href="${link("kategorije/vjera/")}">Vjera</a>
        <a href="${link("cuvari-nasljedja/")}">Čuvari nasljeđa</a>
      </div>
    </div>
    <div class="ps-container ps-footer-bottom"><small>© 2026 PatriaSoul — Čuvaj nasljeđe. Sva prava pridržana.</small></div>`;
  document.body.append(footer);

  // UX: reading time, sharing, metadata, breadcrumbs and cookie notice
  const style = document.createElement("style");
  style.textContent = ".ps-reading{color:var(--ps-muted);font-size:.82rem;margin:.35rem 0 1rem}.ps-share{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.ps-share button{border:1px solid var(--ps-border);background:#fff;padding:8px 12px;border-radius:5px;cursor:pointer;font-weight:700}.ps-breadcrumb{font-size:.8rem;color:var(--ps-muted);margin-bottom:12px}.ps-breadcrumb a{color:var(--ps-red);text-decoration:none}.ps-cookie{position:fixed;z-index:9999;left:18px;right:18px;bottom:18px;max-width:760px;margin:auto;background:#fff;border:1px solid var(--ps-border);box-shadow:0 12px 40px rgba(0,0,0,.2);padding:18px;border-radius:10px;display:flex;gap:18px;align-items:center;justify-content:space-between}.ps-cookie p{margin:0;font-size:.9rem}.ps-cookie a{color:var(--ps-red);font-weight:800}.ps-cookie button{border:0;background:var(--ps-blue);color:#fff;padding:10px 16px;border-radius:6px;font-weight:800;cursor:pointer}@media(max-width:560px){.ps-cookie{left:10px;right:10px;bottom:10px;display:block}.ps-cookie button{margin-top:10px}}";
  document.head.append(style);
  const article=document.querySelector("article.article-page, .article-page");
  if(article){const h=article.querySelector("h1")||document.querySelector("h1");if(h){const words=(article.innerText||"").trim().split(/\\s+/).length;const r=document.createElement("div");r.className="ps-reading";r.textContent="Vrijeme čitanja: oko "+Math.max(1,Math.ceil(words/220))+" min";h.after(r);const s=document.createElement("div");s.className="ps-share";s.innerHTML="<button type=\"button\" data-share>Podijeli</button><button type=\"button\" data-copy>Kopiraj poveznicu</button>";h.after(s);s.querySelector("[data-share]").onclick=async()=>{try{if(navigator.share)await navigator.share({title:document.title,url:location.href});else{await navigator.clipboard.writeText(location.href);alert("Poveznica je kopirana.")}}catch{}};s.querySelector("[data-copy]").onclick=async()=>{try{await navigator.clipboard.writeText(location.href);const b=s.querySelector("[data-copy]");b.textContent="Kopirano";setTimeout(()=>b.textContent="Kopiraj poveznicu",1500)}catch{}};const b=document.createElement("nav");b.className="ps-breadcrumb";b.setAttribute("aria-label","Putanja");b.innerHTML="<a href=\""+link("index.html")+"\">Naslovnica</a> / <a href=\""+link("stranice/najnovije.html")+"\">Najnovije</a> / "+h.textContent.trim();article.prepend(b)}}
  }
  const metaDesc=document.querySelector("meta[name=\"description\"]");const desc=metaDesc?.content||"PatriaSoul — Hrvatska, povijest, znanje i identitet.";const canonical=document.querySelector("link[rel=\"canonical\"]")||document.head.appendChild(Object.assign(document.createElement("link"),{rel:"canonical"}));canonical.href=location.href.split("#")[0];
  [["og:title",document.title],["og:description",desc],["og:url",location.href.split("#")[0]],["og:site_name","PatriaSoul"],["og:locale","hr_HR"]].forEach(([k,v])=>{let m=document.querySelector(`meta[property="${k}"]`);if(!m){m=document.createElement("meta");m.setAttribute("property",k);document.head.append(m)}m.content=v});
  if(!localStorage.getItem("ps-cookie-consent-v1")){const box=document.createElement("div");box.className="ps-cookie";box.innerHTML="<p>PatriaSoul koristi samo nužne tehničke kolačiće za rad stranice. <a href=\""+link("stranice/kolacici.html")+"\">Saznaj više</a>.</p><button type=\"button\">U redu</button>";document.body.append(box);box.querySelector("button").onclick=()=>{localStorage.setItem("ps-cookie-consent-v1","accepted");box.remove()}};

  const date = header.querySelector("[data-ps-date]");
  const clock = header.querySelector("[data-ps-clock]");
  const tick = () => {
    const now = new Date();
    date.textContent = new Intl.DateTimeFormat("hr-HR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(now);
    clock.textContent = new Intl.DateTimeFormat("hr-HR",{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(now);
  };
  tick(); setInterval(tick,1000);
})();