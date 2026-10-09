export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Cloudflare Assets ponekad ne razriješi direktorijske URL-ove na index.html.
    // Za putanje sa završnom kosom crtom prvo izričito pokušaj index.html.
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname.endsWith("/")
    ) {
      const indexUrl = new URL(url);
      indexUrl.pathname = `${url.pathname}index.html`;
      const indexResponse = await env.ASSETS.fetch(
        new Request(indexUrl, request)
      );
      if (indexResponse.status !== 404) {
        return indexResponse;
      }
    }

    return env.ASSETS.fetch(request);
  },
};
