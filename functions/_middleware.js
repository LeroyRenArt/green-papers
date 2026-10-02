const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Content-Security-Policy": "base-uri 'self'; object-src 'none'; frame-ancestors 'self' https://spiralweb.earth",
  "Content-Security-Policy-Report-Only": "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; frame-src 'self'; form-action 'self'"
};

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

  const response = await context.next();
  const securedResponse = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    securedResponse.headers.set(name, value);
  }
  // Retain the existing short, host-only HSTS trial.
  if (url.protocol === "https:") {
    securedResponse.headers.set("Strict-Transport-Security", "max-age=300");
  }
  return securedResponse;
}
