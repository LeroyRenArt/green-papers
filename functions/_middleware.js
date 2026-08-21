const PDF_PATH = /\.pdf$/i;
const OBVIOUS_AUTOMATION = /bot|crawler|spider|preview|headless|lighthouse|wget|curl|python|facebookexternalhit|slackbot|discordbot|whatsapp/i;

function sameSiteReferrerPath(request, url) {
  const value = request.headers.get("referer");
  if (!value) return "direct-or-unavailable";
  try {
    const referrer = new URL(value);
    return referrer.origin === url.origin ? referrer.pathname : "external";
  } catch {
    return "unavailable";
  }
}

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  if (request.method === "GET" && PDF_PATH.test(url.pathname)) {
    const userAgent = request.headers.get("user-agent") || "";
    if (!OBVIOUS_AUTOMATION.test(userAgent)) {
      try {
        const dataset = context.env && context.env.PDF_DOWNLOADS;
        if (dataset && typeof dataset.writeDataPoint === "function") {
          dataset.writeDataPoint({
            indexes: [url.pathname],
            blobs: [url.pathname, sameSiteReferrerPath(request, url)],
            doubles: [1]
          });
        }
      } catch {
        // Measurement must never prevent access to a paper.
      }
    }
  }

  return context.next();
}
