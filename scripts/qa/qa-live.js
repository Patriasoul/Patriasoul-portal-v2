const BASE_URL = (process.env.BASE_URL || "https://patriasoul-portal-v2.patriasoul.workers.dev").replace(/\/$/, "");
const routes = [
  "/",
  "/kategorije/domovina/",
  "/kategorije/domovina/index.html",
  "/kategorije/povijest/index.html",
  "/kategorije/vjera/index.html",
  "/kategorije/cuvari-nasljedja/index.html",
  "/kategorije/domovina",
  "/kategorije/povijest/",
  "/kategorije/povijest",
  "/kategorije/vjera/",
  "/kategorije/vjera",
  "/kategorije/cuvari-nasljedja/",
  "/kategorije/cuvari-nasljedja",
  "/cuvari-nasljedja/",
  "/cuvari-nasljedja",
  "/cuvari-nasljedja/prijavi-pricu.html",
  "/o-patriasoul/",
  "/o-patriasoul",
  "/kontakt/",
  "/privatnost/",
  "/pravne-informacije/",
  "/urednicki-standard/",
  "/vrijeme/",
  "/najnovije/",
  "/stranice/o-patriasoul",
  "/stranice/o-patriasoul.html",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkRoute(route) {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}${route}`, {
        redirect: "follow",
        headers: { "user-agent": "PatriaSoul-live-QA/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      const body = await response.text();
      const contentType = response.headers.get("content-type") || "";
      const isHtml = /text\/html/i.test(contentType) || /<html[\s>]/i.test(body);
      const expectedHeadings = {
        "/kategorije/domovina/": /<h1[^>]*>\s*Domovina\s*<\/h1>/i,
        "/kategorije/vjera/": /<h1[^>]*>\s*Vjera\s*<\/h1>/i,
        "/kategorije/povijest/": /<h1[^>]*>\s*Povijest\s*<\/h1>/i,
        "/kategorije/cuvari-nasljedja/": /<h1[^>]*>\s*Čuvari nasljeđa\s*<\/h1>/i,
      };
      const expectedHeading = expectedHeadings[route];
      const headingMismatch = Boolean(expectedHeading && !expectedHeading.test(body));
      const looksLikeErrorPage = /<title[^>]*>\s*(?:404|not found|error|patriasoul\s*[—-]\s*stranica nije pronađena)[^<]*<\/title>/i.test(body) || /<h1[^>]*>\s*(?:stranica nije pronađena|page not found)\s*<\/h1>/i.test(body);
      if (response.status === 200 && isHtml && !looksLikeErrorPage && !headingMismatch && body.length > 200) {
        console.log(`OK ${response.status} ${route} (${body.length} znakova)`);
        return true;
      }
      lastError = new Error(`HTTP ${response.status}; content-type=${contentType}; HTML=${isHtml}; error-page=${looksLikeErrorPage}; expected-heading-mismatch=${headingMismatch}; duljina=${body.length}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 5) await sleep(attempt * 2000);
  }
  console.error(`FAIL ${route}: ${lastError?.message || lastError}`);
  return false;
}

async function checkAsset(path, expectedType, validate) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !expectedType.test(type) || !validate(body)) {
      console.error(`FAIL ASSET ${path}: HTTP ${response.status}; content-type=${type}; duljina=${body.length}`);
      return false;
    }
    console.log(`OK ASSET ${path} (${body.length} znakova)`);
    return true;
  } catch (error) {
    console.error(`FAIL ASSET ${path}: ${error?.message || error}`);
    return false;
  }
}

(async () => {
  console.log(`Provjera portala uživo: ${BASE_URL}`);
  const results = await Promise.all(routes.map(checkRoute));
  const failed = routes.filter((_, index) => !results[index]);
  const assetChecks = [
    checkAsset("/assets/js/category.js", /javascript|ecmascript|text\/plain/i, body => body.includes("PatriaSoulPublished") || body.includes("published-articles.js")),
    checkAsset("/assets/js/published-articles.js", /javascript|ecmascript|text\/plain/i, body => body.includes("window.PatriaSoulPublished") && body.includes("data/articles.json")),
    checkAsset("/assets/css/category-content.css", /text\/css|text\/plain/i, body => body.includes(".ps-domovina-lead")),
    checkAsset("/data/articles.json", /application\/json|text\/json/i, body => { try { const data = JSON.parse(body); return Array.isArray(data) && data.length > 0; } catch { return false; } }),
  ];
  const assetsOk = (await Promise.all(assetChecks)).every(Boolean);
  console.log(`Rezultat: ${routes.length - failed.length}/${routes.length} stranica ispravno odgovorilo.`);
  if (failed.length || !assetsOk) {
    if (failed.length) console.error("Neispravne stranice:", failed.join(", "));
    process.exit(1);
  }
  console.log("LIVE QA OK — HTML rute, naslovi, JavaScript, CSS i indeks članaka provjereni.");
})();
