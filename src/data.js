import swappr from "../assets/images/swappr.png";
import aqualine from "../assets/images/aqualine.jpg";
import linko from "../assets/images/linko.png";

export const projectStacks = [
  ["HTML", "stack-html"], ["CSS", "stack-css"], ["JS", "stack-js"], ["PHP", "stack-php"],
  ["MySQL", "stack-mysql"], ["C", "stack-c"], ["C++", "stack-cpp"], ["C#", "stack-csharp"],
  ["Node.js", "stack-node"], ["Express.js", "stack-express"], ["MongoDB", "stack-mongoDB"],
  ["PostgreSQL", "stack-postgresql"], ["Tailwind CSS", "stack-tailwind"],
].map(([name, className]) => ({ name, className }));

export const initialProjects = [
  { number: "01", name: "Nateflix", description: "A planned streaming platform built to deepen backend development experience, designed to host public-domain films and shows through a custom web application.", stacks: ["React", "CSS", "Express.js", "Node.js", "PostgreSQL"], status: "blue", url: "#", featured: true },
  { number: "02", name: "SWAPPR", description: "A prototype study-buddy matching platform developed by Freya Hermosilla and publicly served by Nathaniel Ponce, using matchmaking-style logic to help students find compatible partners.", stacks: ["HTML", "Tailwind CSS", "Node.js", "MySQL"], status: "green", url: "https://swappr.nateponds.com", featured: true, image: swappr, imageAlt: "SWAPPR" },
  { number: "03", name: "Aqualine", description: "A custom logistics and inventory database system developed by Joannah Bael and Nathaniel Ponce for Aqualine, a water refilling station, to streamline tracking and daily operations.", stacks: ["HTML", "CSS", "JS", "PHP", "MySQL"], status: "green", url: "https://aqualine.nateponds.com", featured: true, image: aqualine, imageAlt: "Aqualine" },
  { number: "04", name: "Linko", description: "A planned supplier-matching platform for MSMEs and wholesale providers, designed to improve supplier discovery, client acquisition, and supply-chain coordination for growing businesses.", stacks: ["React", "CSS", "Node.js", "Express.js", "PostgreSQL"], status: "blue", url: "#", featured: true, image: linko, imageAlt: "Linko" },
];

const base = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";
export const technologies = [
  ["Cloudflare", `${base}/cloudflare/cloudflare-original.svg`], ["Tailscale", "https://cdn.simpleicons.org/tailscale", true],
  ["Apache", `${base}/apache/apache-original.svg`], ["Nginx", `${base}/nginx/nginx-original.svg`],
  ["Docker", `${base}/docker/docker-original.svg`], ["Ubuntu", `${base}/ubuntu/ubuntu-original.svg`],
  ["Git", `${base}/git/git-original.svg`], ["GitHub", `${base}/github/github-original.svg`, true],
  ["C", `${base}/c/c-original.svg`], ["C++", `${base}/cplusplus/cplusplus-original.svg`],
  ["C#", `${base}/csharp/csharp-original.svg`], ["HTML", `${base}/html5/html5-original.svg`],
  ["CSS", `${base}/css3/css3-original.svg`], ["JavaScript", `${base}/javascript/javascript-original.svg`],
  ["Java", `${base}/java/java-original.svg`], ["React.js", `${base}/react/react-original.svg`],
  ["PHP", `${base}/php/php-original.svg`], ["Node.js", `${base}/nodejs/nodejs-original.svg`],
  ["MySQL", `${base}/mysql/mysql-original.svg`],
].map(([name, icon, inverted]) => ({ name, icon, inverted }));
