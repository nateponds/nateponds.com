import swappr from "../assets/images/swappr.png";
import aqualine from "../assets/images/aqualine.jpg";
import linko from "../assets/images/linko.png";
import projects from "../data/projects.json";

const projectImages = { swappr, aqualine, linko };

export const projectStacks = [
  ["HTML", "stack-html"], ["CSS", "stack-css"], ["JS", "stack-js"], ["PHP", "stack-php"],
  ["MySQL", "stack-mysql"], ["C", "stack-c"], ["C++", "stack-cpp"], ["C#", "stack-csharp"],
  ["Node.js", "stack-node"], ["Express.js", "stack-express"], ["MongoDB", "stack-mongoDB"],
  ["PostgreSQL", "stack-postgresql"], ["Tailwind CSS", "stack-tailwind"],
  ["React", "stack-react"],
].map(([name, className]) => ({ name, className }));

export const initialProjects = projects.map((project) => ({
  ...project,
  image: project.image ? projectImages[project.image] : undefined,
}));

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
