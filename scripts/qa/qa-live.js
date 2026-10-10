const BASE_URL = (process.env.BASE_URL || "https://patriasoul-portal-v2.patriasoul.workers.dev").replace(/\/$/, "");
const routes = [
  "/",
  "/kategorije/domovina/",
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
      const looksLikeErrorPage = /<title>\s*(404|not found|error)\s*<\/title>/i.test(body);
      if (response.status === 200 && isHtml && !looksLikeErrorPage && body.length > 200) {
        console.log(`OK ${response.status} ${route} (${body.length} znakova)`);
        return true;
      }
      lastError = new Error(`HTTP ${response.status}; content-type=${contentType}; HTML=${isHtml}; duljina=${body.length}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 5) await sleep(attempt * 2000);
  }
  console.error(`FAIL ${route}: ${lastError?.message || lastError}`);
  return false;
}

(async () => {
  console.log(`Provjera portala uživo: ${BASE_URL}`);
  const results = await Promise.all(routes.map(checkRoute));
  const failed = routes.filter((_, index) => !results[index]);
  console.log(`Rezultat: ${routes.length - failed.length}/${routes.length} stranica ispravno odgovorilo.`);
  if (failed.length) {
    console.error("Neispravne stranice:", failed.join(", "));
    process.exit(1);
  }
  console.log("LIVE QA OK");
})();
