export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Javni sadržaj ima kratke, kanonske URL-ove u korijenu domene.
    // Stari /stranice/... URL-ovi ostaju podržani radi postojećih poveznica.
    // Kategorije zadržavaju vlastitu strukturu, npr. /kategorije/domovina/.
    const rootPageAliases = {
      "/o-patriasoul": "/stranice/o-patriasoul.html",
      "/kontakt": "/stranice/kontakt.html",
      "/kolacici": "/stranice/kolacici.html",
      "/na-danasnji-dan": "/stranice/na-danasnji-dan.html",
      "/najnovije": "/stranice/najnovije.html",
      "/newsletter": "/stranice/newsletter.html",
      "/domoljubni-forum": "/stranice/domoljubni-forum.html",
      "/pravila-foruma": "/stranice/pravila-foruma.html",
      "/pravila-koristenja-i-sigurnosti": "/stranice/pravila-koristenja-i-sigurnosti.html",
      "/pravilnik-o-igranju-kvizova": "/stranice/pravilnik-o-igranju-kvizova.html",
      "/pravne-informacije": "/stranice/pravne-informacije.html",
      "/pretraga": "/stranice/pretraga.html",
      "/privatnost": "/stranice/privatnost.html",
      "/urednicki-standard": "/stranice/urednicki-standard.html",
      "/vrijeme": "/stranice/vrijeme.html",
      "/prijava": "/stranice/prijava.html",
      "/registracija": "/stranice/registracija.html",
      "/racun": "/stranice/racun.html",
      "/poruke-obavijesti": "/stranice/poruke-obavijesti.html",
    };

    // Čuvari nasljeđa sada imaju kanonsku kategoriju pod /kategorije/.
    // Stare adrese kategorije preusmjeravamo na nju na razini Workera,
    // bez oslanjanja na meta-refresh u HTML-u.
    if (request.method === "GET" || request.method === "HEAD") {
      if (["/cuvari-nasljedja", "/cuvari-nasljedja/", "/cuvari-nasljedja/index.html"].includes(url.pathname)) {
        const canonicalCategoryUrl = new URL("/kategorije/cuvari-nasljedja/", url);
        canonicalCategoryUrl.search = url.search;
        return Response.redirect(canonicalCategoryUrl.toString(), 301);
      }
    }

    // Kanoniziraj stare javne /stranice/... adrese na kratke URL-ove.
    // Zadržavamo query string, a stari URL-ovi i dalje rade preko preusmjeravanja.
    if (request.method === "GET" || request.method === "HEAD") {
      const legacyMatch = url.pathname.match(/^\/stranice\/([^/]+?)(?:\.html)?\/?$/);
      if (legacyMatch) {
        const legacySlug = legacyMatch[1];
        if (rootPageAliases["/" + legacySlug]) {
          const canonicalUrl = new URL(url);
          canonicalUrl.pathname = "/" + legacySlug + "/";
          return Response.redirect(canonicalUrl.toString(), 302);
        }
      }

      // Podrži URL-ove s kosom crtom i bez nje. Zadržavamo query string.
      const aliasKey = url.pathname.replace(/\/+$/, "") || "/";
      const aliasedAsset = rootPageAliases[aliasKey];
      if (aliasedAsset) {
        const aliasUrl = new URL(url);
        aliasUrl.pathname = aliasedAsset;
        return env.ASSETS.fetch(new Request(aliasUrl, request));
      }

      // Podrži direktorijske URL-ove i čiste URL-ove bez nastavka.
      // Primjer: /stranice/o-patriasoul -> /stranice/o-patriasoul.html
      const lastSegment = url.pathname.split("/").filter(Boolean).at(-1) || "";
      const isDirectoryUrl = url.pathname.endsWith("/");
      const isExtensionlessPath = !isDirectoryUrl && !lastSegment.includes(".");

      if (isExtensionlessPath) {
        const htmlUrl = new URL(url);
        htmlUrl.pathname = `${url.pathname}.html`;
        const htmlResponse = await env.ASSETS.fetch(new Request(htmlUrl, request));
        if (htmlResponse.status !== 404) {
          return htmlResponse;
        }
      }

      if (isDirectoryUrl || isExtensionlessPath) {
        const indexUrl = new URL(url);
        indexUrl.pathname = isDirectoryUrl
          ? `${url.pathname}index.html`
          : `${url.pathname}/index.html`;

        const indexResponse = await env.ASSETS.fetch(new Request(indexUrl, request));
        if (indexResponse.status !== 404) {
          return indexResponse;
        }
      }
    }

    return env.ASSETS.fetch(request);
  },
};
