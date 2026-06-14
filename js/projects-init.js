(function () {
  const projects = Array.isArray(window.portfolioProjects)
    ? window.portfolioProjects
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

  function createProjectCard(project, index) {
    const number = getValue(project, ["number", "tag"], String(index + 1).padStart(2, "0"));
    const name = getValue(project, ["name", "title"], "Untitled Project");
    const description = getValue(project, ["description", "desc"], "Insert description here.");
    const meta = getValue(project, ["meta", "metadata", "tech", "stack"], "Insert tech stack / metadata here.");
    const url = getValue(project, ["url", "href", "link"], "#");
    const image = getValue(project, ["image", "imageSrc", "thumbnail", "preview"]);
    const imageAlt = getValue(project, ["imageAlt", "alt"], `${name} project preview`);
    const visual = image
      ? `<img src="${image}" alt="${imageAlt}" loading="lazy" />`
      : `<span>${name}</span>`;

    return `
      <article class="project-row">
        <div class="project-visual">
          ${visual}
        </div>

        <div class="project-card">
          <span class="project-number">${number}</span>
          <h3>${name}</h3>
          <p>${description}</p>
          <p class="project-meta">${meta}</p>
          <div class="project-card-footer">
            <a href="${url}" class="project-link">View Project</a>
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

  function initializePortfolio() {
    const featuredGrid = document.querySelector("#featured-projects-grid");
    const allGrid = document.querySelector("#all-projects-grid");

    const featuredProjects = projects.filter((project) => project.featured);

    renderProjectCards(
      featuredGrid,
      featuredProjects.length ? featuredProjects : projects.slice(0, 4),
    );
    renderProjectCards(allGrid, projects);
  }

  document.addEventListener("DOMContentLoaded", initializePortfolio);

  window.getStatusBadge = getStatusBadge;
  window.renderProjectCards = renderProjectCards;
  window.initializePortfolio = initializePortfolio;
})();
