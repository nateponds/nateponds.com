(function () {
  const projects = Array.isArray(window.portfolioProjects)
    ? window.portfolioProjects
    : [];
  const stackCatalog = Array.isArray(window.projectStacks)
    ? window.projectStacks
    : [];

  const statusClasses = {
    green: "dot-green",
    live: "dot-green",
    yellow: "dot-yellow",
    red: "dot-red",
    offline: "dot-red",
    blue: "dot-blue",
    planned: "dot-blue",
    planning: "dot-blue",
  };

  const statusLabels = {
    green: "Live",
    live: "Live",
    yellow: "Under Maintenance",
    red: "Offline",
    offline: "Offline",
    blue: "Planning",
    planned: "Planning",
    planning: "Planning",
  };

  function getValue(project, keys, fallback = "") {
    for (const key of keys) {
      if (project[key] !== undefined && project[key] !== null && project[key] !== "") {
        return project[key];
      }
    }

    return fallback;
  }

  function getStatusBadge(project) {
    const status = String(getValue(project, ["status", "state"], "yellow")).toLowerCase();
    const label = getValue(
      project,
      ["statusLabel", "statusText", "stateLabel"],
      statusLabels[status] || status,
    );
    const dotClass = statusClasses[status] || "dot-yellow";

    return `
      <span class="status-badge">
        <span class="status-dot ${dotClass}" aria-hidden="true"></span>
        ${label}
      </span>
    `;
  }

  function isProjectAvailable(project) {
    const status = String(getValue(project, ["status", "state"], "yellow")).toLowerCase();

    return status === "green" || status === "live";
  }

  function getStackClass(stackName) {
    const normalizedStackName = String(stackName).toLowerCase();
    const stack = stackCatalog.find(
      (item) => item.name.toLowerCase() === normalizedStackName,
    );

    return stack ? stack.className : "stack-default";
  }

  function getProjectStacks(project) {
    const stacks = getValue(project, ["stacks", "stackList", "technologies"], []);

    if (Array.isArray(stacks)) {
      return stacks;
    }

    return String(stacks)
      .split("/")
      .map((stack) => stack.trim())
      .filter(Boolean);
  }

  function renderStackTags(project) {
    const stacks = getProjectStacks(project);

    if (!stacks.length) return "";

    const tags = stacks
      .map((stack) => {
        const stackName = String(stack);

        return `<span class="project-stack-tag ${getStackClass(stackName)}">${stackName}</span>`;
      })
      .join("");

    return `<div class="project-stack-tags" aria-label="Technology stack">${tags}</div>`;
  }

  function createProjectCard(project, index) {
    const number = getValue(project, ["number", "tag"], String(index + 1).padStart(2, "0"));
    const name = getValue(project, ["name", "title"], "Untitled Project");
    const description = getValue(project, ["description", "desc"], "Insert description here.");
    const url = getValue(project, ["url", "href", "link"], "#");
    const image = getValue(project, ["image", "imageSrc", "thumbnail", "preview"]);
    const imageAlt = getValue(project, ["imageAlt", "alt"], `${name} project preview`);
    const isAvailable = isProjectAvailable(project);
    const projectAction = isAvailable
      ? `<a href="${url}" class="project-link" target="_blank" rel="noopener noreferrer">View Project</a>`
      : `<span class="project-link project-link-disabled" aria-disabled="true">Unavailable</span>`;
    const visual = image
      ? `<img src="${image}" alt="${imageAlt}" loading="lazy" />`
      : `<span>${name}</span>`;

    return `
      <article class="project-row">
        <div class="project-visual${image ? " has-image" : ""}">
          ${visual}
        </div>

        <div class="project-card">
          <span class="project-number">${number}</span>
          <h3>${name}</h3>
          <p>${description}</p>
          ${renderStackTags(project)}
          <div class="project-card-footer">
            ${projectAction}
            ${getStatusBadge(project)}
          </div>
        </div>
      </article>
    `;
  }

  function renderProjectCards(container, projectList) {
    if (!container) return;

    if (!projectList.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = projectList.map(createProjectCard).join("");
  }

  function renderProjectsMoreAction() {
    const moreAction = document.querySelector("#projects-more-action");

    if (!moreAction) return;

    moreAction.innerHTML =
      projects.length > 4
        ? `<a href="./projects.html" class="project-link projects-more-link">View More Projects</a>`
        : `<span class="project-link projects-more-link project-link-disabled" aria-disabled="true">More Projects Coming Soon</span>`;
  }

  function initializePortfolio() {
    const featuredGrid = document.querySelector("#featured-projects-grid");
    const allGrid = document.querySelector("#all-projects-grid");

    const featuredProjects = projects
      .filter((project) => project.featured)
      .slice(0, 4);

    renderProjectCards(featuredGrid, featuredProjects);
    renderProjectCards(allGrid, projects);
    renderProjectsMoreAction();
  }

  document.addEventListener("DOMContentLoaded", initializePortfolio);

  window.getStatusBadge = getStatusBadge;
  window.renderProjectCards = renderProjectCards;
  window.initializePortfolio = initializePortfolio;
})();
