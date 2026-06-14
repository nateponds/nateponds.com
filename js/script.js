// PAGE LOADING SCREEN
window.addEventListener("load", () => {
  const loader = document.getElementById("page-loader");

  if (!loader) {
    document.body.classList.add("page-ready");
    return;
  }

  setTimeout(() => {
    loader.classList.add("loader-hidden");

    setTimeout(() => {
      document.body.classList.remove("is-loading");
      document.body.classList.add("page-ready");
      loader.remove();
    }, 650);
  }, 800);
});

// NAV GLASS EFFECT AFTER SCROLLING FROM HERO
const nav = document.querySelector("nav");
const hero = document.querySelector("#hero");
const contact = document.querySelector("#contact");

if (nav && hero && "IntersectionObserver" in window) {
  let heroActive = true;
  let contactActive = false;
  let navScrollTicking = false;

  function updateNavGlass() {
    nav.classList.toggle("is-scrolled", !heroActive && !contactActive);
  }

  function updateContactNavState() {
    if (!contact) return;

    const navRect = nav.getBoundingClientRect();
    const contactRect = contact.getBoundingClientRect();

    contactActive =
      contactRect.top <= navRect.bottom + 12 &&
      contactRect.bottom >= navRect.top;

    updateNavGlass();
  }

  function requestContactNavStateUpdate() {
    if (navScrollTicking) return;

    navScrollTicking = true;

    requestAnimationFrame(() => {
      navScrollTicking = false;
      updateContactNavState();
    });
  }

  const heroObserver = new IntersectionObserver(
    ([entry]) => {
      heroActive = entry.isIntersecting;
      updateNavGlass();
    },
    {
      threshold: 0,
      rootMargin: "-150px 0px 0px 0px",
    },
  );

  heroObserver.observe(hero);

  if (contact) {
    window.addEventListener("scroll", requestContactNavStateUpdate, {
      passive: true,
    });
    window.addEventListener("resize", requestContactNavStateUpdate);
    updateContactNavState();
  }
}

// ABOUT TERMINAL TYPING EFFECT
function initAboutTerminal() {
  const terminal = document.querySelector("#about-terminal-output");
  const aboutSection = document.querySelector("#about");

  if (!terminal || !aboutSection) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const terminalScript = [
    {
      command: "whoami",
      output: "nathaniel / cs-student / sysadmin",
    },
    {
      command: "current_focus",
      output: "learning by building real systems, not just studying about them",
    },
    {
      command: "driven_motivation",
      output:
        "I am always eager to learn new technologies and adapt to changes",
    },
  ];

  let hasPlayed = false;

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function typeText(element, text, speed = 24) {
    element.classList.add("terminal-caret");

    for (const character of text) {
      element.append(character);
      await wait(speed);
    }

    element.classList.remove("terminal-caret");
  }

  function createCommandLine() {
    const line = document.createElement("p");
    line.className = "terminal-line";

    const prompt = document.createElement("span");
    prompt.textContent = "$";

    line.append(prompt, " ");
    terminal.appendChild(line);

    return line;
  }

  function createOutputLine() {
    const output = document.createElement("p");
    output.className = "terminal-output";

    terminal.appendChild(output);

    return output;
  }

  async function renderTags(tags) {
    const tagContainer = document.createElement("div");
    tagContainer.className = "terminal-tags";

    terminal.appendChild(tagContainer);

    for (const tag of tags) {
      const tagElement = document.createElement("span");
      tagContainer.appendChild(tagElement);

      tagElement.classList.add("is-visible");
      await typeText(tagElement, tag, 30);
      await wait(90);
    }
  }

  async function playTerminal() {
    if (hasPlayed) return;

    hasPlayed = true;
    terminal.innerHTML = "";

    if (prefersReducedMotion) {
      terminalScript.forEach((entry) => {
        const commandLine = createCommandLine();
        commandLine.append(entry.command);

        if (entry.output) {
          const outputLine = createOutputLine();
          outputLine.textContent = entry.output;
        }

        if (entry.tags) {
          const tagContainer = document.createElement("div");
          tagContainer.className = "terminal-tags";

          entry.tags.forEach((tag) => {
            const tagElement = document.createElement("span");
            tagElement.textContent = tag;
            tagElement.classList.add("is-visible");
            tagContainer.appendChild(tagElement);
          });

          terminal.appendChild(tagContainer);
        }
      });

      return;
    }

    await wait(250);

    for (const entry of terminalScript) {
      const commandLine = createCommandLine();
      await typeText(commandLine, entry.command, 55);
      await wait(280);

      if (entry.output) {
        const outputLine = createOutputLine();
        await typeText(outputLine, entry.output, 34);
        await wait(420);
      }

      if (entry.tags) {
        await renderTags(entry.tags);
        await wait(420);
      }
    }
  }

  if ("IntersectionObserver" in window) {
    const terminalObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          playTerminal();
          terminalObserver.disconnect();
        }
      },
      {
        threshold: 0.35,
      },
    );

    terminalObserver.observe(aboutSection);
  } else {
    playTerminal();
  }
}

initAboutTerminal();

// MOBILE NAV TOGGLE
const navToggle = document.querySelector("#nav-toggle");
const primaryNav = document.querySelector("nav");
const navLinks = document.querySelectorAll(".nav-button");

if (navToggle && primaryNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = primaryNav.classList.toggle("menu-open");

    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      primaryNav.classList.remove("menu-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation menu");
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      primaryNav.classList.remove("menu-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation menu");
    }
  });
}

// STACK CAROUSEL
function initStackCarousel() {
  const stackTrack = document.querySelector("#stack-track");

  if (!stackTrack) return;

  const stacks = [
    {
      name: "Server PC",
      icon: "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/server.svg",
    },
    {
      name: "Cloudflare",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/cloudflare.svg",
    },
    {
      name: "Tailscale",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/tailscale.svg",
    },
    {
      name: "Apache",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/apache.svg",
    },
    {
      name: "Nginx",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/nginx.svg",
    },
    {
      name: "Docker",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/docker.svg",
    },
    {
      name: "Ubuntu",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/ubuntu.svg",
    },
    {
      name: "Git",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/git.svg",
    },
    {
      name: "GitHub",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg",
    },
    {
      name: "C",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/c.svg",
    },
    {
      name: "C++",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/cplusplus.svg",
    },
    {
      name: "C#",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/csharp.svg",
    },
    {
      name: "HTML",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/html5.svg",
    },
    {
      name: "CSS",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/css.svg",
    },
    {
      name: "JavaScript",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/javascript.svg",
    },
    {
      name: "PHP",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/php.svg",
    },
    {
      name: "Node.js",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/nodedotjs.svg",
    },
    {
      name: "MySQL",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mysql.svg",
    },
  ];

  function createStackItem(stack) {
    const item = document.createElement("article");
    item.className = "stack-item";

    const icon = document.createElement("img");
    icon.src = stack.icon;
    icon.alt = `${stack.name} logo`;
    icon.loading = "lazy";

    const label = document.createElement("span");
    label.textContent = stack.name;

    item.append(icon, label);

    return item;
  }

  const repeatedStacks = [...stacks, ...stacks];

  stackTrack.innerHTML = "";

  repeatedStacks.forEach((stack) => {
    stackTrack.appendChild(createStackItem(stack));
  });
}

initStackCarousel();

// PROJECTS SCROLL REVEAL
function initProjectsReveal() {
  const projectsSection = document.querySelector("#projects");

  if (!projectsSection) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const watchedItems = new WeakSet();
  let projectsItemObserver = null;

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    projectsItemObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("projects-reveal-visible");
          projectsItemObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.24,
        rootMargin: "0px 0px -10% 0px",
      },
    );
  }

  function prepareRevealItems() {
    const revealItems = projectsSection.querySelectorAll(
      ".projects-heading, .project-row, .projects-actions",
    );

    revealItems.forEach((item, index) => {
      item.classList.add("projects-reveal-item");

      if (prefersReducedMotion || !projectsItemObserver) {
        item.classList.add("projects-reveal-visible");
        return;
      }

      if (watchedItems.has(item)) return;

      watchedItems.add(item);
      item.style.setProperty(
        "--projects-reveal-delay",
        `${Math.min(index, 2) * 80}ms`,
      );
      projectsItemObserver.observe(item);
    });
  }

  prepareRevealItems();

  const projectsContentObserver = new MutationObserver(prepareRevealItems);
  projectsContentObserver.observe(projectsSection, {
    childList: true,
    subtree: true,
  });
}

initProjectsReveal();
