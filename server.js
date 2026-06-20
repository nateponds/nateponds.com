const fs = require("node:fs/promises");
const path = require("node:path");
const express = require("express");
const { checkProject, normalizeTimeout } = require("./lib/project-status");

const app = express();
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3001);
const cacheTtlMs = normalizeTimeout(process.env.PROJECT_STATUS_CACHE_TTL_MS, 5 * 60 * 1000);
const requestTimeoutMs = normalizeTimeout(process.env.PROJECT_STATUS_TIMEOUT_MS);
const projectsFile = path.join(__dirname, "data", "projects.json");
const distDirectory = path.join(__dirname, "dist");

let statusCache = null;
let cacheTimestamp = 0;
let refreshPromise = null;

async function loadProjects() {
  const projects = JSON.parse(await fs.readFile(projectsFile, "utf8"));
  if (!Array.isArray(projects)) throw new TypeError("data/projects.json must contain an array");
  return projects;
}

async function refreshStatuses() {
  const projects = await loadProjects();
  const results = await Promise.all(projects.map((project) => checkProject(project, {
    timeoutMs: requestTimeoutMs,
    userAgent: "nateponds-portfolio-status-api/1.0",
  })));
  statusCache = Object.fromEntries(results.map((result, index) => [projects[index].number, result.status]).filter(([id]) => id));
  cacheTimestamp = Date.now();
  return statusCache;
}

app.get("/api/project-statuses", async (_request, response) => {
  if (statusCache && Date.now() - cacheTimestamp < cacheTtlMs) return response.json(statusCache);
  try {
    refreshPromise ||= refreshStatuses();
    return response.json(await refreshPromise);
  } catch (error) {
    console.error("Failed to refresh project statuses:", error);
    return statusCache ? response.json(statusCache) : response.status(500).json({ error: "Unable to load project statuses" });
  } finally {
    refreshPromise = null;
  }
});

app.get("/api/health", (_request, response) => response.json({ ok: true }));
app.use(express.static(distDirectory));
app.get("/{*path}", (request, response, next) => {
  if (request.path.startsWith("/api/")) return next();
  return response.sendFile(path.join(distDirectory, request.path === "/projects" ? "projects.html" : "index.html"));
});

app.listen(port, host, () => console.log(`Portfolio API listening at http://${host}:${port}`));
