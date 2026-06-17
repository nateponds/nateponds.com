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
      name: "React.js",
      icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/react.svg",
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

  const stackCarousel = stackTrack.closest(".stack-carousel");
  const getTrackAnimation = () => stackTrack.getAnimations()[0];

  function setCarouselSpeed(playbackRate) {
    const animation = getTrackAnimation();

    if (!animation || typeof animation.updatePlaybackRate !== "function") {
      return;
    }

    animation.updatePlaybackRate(playbackRate);
  }

  if (stackCarousel) {
    stackCarousel.addEventListener("pointerover", (event) => {
      if (event.target.closest(".stack-item")) {
        setCarouselSpeed(0.45);
      }
    });

    stackCarousel.addEventListener("pointerout", (event) => {
      const hoveredItem = event.target.closest(".stack-item");
      const nextHoveredItem = event.relatedTarget
        ? event.relatedTarget.closest(".stack-item")
        : null;

      if (hoveredItem && !nextHoveredItem) {
        setCarouselSpeed(1);
      }
    });
  }
}

initStackCarousel();
