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
      <a class="ps-quiz-button" href="${link("kviz/")}">Hrvatski kviz</a>
    </div></div>
    <nav class="ps-nav" aria-label="Glavna navigacija"><div class="ps-container ps-nav-inner">
      <a href="${link("index.html")}">Naslovnica</a>
      <a href="${link("stranice/najnovije.html")}">Najnovije</a>
      <a class="${active("/kategorije/domovina")}" href="${link("kategorije/domovina/")}">Domovina</a>
      <a class="${active("/kategorije/povijest")}" href="${link("kategorije/povijest/")}">Povijest</a>
      <a class="${active("/kategorije/vjera")}" href="${link("kategorije/vjera/")}">Vjera</a>
      <a class="${active("/cuvari-nasljedja")}" href="${link("cuvari-nasljedja/")}">Čuvari nasljeđa</a>
      <a href="${link("stranice/kontakt.html")}">Kontakt</a>
    </div></nav>
    <div class="ps-service"><div class="ps-container ps-service-inner">
      <a href="${link("kviz/")}">Hrvatski kviz</a>
      <a href="${link("stranice/prijava.html")}">Prijava / Registracija</a>
      <a href="${link("stranice/pretraga.html")}">Pretraži</a>
      <a href="${link("stranice/newsletter.html")}">Prati PatriaSoul</a>
      <a href="${link("cuvari-nasljedja/prijavi-pricu.html")}">Pošalji priču</a>
    </div></div>
  `;
  document.body.prepend(header);

  const footer = document.createElement("footer");
  footer.className = "ps-footer";
  footer.innerHTML = `<div class="ps-container"><strong>PatriaSoul — Čuvaj nasljeđe.</strong><p>Činjenice prije senzacije. Izvor prije tvrdnje.</p><p>patriasoul@protonmail.com</p><small>© 2026 PatriaSoul — Sva prava pridržana.</small></div>`;
  document.body.append(footer);

  const date = header.querySelector("[data-ps-date]");
  const clock = header.querySelector("[data-ps-clock]");
  const tick = () => {
    const now = new Date();
    date.textContent = new Intl.DateTimeFormat("hr-HR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(now);
    clock.textContent = new Intl.DateTimeFormat("hr-HR",{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(now);
  };
  tick(); setInterval(tick,1000);
})();