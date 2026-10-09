export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Cloudflare Assets ne razriješi uvijek URL direktorija na index.html.
    // Pokrij i putanje sa završnom kosom crtom i čiste putanje bez ekstenzije.
    if (request.method === "GET" || request.method === "HEAD") {
      const lastSegment = url.pathname.split("/").filter(Boolean).at(-1) || "";
      const isDirectoryUrl = url.pathname.endsWith("/");
      const isExtensionlessPath = !isDirectoryUrl && !lastSegment.includes(".");

      if (isDirectoryUrl || isExtensionlessPath) {
        const indexUrl = new URL(url);
        indexUrl.pathname = isDirectoryUrl
          ? `${url.pathname}index.html`
          : `${url.pathname}/index.html`;

        const indexResponse = await env.ASSETS.fetch(
          new Request(indexUrl, request)
        );
        if (indexResponse.status !== 404) {
          return indexResponse;
        }
      }
    }

    return env.ASSETS.fetch(request);
  },
};
