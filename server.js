const fs = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");

const express = require("express");

const app = express();
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3001);
const cacheTtlMs = Number(process.env.PROJECT_STATUS_CACHE_TTL_MS || 5 * 60 * 1000);
const requestTimeoutMs = Number(process.env.PROJECT_STATUS_TIMEOUT_MS || 5000);
const projectsFile = path.join(__dirname, "assets", "projects-list.js");
const distDirectory = path.join(__dirname, "dist");

let statusCache = null;
let cacheTimestamp = 0;
let refreshPromise = null;

function isPlaceholderUrl(url) {
  if (url === undefined || url === null) return true;

  const value = String(url).trim();

  return value === "" || value === "#";
}

async function loadProjects() {
  const source = await fs.readFile(projectsFile, "utf8");
  const sandbox = { window: {} };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: projectsFile });

  if (!Array.isArray(sandbox.window.portfolioProjects)) {
    throw new Error("window.portfolioProjects was not found in assets/projects-list.js");
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

function looksLikePlaceholderPage(body) {
  const title = extractTagText(body, "title");
  const h1 = extractTagText(body, "h1");
  const headline = `${title} ${h1}`.toLowerCase();
  const bodySample = body.slice(0, 16000).toLowerCase();

  const headlinePatterns = [
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

  if (headlinePatterns.some((pattern) => pattern.test(headline))) {
    return true;
  }

  const bodyPatterns = [
    /<title>\s*index of\s*\//i,
    /error\s+404/i,
    /404\s+not\s+found/i,
    /service\s+unavailable/i,
    /temporarily\s+unavailable/i,
    /this\s+site\s+is\s+under\s+maintenance/i,
    /apache2\s+ubuntu\s+default\s+page/i,
    /welcome\s+to\s+nginx/i,
  ];

  return bodyPatterns.some((pattern) => pattern.test(bodySample));
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": "nateponds-portfolio-status-api/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function assessProjectStatus(project) {
  const url = project.url || project.href || project.link;

  if (isPlaceholderUrl(url)) {
    return "blue";
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(String(url));
  } catch (error) {
    return "red";
  }

  try {
    const response = await fetchWithTimeout(parsedUrl);
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();
    const isHtml = contentType.toLowerCase().includes("text/html") || hasHtmlShell(body);

    if (!response.ok) {
      return "yellow";
    }

    if (!isHtml || !hasHtmlShell(body)) {
      return "yellow";
    }

    if (looksLikePlaceholderPage(body)) {
      return "yellow";
    }

    return "green";
  } catch (error) {
    return "red";
  }
}

async function refreshStatuses() {
  const projects = await loadProjects();
  const entries = await Promise.all(
    projects.map(async (project) => [
      project.number || project.id,
      await assessProjectStatus(project),
    ]),
  );

  statusCache = Object.fromEntries(entries.filter(([id]) => id));
  cacheTimestamp = Date.now();

  return statusCache;
}

app.get("/api/project-statuses", async (req, res) => {
  const now = Date.now();

  if (statusCache && now - cacheTimestamp < cacheTtlMs) {
    return res.json(statusCache);
  }

  try {
    refreshPromise = refreshPromise || refreshStatuses();
    const statuses = await refreshPromise;

    return res.json(statuses);
  } catch (error) {
    console.error("Failed to refresh project statuses:", error);

    if (statusCache) {
      return res.json(statusCache);
    }

    return res.status(500).json({ error: "Unable to load project statuses" });
  } finally {
    refreshPromise = null;
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use(express.static(distDirectory));

app.get("/{*path}", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  const page = req.path === "/projects" ? "projects.html" : "index.html";
  return res.sendFile(path.join(distDirectory, page));
});

app.listen(port, host, () => {
  console.log(`Portfolio Status API listening at http://${host}:${port}`);
});
