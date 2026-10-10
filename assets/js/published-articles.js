(()=> {
  "use strict";
  const SUPABASE_URL = "https://ijimozjfdffejbczwyzb.supabase.co";
  const SUPABASE_KEY = "sb_publishable_SvuPtQUmXamt1a1_JpU6Jg_Bf3Fshqr";
  const categoryLabels = {
    domovina: "Domovina",
    povijest: "Povijest",
    vjera: "Vjera",
    "cuvari-nasljedja": "Čuvari nasljeđa"
  };
  let clientPromise;

  async function client() {
    if (clientPromise) return clientPromise;
    clientPromise = new Promise((resolve, reject) => {
      const create = () => {
        try {
          resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false }
          }));
        } catch (error) { reject(error); }
      };
      if (window.supabase?.createClient) { create(); return; }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.onload = create;
      script.onerror = () => reject(new Error("Supabase biblioteka nije dostupna."));
      document.head.append(script);
    });
    return clientPromise;
  }

  const esc = value => String(value ?? "").replace(/[&<>"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  }[char]));

  const slug = value => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const parseDate = value => {
    if (!value) return 0;
    const direct = Date.parse(value);
    if (Number.isFinite(direct)) return direct;
    const match = String(value).toLowerCase().match(/(\d{1,2})\.?\s*([a-zčćđšž]+)\s*(\d{4})/i);
    if (!match) return 0;
    const months = {
      "siječnja": 0, "sijecnja": 0, "veljače": 1, "veljace": 1,
      "ožujka": 2, "ozujka": 2, "travnja": 3, "svibnja": 4,
      "lipnja": 5, "srpnja": 6, "kolovoza": 7, "rujna": 8,
      "listopada": 9, "studenoga": 10, "studenog": 10, "prosinca": 11
    };
    if (months[match[2]] === undefined) return 0;
    return Date.UTC(Number(match[3]), months[match[2]], Number(match[1]));
  };

  const formatDate = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value || "")
      : new Intl.DateTimeFormat("hr-HR", {
          day: "2-digit", month: "long", year: "numeric"
        }).format(date);
  };

  function normalizeStaticArticle(article) {
    const url = String(article.url || article.path || "").replace(/^\.\//, "");
    const pathCategory = url.match(/^clanci\/([^/]+)\//)?.[1] || "";
    const category = slug(article.category || pathCategory);
    return {
      ...article,
      url,
      category,
      categoryLabel: article.categoryLabel || categoryLabels[category] || article.category || category,
      subcategory: slug(article.subcategory || ""),
      subcategoryLabel: article.subcategoryLabel || article.subcategory || "",
      dynamic: false
    };
  }

  async function all(root) {
    // GitHub indeks je osnovni izvor: kategorije moraju raditi i ako je Supabase
    // privremeno nedostupan ili se njegov zahtjev ne uspije izvršiti.
    const staticArticles = await fetch(root + "data/articles.json", { cache: "no-store" })
      .then(response => response.ok ? response.json() : [])
      .catch(() => [])
      .then(items => Array.isArray(items) ? items.map(normalizeStaticArticle) : []);

    // Kategorije i popisi koriste lokalni indeks koji se objavljuje zajedno
    // s portalom. Ne čekamo CDN ni Supabase: vanjska usluga ne smije učiniti
    // postojeće HTML stranice praznima ili neaktivnima.
    return staticArticles.sort((a, b) =>
      parseDate(b.dateISO || b.date) - parseDate(a.dateISO || a.date) ||
      String(a.title).localeCompare(String(b.title), "hr")
    );
  }

  window.PatriaSoulPublished = { all, esc, slug, date: formatDate };
})();