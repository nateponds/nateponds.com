const DEFAULT_TIMEOUT_MS = 5_000;

function normalizeTimeout(value, fallback = DEFAULT_TIMEOUT_MS) {
  const timeout = Number(value);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : fallback;
}

function isPlaceholderUrl(url) {
  return url == null || ["", "#"].includes(String(url).trim());
}

function extractTagText(html, tagName) {
  const match = html.match(
    new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );
  return match
    ? match[1]
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

function hasHtmlShell(body) {
  return /<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(body);
}

function looksLikePlaceholderPage(body) {
  const headline =
    `${extractTagText(body, "title")} ${extractTagText(body, "h1")}`.toLowerCase();
  const headlinePatterns = [
    /\b(?:403|404|500|502|503|504)\b/,
    /\bnot found\b/,
    /\bforbidden\b/,
    /\bserver error\b/,
    /\bservice unavailable\b/,
    /\bunder maintenance\b/,
    /\bmaintenance mode\b/,
    /\bcoming soon\b/,
    /\bdomain parked\b/,
    /\bindex of\s*\//,
  ];
  if (headlinePatterns.some((pattern) => pattern.test(headline))) return true;

  const sample = body.slice(0, 16_000);
  return [
    /<title>\s*index of\s*\//i,
    /error\s+404/i,
    /404\s+not\s+found/i,
    /service\s+unavailable/i,
    /temporarily\s+unavailable/i,
    /this\s+site\s+is\s+under\s+maintenance/i,
    /apache2\s+ubuntu\s+default\s+page/i,
    /welcome\s+to\s+nginx/i,
  ].some((pattern) => pattern.test(sample));
}

async function fetchWithTimeout(
  url,
  { fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS, userAgent } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    normalizeTimeout(timeoutMs),
  );
  try {
    return await fetchImpl(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": userAgent || "nateponds-portfolio-status-check/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkProject(project, options = {}) {
  const name = project.name || project.title || "Untitled Project";
  const url = project.url || project.href || project.link;
  const result = (status, reason) => ({ name, url: url || "", status, reason });

  if (isPlaceholderUrl(url)) return result("blue", "No live URL configured");

  let parsedUrl;
  try {
    parsedUrl = new URL(String(url));
    if (!["http:", "https:"].includes(parsedUrl.protocol))
      return result("red", "URL must use HTTP or HTTPS");
  } catch (error) {
    return result("red", `Invalid URL: ${error.message}`);
  }

  try {
    const response = await fetchWithTimeout(parsedUrl, options);
    const body = await response.text();
    const contentType = response.headers.get("content-type") || "";
    const isHtml =
      contentType.toLowerCase().includes("text/html") || hasHtmlShell(body);
    if (!response.ok)
      return result("yellow", `Server returned HTTP ${response.status}`);
    if (!isHtml || !hasHtmlShell(body))
      return result("yellow", "Response did not look like a website");
    if (looksLikePlaceholderPage(body))
      return result(
        "yellow",
        "Response looked like an error or placeholder page",
      );
    return result("green", "Website responded successfully");
  } catch (error) {
    return result(
      "red",
      error.name === "AbortError" ? "Request timed out" : error.message,
    );
  }
}

module.exports = {
  checkProject,
  hasHtmlShell,
  isPlaceholderUrl,
  looksLikePlaceholderPage,
  normalizeTimeout,
};
