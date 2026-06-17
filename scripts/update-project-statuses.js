#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");

const projectsFile = path.join(__dirname, "..", "assets", "projects-list.js");
const requestTimeoutMs = Number(process.env.PROJECT_STATUS_TIMEOUT_MS || 10000);

function isPlaceholderUrl(url) {
  if (url === undefined || url === null) return true;

  const value = String(url).trim();

  return value === "" || value === "#";
}

function loadProjects(source) {
  const sandbox = { window: {} };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: projectsFile });

  if (!Array.isArray(sandbox.window.portfolioProjects)) {
    throw new Error("window.portfolioProjects was not found in projects-list.js");
  }

  return sandbox.window.portfolioProjects;
}

function extractTagText(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));

  if (!match) return "";

  return match[1]
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasHtmlShell(body) {
  return /<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(body);
}

function looksLikeErrorPage(body) {
  const title = extractTagText(body, "title");
  const h1 = extractTagText(body, "h1");
  const headline = `${title} ${h1}`.toLowerCase();
  const bodySample = body.slice(0, 16000).toLowerCase();

  const headlineErrorPatterns = [
    /\b404\b/,
    /\b403\b/,
    /\b500\b/,
    /\b502\b/,
    /\b503\b/,
    /\b504\b/,
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

  if (headlineErrorPatterns.some((pattern) => pattern.test(headline))) {
    return true;
  }

  const bodyErrorPatterns = [
    /<title>\s*index of\s*\//i,
    /error\s+404/i,
    /404\s+not\s+found/i,
    /service\s+unavailable/i,
    /temporarily\s+unavailable/i,
    /this\s+site\s+is\s+under\s+maintenance/i,
    /apache2\s+ubuntu\s+default\s+page/i,
    /welcome\s+to\s+nginx/i,
  ];

  return bodyErrorPatterns.some((pattern) => pattern.test(bodySample));
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": "nateponds-portfolio-status-check/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkProject(project) {
  const name = project.name || project.title || "Untitled Project";
  const url = project.url || project.href || project.link;

  if (isPlaceholderUrl(url)) {
    return {
      name,
      url: url || "",
      status: "blue",
      reason: "No live URL configured",
    };
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(String(url));
  } catch (error) {
    return {
      name,
      url,
      status: "red",
      reason: `Invalid URL: ${error.message}`,
    };
  }

  try {
    const response = await fetchWithTimeout(parsedUrl);
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();
    const isHtml = contentType.toLowerCase().includes("text/html") || hasHtmlShell(body);

    if (!response.ok) {
      return {
        name,
        url,
        status: "yellow",
        reason: `Server returned HTTP ${response.status}`,
      };
    }

    if (!isHtml || !hasHtmlShell(body)) {
      return {
        name,
        url,
        status: "yellow",
        reason: "Response did not look like a website",
      };
    }

    if (looksLikeErrorPage(body)) {
      return {
        name,
        url,
        status: "yellow",
        reason: "Response looked like an error or placeholder page",
      };
    }

    return {
      name,
      url,
      status: "green",
      reason: "Website responded successfully",
    };
  } catch (error) {
    return {
      name,
      url,
      status: "red",
      reason: error.name === "AbortError" ? "Request timed out" : error.message,
    };
  }
}

function findMatchingClose(text, openIndex, openChar, closeChar) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && nextChar === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === "/" && nextChar === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === openChar) {
      depth += 1;
    } else if (char === closeChar) {
      depth -= 1;

      if (depth === 0) return index;
    }
  }

  return -1;
}

function findProjectObjectRanges(source) {
  const declarationIndex = source.indexOf("const portfolioProjects");
  const arrayStart = source.indexOf("[", declarationIndex);
  const arrayEnd = findMatchingClose(source, arrayStart, "[", "]");

  if (declarationIndex === -1 || arrayStart === -1 || arrayEnd === -1) {
    throw new Error("Could not locate the portfolioProjects array");
  }

  const ranges = [];
  let depth = 0;
  let objectStart = -1;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = arrayStart + 1; index < arrayEnd; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && nextChar === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === "/" && nextChar === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      if (depth === 0) objectStart = index;
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0 && objectStart !== -1) {
        ranges.push({ start: objectStart, end: index + 1 });
        objectStart = -1;
      }
    }
  }

  return ranges;
}

function updateProjectStatuses(source, results) {
  const ranges = findProjectObjectRanges(source);

  if (ranges.length < results.length) {
    throw new Error(
      `Found ${ranges.length} project objects, but loaded ${results.length} projects`,
    );
  }

  let nextSource = source;

  for (let index = results.length - 1; index >= 0; index -= 1) {
    const range = ranges[index];
    const projectSource = nextSource.slice(range.start, range.end);
    const nextStatus = results[index].status;
    const statusPattern = /(\bstatus\s*:\s*)(["'])([^"']*)(\2)/;

    if (statusPattern.test(projectSource)) {
      const updatedProjectSource = projectSource.replace(
        statusPattern,
        `$1"${nextStatus}"`,
      );

      nextSource =
        nextSource.slice(0, range.start) +
        updatedProjectSource +
        nextSource.slice(range.end);
      continue;
    }

    const insertionIndex = range.start + 1;
    const statusLine = `\n    status: "${nextStatus}",`;

    nextSource =
      nextSource.slice(0, insertionIndex) +
      statusLine +
      nextSource.slice(insertionIndex);
  }

  return nextSource;
}

async function main() {
  const source = await fs.readFile(projectsFile, "utf8");
  const projects = loadProjects(source);
  const results = await Promise.all(projects.map(checkProject));
  const updatedSource = updateProjectStatuses(source, results);

  if (updatedSource !== source) {
    await fs.writeFile(projectsFile, updatedSource);
  }

  for (const result of results) {
    console.log(
      `${result.status.toUpperCase().padEnd(6)} ${result.name} - ${result.reason}`,
    );
  }

  console.log(
    updatedSource === source
      ? "Project statuses were already current."
      : "Project statuses updated in assets/projects-list.js.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
