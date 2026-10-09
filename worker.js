export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Podrži direktorijske URL-ove i čiste URL-ove bez nastavka.
    // Primjer: /stranice/o-patriasoul -> /stranice/o-patriasoul.html
    if (request.method === "GET" || request.method === "HEAD") {
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
