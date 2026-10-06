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

  const date = header.querySelector("[data-ps-date]");
  const clock = header.querySelector("[data-ps-clock]");
  const tick = () => {
    const now = new Date();
    date.textContent = new Intl.DateTimeFormat("hr-HR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(now);
    clock.textContent = new Intl.DateTimeFormat("hr-HR",{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(now);
  };
  tick(); setInterval(tick,1000);
})();