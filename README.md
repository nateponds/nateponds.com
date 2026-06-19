<p align="center">
  <img src="./assets/images/logo.png" alt="Nathaniel Ponce portfolio logo" width="140" />
</p>

# Nathaniel Ponce Portfolio

Portfolio website for Nathaniel Ryan Ponce. The site presents a personal introduction, technical focus areas, a stack carousel, featured projects, live project availability badges, and contact information.

The frontend is intentionally lightweight: plain HTML, CSS, and JavaScript. It can run as static files, while the optional Node/Express API in this repo provides live project status checks for `/api/project-statuses`.

## Features

- Responsive portfolio landing page on `index.html`
- Separate project archive page on `projects.html`
- Animated WebGL backgrounds for the hero and contact sections
- About terminal typing animation
- Auto-scrolling stack carousel powered by `js/stack-carousel.js`
- Project cards generated from `assets/projects-list.js`
- Live project status polling through `/api/project-statuses`
- Static fallback statuses when the status API is unavailable
- Health endpoint at `/api/health`
- Node script for checking project URLs and rewriting static fallback statuses
- GitHub Actions deployment workflow for a self-hosted Ubuntu Apache runner

## Project Structure

```text
.
|-- .github/
|   `-- workflows/
|       `-- deploy.yml
|-- assets/
|   |-- images/
|   |   |-- aqualine.jpg
|   |   |-- linko.png
|   |   |-- logo.png
|   |   `-- swappr.png
|   `-- projects-list.js
|-- css/
|   |-- contact.css
|   |-- projects-section.css
|   |-- responsive.css
|   `-- style.css
|-- js/
|   |-- projects-init.js
|   |-- script.js
|   |-- stack-carousel.js
|   `-- webgl.js
|-- scripts/
|   `-- update-project-statuses.js
|-- index.html
|-- package.json
|-- package-lock.json
|-- projects.html
|-- server.js
`-- README.md
```

## Main Files

`index.html` is the main landing page. It loads the global styles, section-specific styles, project data, and frontend scripts.

`projects.html` is the extended projects page. It uses the same project data and rendering logic as the featured project section.

`assets/projects-list.js` contains:

- `projectStacks`: technology names and CSS class mappings for project tags
- `portfolioProjects`: project metadata, descriptions, URLs, images, stacks, featured flags, and fallback statuses

`js/projects-init.js` renders project cards from `window.portfolioProjects`. Before rendering, it attempts to fetch live statuses from `/api/project-statuses`, then polls that endpoint every 5 minutes while the page is open.

`js/stack-carousel.js` owns the About section stack carousel. Add or reorder carousel technologies in the `stacks` array inside this file.

`server.js` is the Express API service. It serves `GET /api/project-statuses` and `GET /api/health`, reads projects from `assets/projects-list.js`, checks each live URL, caches status results for 5 minutes, and returns status colors to the frontend.

`scripts/update-project-statuses.js` is a Node-based URL checker. It can update the hardcoded fallback `status` values in `assets/projects-list.js`.

## Requirements

- Node.js 20 or newer
- npm
- A static file server for local frontend development, or Apache/Nginx in production
- Optional reverse proxy from `/api/` to the local Node API service

## Local Development

Install dependencies once:

```bash
npm install
```

Serve the static frontend with any local static server. For example:

```bash
npx serve .
```

Then open the local URL printed by the command and visit `index.html`.

Run the API in a second terminal:

```bash
npm run api
```

The API binds to `127.0.0.1:3001` by default:

```text
http://127.0.0.1:3001/api/project-statuses
http://127.0.0.1:3001/api/health
```

Without a local reverse proxy from the frontend origin to this API, the frontend will keep using the static statuses already present in `assets/projects-list.js`.

## Project Status System

Each project can use one of these statuses:

| Status   | Meaning                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `blue`   | Planned or no live URL configured                                                                              |
| `green`  | Online and responding with a proper website                                                                    |
| `yellow` | Reachable, but appears to be an error, placeholder, maintenance page, HTTP error page, or non-website response |
| `red`    | Offline, invalid URL, timeout, DNS failure, or network failure                                                 |

The UI labels and badge classes are defined in `js/projects-init.js`.

## Live Status API

The frontend expects this endpoint:

```text
GET /api/project-statuses
```

Expected JSON shape:

```json
{
  "01": "blue",
  "02": "green",
  "03": "yellow",
  "04": "red"
}
```

The keys should match each project's `number` field in `assets/projects-list.js`.

Client-side behavior:

- Fetch timeout: 3 seconds
- Initial fetch: on `DOMContentLoaded`
- Polling interval: every 5 minutes
- Overlap protection: a refresh will not start if a previous refresh is still running
- Fallback: if the API fails, the static project statuses remain in use

Run the backend service:

```bash
npm run api
```

Optional environment variables:

```text
HOST=127.0.0.1
PORT=3001
PROJECT_STATUS_TIMEOUT_MS=5000
PROJECT_STATUS_CACHE_TTL_MS=300000
```

In production, Apache or another edge server should reverse-proxy `/api/` to the local API process.

## Static Status Update Script

The repo includes a Node script that checks project URLs and rewrites fallback statuses in `assets/projects-list.js`.

Run it manually:

```bash
npm run update-project-statuses
```

Optional timeout override:

```bash
PROJECT_STATUS_TIMEOUT_MS=15000 npm run update-project-statuses
```

Default timeout is `10000` milliseconds.

## Editing Projects

Add or edit projects in `assets/projects-list.js`:

```js
{
  number: "05",
  name: "Project Name",
  description: "Short project description.",
  stacks: ["HTML", "CSS", "JavaScript"],
  status: "blue",
  statusLabel: "",
  url: "#",
  featured: true,
  image: "",
  imageAlt: ""
}
```

If you add a new stack name, also add it to `projectStacks` in the same file and define its color in `css/projects-section.css`.

## Editing Stack Carousel

The About section carousel is controlled by `js/stack-carousel.js`.

Add technologies to the `stacks` array:

```js
{
  name: "React.js",
  icon: `${deviconBase}/react/react-original.svg`,
}
```

Most carousel icons currently come from Devicon through jsDelivr, with a few Simple Icons URLs where needed.

The default carousel speed is controlled in `css/style.css`:

```css
.stack-track {
  animation: stackScroll 55s linear infinite;
}
```

Hover slowdown is controlled in `js/stack-carousel.js`:

```js
setCarouselSpeed(0.45);
```

## Deployment

Deployment is configured in `.github/workflows/deploy.yml`.

Production deployment flow:

1. Runs on push to `main`
2. Uses a self-hosted Linux runner
3. Sets up Node.js 20
4. Verifies the React/Vite source and backend files
5. Installs all locked dependencies and runs `npm run build`
6. Verifies that `dist/index.html` and `dist/projects.html` were generated
7. Copies the repository, including the generated `dist/`, to the server with `rsync`
8. Installs only production backend dependencies in the deployed directory
9. Sets read permissions and purges the Cloudflare cache

The workflow builds `dist/` in CI. Do not commit generated `dist/` files; the directory is intentionally ignored by Git.

The repository and backend are deployed to:

```text
/mnt/Storage2_New/website-hosting/nateponds-portfolio
```

Apache must serve the Vite build from:

```text
/mnt/Storage2_New/website-hosting/nateponds-portfolio/dist
```

In the Apache virtual host, set `DocumentRoot` to that `dist` directory and allow Apache to read it. Keep `/api/` reverse-proxied to the Express service:

```apache
DocumentRoot /mnt/Storage2_New/website-hosting/nateponds-portfolio/dist

<Directory /mnt/Storage2_New/website-hosting/nateponds-portfolio/dist>
    Require all granted
</Directory>

ProxyPass        /api/ http://127.0.0.1:3001/api/
ProxyPassReverse /api/ http://127.0.0.1:3001/api/
```

After deployment, run the API from the same target directory with:

```bash
npm run api
```

Use `systemd`, `pm2`, or another process manager to keep it running. `server.js` reads project data from `assets/projects-list.js`, provides `/api/project-statuses` and `/api/health`, and can also serve `dist/` directly if Apache is bypassed.

The current workflow has no separate staging host or directory. Pushes to `react-migration-1` do not deploy; only merging the migration into `main` triggers the production deployment. Add a distinct host/path and workflow before enabling automatic staging deployment so the migration branch cannot overwrite production.

The API listens by default at:

```text
http://127.0.0.1:3001/api/
```

Required GitHub secrets:

```text
CLOUDFLARE_ZONE_ID
CLOUDFLARE_API_TOKEN
```

## Notes

- The backend implementation for project statuses lives in `server.js`.
- The frontend is safe without the API because it falls back to static statuses.
- Keep image assets in `assets/images/`.
- Keep project data in `assets/projects-list.js`.
- Keep project rendering changes in `js/projects-init.js`.
- Keep carousel-specific behavior in `js/stack-carousel.js`.
