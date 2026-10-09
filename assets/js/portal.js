(() => {
  "use strict";
  const script = document.currentScript;
  // Svaka stranica portala dobiva isti vizualni shell, neovisno o tome koje je CSS datoteke prethodno imala.
  const coreCss = ["base.css","header.css","navigation.css","footer.css","responsive.css","comments.css","auth.css"];
  const cssRoot = new URL("../css/", script?.src || location.href).href;
  coreCss.forEach((file) => {
    if (!document.querySelector('link[data-ps-core-css="' + file + '"]')) {
      const el = document.createElement("link");
      el.rel = "stylesheet";
      el.href = cssRoot + file;
      el.dataset.psCoreCss = file;
      document.head.append(el);
    }
  });
  const root = new URL("../../", script?.src || location.href).href;
  const link = (p) => root + p;
  const path = location.pathname;
  const authReady = (() => {
    if (window.PatriaSoulAuth) return Promise.resolve(window.PatriaSoulAuth);
    const authSrc = new URL("auth.js?v=20261007-6", script?.src || location.href).href;
    return new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-ps-auth]");
      if (existing) { existing.addEventListener("load", () => resolve(window.PatriaSoulAuth)); existing.addEventListener("error", reject); return; }
      const el = document.createElement("script"); el.src = authSrc; el.async = true; el.dataset.psAuth = "true";
      el.onload = () => window.PatriaSoulAuth ? resolve(window.PatriaSoulAuth) : reject(new Error("PatriaSoul prijava nije učitana."));
      el.onerror = reject; document.head.append(el);
    });
  })();
  window.PatriaSoulAuthReady = authReady;
  const active = (needle) => path.includes(needle) ? " is-active" : "";
  const header = document.createElement("header");
  header.className = "ps-header";
  header.innerHTML = `
    <div class="ps-topline"><div class="ps-container ps-topline-inner">
      <span>PatriaSoul · Hrvatska · Povijest · Znanje · Identitet</span>
      <span><time data-ps-date></time> <strong data-ps-clock></strong></span>
    </div></div>
    <div class="ps-brand-row"><div class="ps-container ps-brand-inner">
      <a class="ps-brand" href="${link("index.html")}"><img class="ps-brand-logo" src="https://raw.githubusercontent.com/Patriasoul/patriasoul/main/images/file_0000000082ec81f4a6fc17bdbd959622_114540.png" alt="PatriaSoul — Krist u srcu, Hrvatska u molitvi."><span class="ps-brand-copy"><strong>PatriaSoul</strong><span>Čuvaj nasljeđe</span></span></a>
      <div class="ps-brand-actions">
        <a class="ps-search-button" href="${link("stranice/pretraga.html")}" aria-label="Pretraži" title="Pretraži"><span class="ps-search-icon" aria-hidden="true">⌕</span><span class="ps-search-label">Pretraži</span></a>
        <a class="ps-tiktok" href="https://www.tiktok.com/@patriasoul" target="_blank" rel="noopener">TikTok</a>
        <a class="ps-quiz-button" href="${link("kviz/")}">Hrvatski kviz</a>
        <a class="ps-forum-button" href="${link("stranice/domoljubni-forum.html")}" title="Otvori Domoljubni forum"><span aria-hidden="true">💬</span><span>Domoljubni forum</span></a>
      </div>
    </div></div>
    <nav class="ps-nav" aria-label="Glavna navigacija"><div class="ps-container ps-nav-inner">
      <a class="ps-nav-direct" href="${link("index.html")}">Naslovnica</a>
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
      <a class="ps-nav-direct${active("/cuvari-nasljedja")}" href="${link("cuvari-nasljedja/")}">Čuvari nasljeđa</a>
      <a class="ps-nav-direct${active("/stranice/o-patriasoul.html")}" href="${link("stranice/o-patriasoul.html")}">O PatriaSoul</a>
      <div class="ps-nav-group ps-more${active("/stranice/")}">
        <a href="${link("stranice/kontakt.html")}">Više <span>⌄</span></a>
        <div class="ps-dropdown ps-dropdown-right">
          <a href="${link("stranice/kontakt.html")}">Kontakt</a>
          <a href="${link("stranice/prijava.html")}">Prijava / Registracija</a>
          <a href="${link("stranice/racun.html")}">Moj račun</a>
        </div>
      </div>
    </div></nav>
    <div class="ps-service"><div class="ps-container ps-service-inner">
      <span class="ps-service-label">PatriaSoul</span>
      <a href="${link("kviz/")}">Hrvatski kviz</a>
      <a href="${link("stranice/najnovije.html")}">Najnovije vijesti</a>
      <a href="${link("cuvari-nasljedja/prijavi-pricu.html")}">Pošalji priču</a>
      <a href="${link("stranice/newsletter.html")}">Prati PatriaSoul</a>
      <a href="${link("stranice/vrijeme.html")}">Vrijeme</a>
        <a href="${link("stranice/na-danasnji-dan.html")}">Na današnji dan</a>
    </div></div>
  `;
  document.body.prepend(header);

  // Mobilna navigacija: prvi dodir otvara padajući izbornik, drugi vodi na glavnu kategoriju.
  const positionDropdown = (group) => {
    const navRect = header.querySelector(".ps-nav").getBoundingClientRect();
    const dropdown = group.querySelector(".ps-dropdown");
    if (!dropdown) return;
    dropdown.style.top = Math.round(navRect.bottom) + "px";
    dropdown.style.left = "10px";
    dropdown.style.right = "10px";
  };
  header.querySelectorAll(".ps-nav-group > a").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      if (window.matchMedia("(max-width: 680px)").matches) {
        const group = anchor.parentElement;
        if (!group.classList.contains("is-open")) {
          event.preventDefault();
          header.querySelectorAll(".ps-nav-group.is-open").forEach((open) => {
            if (open !== group) open.classList.remove("is-open");
          });
          group.classList.add("is-open");
          positionDropdown(group);
        }
      }
    });
  });
  window.addEventListener("resize", () => header.querySelectorAll(".ps-nav-group.is-open").forEach(positionDropdown));
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) header.querySelectorAll(".ps-nav-group.is-open").forEach((g) => g.classList.remove("is-open"));
  });

  const footer = document.createElement("footer");
  footer.className = "ps-footer";
  footer.innerHTML = `
    <div class="ps-container ps-footer-grid">
      <div class="ps-footer-brand">
        <img class="ps-footer-logo" src="https://raw.githubusercontent.com/Patriasoul/patriasoul/main/images/file_0000000082ec81f4a6fc17bdbd959622_114540.png" alt="PatriaSoul — Krist u srcu, Hrvatska u molitvi.">
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
        <a href="${link("stranice/vrijeme.html")}">Vrijeme</a>
        <a href="${link("kategorije/domovina/")}">Domovina</a>
        <a href="${link("kategorije/povijest/")}">Povijest</a>
        <a href="${link("kategorije/vjera/")}">Vjera</a>
        <a href="${link("cuvari-nasljedja/")}">Čuvari nasljeđa</a>
      </div>
    </div>
    <div class="ps-container ps-footer-social">
      <div class="ps-footer-social-card">
        <p class="ps-kicker">TikTok</p>
        <h3>PatriaSoul</h3>
        <p>Kratke priče, zanimljivosti i kvizovi kroz koje zajedno upoznajemo Hrvatsku.</p>
        <a class="ps-footer-social-button" href="https://www.tiktok.com/@patriasoul" target="_blank" rel="noopener">Prati nas</a>
      </div>
      <div class="ps-footer-social-card">
        <p class="ps-kicker">Vjera · Yeshua</p>
        <h3>Vjera · Yeshua</h3>
        <p>Vjera, nada i istina kroz priču o Yeshui — Isusu Kristu i Njegovoj riječi.</p>
        <a class="ps-footer-social-button" href="https://www.tiktok.com/@hajdi331?lang=hr" target="_blank" rel="noopener">Prati kanal</a>
      </div>
    </div>
    <div class="ps-container ps-footer-bottom"><small>© 2026 PatriaSoul — Čuvaj nasljeđe. Sva prava pridržana.</small></div>`;
  document.body.append(footer);

  // Prijavljeno stanje: odmah prikaži račun i odjavu kada je korisnik prijavljen.
  authReady.then(async (auth) => {
    const user = await auth.getUser();
    const loginLink = header.querySelector('.ps-more .ps-dropdown a[href*="prijava.html"]');
    const accountLink = header.querySelector('.ps-more .ps-dropdown a[href*="racun.html"]');
    const roleResult = await auth.getProfile().catch(() => null);
    const role = String(roleResult?.role || "player").toLowerCase();
    const canAdmin = ["editor","admin"].includes(role) || String(user?.email || "").toLowerCase() === "patriasoul@protonmail.com";
    const more = header.querySelector(".ps-more .ps-dropdown");
    const adminExisting = more?.querySelector('[data-ps-admin-link="true"]');
    if (canAdmin && more && !adminExisting) {
      const a = document.createElement("a");
      a.href = link("stranice/administracija.html");
      a.textContent = role === "editor" ? "Uredništvo" : "Administracija";
      a.dataset.psAdminLink = "true";
      more.append(a);
    }
    if (user) {
      if (loginLink) { loginLink.textContent = "Odjavi se"; loginLink.href = "#"; loginLink.dataset.psLogout = "true"; }
      if (accountLink) accountLink.textContent = "Moj račun · " + (user.user_metadata?.display_name || user.email?.split("@")[0] || "račun");
    }
    if (loginLink?.dataset.psLogout === "true") loginLink.addEventListener("click", async (e) => { e.preventDefault(); await auth.signOut(); location.reload(); });
  }).catch(() => {});

  // UX: reading time, sharing, metadata, breadcrumbs and cookie notice
  const searchStyle = document.createElement("style");
  searchStyle.textContent = ".ps-search-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:38px;padding:0 12px;border:1px solid var(--ps-blue);border-radius:7px;background:var(--ps-blue);color:#fff!important;text-decoration:none;font-size:.95rem;font-weight:700;line-height:1;transition:.2s}.ps-search-button .ps-search-icon{font-size:1.25rem;font-weight:800;line-height:1}.ps-search-button .ps-search-label{font-size:.82rem;font-weight:800;line-height:1}.ps-search-button:hover{background:var(--ps-red);color:#fff!important;border-color:var(--ps-red)}.ps-search-button:focus-visible{outline:3px solid rgba(255,255,255,.7);outline-offset:2px}";
  document.head.append(searchStyle);

  const style = document.createElement("style");
  style.textContent = ".ps-reading{color:var(--ps-muted);font-size:.82rem;margin:.35rem 0 1rem}.ps-share{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.ps-share button,.ps-share a{border:1px solid var(--ps-border);background:#fff;padding:9px 13px;border-radius:6px;cursor:pointer;font-weight:800;text-decoration:none;color:var(--ps-blue);font-size:.85rem}.ps-share button:hover,.ps-share a:hover{border-color:var(--ps-red);color:var(--ps-red)}.ps-article-tools{width:100%;max-width:820px;margin:54px auto 34px;padding:24px 0;border-top:1px solid var(--ps-border);border-bottom:1px solid var(--ps-border)}.ps-share-title{font:800 1.05rem/1.3 Georgia,serif;color:var(--ps-blue);margin-bottom:7px}.ps-comments{width:100%;max-width:820px;margin:42px auto 20px;padding:28px 0 10px;border-top:4px solid var(--ps-blue)}.ps-comments-head span{color:var(--ps-red);font-size:.7rem;font-weight:900;letter-spacing:.14em}.ps-comments-head h2{margin:7px 0 4px;color:var(--ps-blue);font:800 1.7rem/1.2 Georgia,serif}.ps-comments-head p{margin:0 0 22px;color:var(--ps-muted);font-size:.9rem}.ps-breadcrumb{font-size:.8rem;color:var(--ps-muted);margin-bottom:12px}.ps-breadcrumb a{color:var(--ps-red);text-decoration:none}.ps-cookie{position:fixed;z-index:9999;left:18px;right:18px;bottom:18px;max-width:760px;margin:auto;background:#fff;border:1px solid var(--ps-border);box-shadow:0 12px 40px rgba(0,0,0,.2);padding:18px;border-radius:10px;display:flex;gap:18px;align-items:center;justify-content:space-between}.ps-cookie p{margin:0;font-size:.9rem}.ps-cookie a{color:var(--ps-red);font-weight:800}.ps-cookie button{border:0;background:var(--ps-blue);color:#fff;padding:10px 16px;border-radius:6px;font-weight:800;cursor:pointer}@media(max-width:560px){.ps-cookie{left:10px;right:10px;bottom:10px;display:block}.ps-cookie button{margin-top:10px}}";
  document.head.append(style);
  const article=document.querySelector("article.article-page, .article-page");
  if(article){
    const commentsScript=new URL("comments.js?v=20261007-4", script?.src || location.href);
    const existing=document.querySelector('script[data-ps-comments]');
    if(!existing){
      const loader=document.createElement("script");
      loader.src=commentsScript.href;
      loader.async=false;
      loader.dataset.psComments="true";
      document.body.append(loader);
    }
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
  // Globalni plutajući AI pomoćnik: učitava se iz zajedničkog portala i na Cloudflareu,
  // čak i kada se build skripta normalize-shell.js ne pokreće.
  if (!document.getElementById("ps-ai-widget") && !document.querySelector('script[data-ps-ai-widget]')) {
    const aiWidget = document.createElement("script");
    aiWidget.src = new URL("ai-widget.js?v=20261009-2", script?.src || location.href).href;
    aiWidget.defer = true;
    aiWidget.dataset.psAiWidget = "true";
    document.body.append(aiWidget);
  }

})();