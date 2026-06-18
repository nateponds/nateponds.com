// STACK CAROUSEL
function initStackCarousel() {
  const stackTrack = document.querySelector("#stack-track");

  if (!stackTrack) return;

  const deviconBase =
    "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

  const stacks = [
    {
      name: "Cloudflare",
      icon: `${deviconBase}/cloudflare/cloudflare-original.svg`,
    },
    {
      name: "Tailscale",
      icon: "https://cdn.simpleicons.org/tailscale",
      iconClassName: "stack-icon-inverted",
    },
    {
      name: "Apache",
      icon: `${deviconBase}/apache/apache-original.svg`,
    },
    {
      name: "Nginx",
      icon: `${deviconBase}/nginx/nginx-original.svg`,
    },
    {
      name: "Docker",
      icon: `${deviconBase}/docker/docker-original.svg`,
    },
    {
      name: "Ubuntu",
      icon: `${deviconBase}/ubuntu/ubuntu-original.svg`,
    },
    {
      name: "Git",
      icon: `${deviconBase}/git/git-original.svg`,
    },
    {
      name: "GitHub",
      icon: `${deviconBase}/github/github-original.svg`,
      iconClassName: "stack-icon-inverted",
    },
    {
      name: "C",
      icon: `${deviconBase}/c/c-original.svg`,
    },
    {
      name: "C++",
      icon: `${deviconBase}/cplusplus/cplusplus-original.svg`,
    },
    {
      name: "C#",
      icon: `${deviconBase}/csharp/csharp-original.svg`,
    },
    {
      name: "HTML",
      icon: `${deviconBase}/html5/html5-original.svg`,
    },
    {
      name: "CSS",
      icon: `${deviconBase}/css3/css3-original.svg`,
    },
    {
      name: "JavaScript",
      icon: `${deviconBase}/javascript/javascript-original.svg`,
    },
    {
      name: "Java",
      icon: `${deviconBase}/java/java-original.svg`,
    },
    {
      name: "React.js",
      icon: `${deviconBase}/react/react-original.svg`,
    },
    {
      name: "PHP",
      icon: `${deviconBase}/php/php-original.svg`,
    },
    {
      name: "Node.js",
      icon: `${deviconBase}/nodejs/nodejs-original.svg`,
    },
    {
      name: "MySQL",
      icon: `${deviconBase}/mysql/mysql-original.svg`,
    },
  ];

  function createStackItem(stack) {
    const item = document.createElement("article");
    item.className = "stack-item";

    const icon = document.createElement("img");
    icon.src = stack.icon;
    icon.alt = `${stack.name} logo`;
    icon.loading = "lazy";

    if (stack.iconClassName) {
      icon.classList.add(stack.iconClassName);
    }

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
