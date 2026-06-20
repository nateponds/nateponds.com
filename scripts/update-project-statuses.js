#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const { checkProject, normalizeTimeout } = require("../lib/project-status");

const projectsFile = path.join(__dirname, "..", "data", "projects.json");
const timeoutMs = normalizeTimeout(
  process.env.PROJECT_STATUS_TIMEOUT_MS,
  10_000,
);

async function main() {
  const source = await fs.readFile(projectsFile, "utf8");
  const projects = JSON.parse(source);
  if (!Array.isArray(projects))
    throw new TypeError("data/projects.json must contain an array");

  const results = await Promise.all(
    projects.map((project) => checkProject(project, { timeoutMs })),
  );
  const updatedProjects = projects.map((project, index) => ({
    ...project,
    status: results[index].status,
  }));
  const updatedSource = `${JSON.stringify(updatedProjects, null, 2)}\n`;
  if (updatedSource !== source) await fs.writeFile(projectsFile, updatedSource);

  for (const result of results) {
    console.log(
      `${result.status.toUpperCase().padEnd(6)} ${result.name} - ${result.reason}`,
    );
  }
  console.log(
    updatedSource === source
      ? "Project statuses were already current."
      : "Project statuses updated in data/projects.json.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
