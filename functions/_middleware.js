import publicFiles from "../public-files.json";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Content-Security-Policy": "base-uri 'self'; object-src 'none'; frame-ancestors 'self' https://spiralweb.earth",
  "Content-Security-Policy-Report-Only": "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; frame-src 'self'; form-action 'self'"
};

const PUBLIC_PDFS = new Set(publicFiles.filter(path => /\.pdf$/i.test(path)).map(path => "/" + path));
const OBVIOUS_AUTOMATION = /bot|crawler|spider|preview|headless|lighthouse|wget|curl|python|facebookexternalhit|slackbot|discordbot|whatsapp/i;

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  const response = await context.next();

  if (request.method === "GET" && PUBLIC_PDFS.has(url.pathname) &&
      (response.status === 200 || response.status === 206)) {
    const userAgent = request.headers.get("user-agent") || "";
    if (!OBVIOUS_AUTOMATION.test(userAgent)) {
      try {
        const dataset = context.env && context.env.PDF_DOWNLOADS;
        if (dataset && typeof dataset.writeDataPoint === "function") {
          dataset.writeDataPoint({
            indexes: [url.pathname],
            blobs: [url.pathname],
            doubles: [1]
          });
        }
      } catch {
        // Measurement must never prevent access to a paper.
      }
    }
  }

  const securedResponse = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    securedResponse.headers.set(name, value);
  }
  // Require HTTPS for six months on this host; no subdomains or preload.
  if (url.protocol === "https:") {
    securedResponse.headers.set("Strict-Transport-Security", "max-age=15552000");
  }
  return securedResponse;
}
