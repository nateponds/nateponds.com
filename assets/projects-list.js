// REMEMBER WHEN ADDING NEW STACKS PUT THEM HERE FOR
// CONFIGURABLE CSS ELSE THEY DEFAULT TO .stack-default
const projectStacks = [
  { name: "HTML", className: "stack-html" },
  { name: "CSS", className: "stack-css" },
  { name: "JS", className: "stack-js" },
  { name: "PHP", className: "stack-php" },
  { name: "MySQL", className: "stack-mysql" },
  { name: "C", className: "stack-c" },
  { name: "C++", className: "stack-cpp" },
  { name: "C#", className: "stack-csharp" },
  { name: "Node.js", className: "stack-node" },
  { name: "Express.js", className: "stack-express" },
  { name: "MongoDB", className: "stack-mongoDB" },
  { name: "PostgreSQL", className: "stack-postgresql" },
  { name: "Tailwind CSS", className: "stack-tailwind" },
];
// set to red yellow green or blue for project status on the server
const portfolioProjects = [
  {
    number: "01",
    name: "Nateflix",
    description:
      "A planned streaming platform built to deepen backend development experience, designed to host public-domain films and shows through a custom web application.",
    stacks: ["React", "CSS", "Express.js", "Node.js", "PostgreSQL"],
    status: "blue",
    statusLabel: "",
    url: "#",
    featured: true,
    image: "",
    imageAlt: "",
  },
  {
    number: "02",
    name: "SWAPPR",
    description:
      "A prototype study-buddy matching platform developed by Freya Hermosilla and publicly served by Nathaniel Ponce, using matchmaking-style logic to help students find compatible partners.",
    stacks: ["HTML", "Tailwind CSS", "Node.js", "MySQL"],
    status: "green",
    statusLabel: "",
    url: "https://swappr.nateponds.com",
    featured: true,
    image: "assets/images/swappr.png",
    imageAlt: "SWAPPR",
  },
  {
    number: "03",
    name: "Aqualine",
    description:
      "A custom logistics and inventory database system developed by Joannah Bael and Nathaniel Ponce for Aqualine, a water refilling station, to streamline tracking and daily operations.",
    stacks: ["HTML", "CSS", "JS", "PHP", "MySQL"],
    status: "green",
    statusLabel: "",
    url: "https://aqualine.nateponds.com",
    featured: true,
    image: "assets/images/aqualine.jpg",
    imageAlt: "",
  },
  {
    number: "04",
    name: "Linko",
    description:
      "A planned supplier-matching platform for MSMEs and wholesale providers, designed to improve supplier discovery, client acquisition, and supply-chain coordination for growing businesses.",
    stacks: ["React", "CSS", "Node.js", "Express.js", "PostgreSQL"],
    status: "blue",
    statusLabel: "",
    url: "#",
    featured: true,
    image: "",
    imageAlt: "",
  },
];

window.projectStacks = projectStacks;
window.portfolioProjects = portfolioProjects;

// TO DO
// - use nodejs to check the servers live status and update it here
// on the front-end
