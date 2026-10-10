export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Server-side RSS proxy: avoids browser CORS failures without using a third-party proxy.
    if (url.pathname === "/api/rss") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: { "Allow": "GET" } });
      const raw = url.searchParams.get("url");
      if (!raw || raw.length > 2048) return new Response("Nedostaje ili je preduga RSS poveznica.", { status: 400 });
      let feedUrl;
      try { feedUrl = new URL(raw); } catch { return new Response("RSS poveznica nije valjana.", { status: 400 }); }
      if (feedUrl.protocol !== "https:" || feedUrl.username || feedUrl.password) {
        return new Response("RSS izvor mora biti sigurna HTTPS poveznica.", { status: 400 });
      }
      const host = feedUrl.hostname.toLowerCase();
      const blockedHost = host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
        host === "metadata.google.internal" || host === "169.254.169.254" ||
        /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(host) ||
        host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
      if (blockedHost) return new Response("Taj RSS host nije dopušten.", { status: 400 });
      try {
        const upstream = await fetch(feedUrl.toString(), {
          headers: { "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*", "User-Agent": "PatriaSoul-RSS/1.0" },
          redirect: "follow",
          signal: AbortSignal.timeout(10000)
        });
        if (!upstream.ok) return new Response("RSS izvor vratio je HTTP " + upstream.status, { status: 502 });
        const type = upstream.headers.get("content-type") || "application/xml; charset=utf-8";
        const body = await upstream.text();
        if (body.length > 1500000) return new Response("RSS odgovor je prevelik (maks. 1,5 MB).", { status: 413 });
        if (!/<(?:rss|feed|rdf:RDF|RDF)(?:\s|>)/i.test(body)) {
          return new Response("Odgovor ne izgleda kao RSS/Atom/XML feed.", { status: 422 });
        }
        return new Response(body, { status: 200, headers: {
          "Content-Type": type.includes("xml") || type.includes("rss") || type.includes("atom") ? type : "application/xml; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff"
        }});
      } catch (error) {
        return new Response("RSS izvor nije dostupan: " + (error?.name === "TimeoutError" ? "isteklo je vrijeme čekanja." : "mrežna pogreška."), { status: 502 });
      }
    }

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

    // Izravno razriješi glavne kategorije na njihov index.html.
    // Time se ne oslanjamo na implicitno razrješavanje direktorija u statičkom asset sloju.
    if ((request.method === "GET" || request.method === "HEAD")) {
      const categoryMatch = url.pathname.match(/^\/kategorije\/(domovina|povijest|vjera|cuvari-nasljedja)\/?$/);
      if (categoryMatch) {
        const categoryIndexUrl = new URL(url);
        categoryIndexUrl.pathname = `/kategorije/${categoryMatch[1]}/index.html`;
        const categoryIndexResponse = await env.ASSETS.fetch(new Request(categoryIndexUrl, request));
        if (categoryIndexResponse.status !== 404) return categoryIndexResponse;
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
