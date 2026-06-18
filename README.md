# Nathaniel Ponce Portfolio

Portfolio website for Nathaniel Ryan Ponce. The site presents a personal introduction, technology stack carousel, featured projects, live project availability badges, and contact information.

The frontend is intentionally lightweight: plain HTML, CSS, and JavaScript, served as static files from an Ubuntu Apache environment. The local Node/Express status API now lives in this same repo and can be reverse-proxied by Apache at `/api/project-statuses`.

## Features

- Responsive single-page portfolio on `index.html`
- Separate projects archive page on `projects.html`
- Animated WebGL hero and contact backgrounds
- About terminal typing animation
- Auto-scrolling stack carousel powered by `js/stack-carousel.js`
- Project cards generated from `assets/projects-list.js`
- Live project status polling through `/api/project-statuses`
- Static fallback statuses when the status API is unavailable
- Optional Node script for checking project URLs and rewriting static status values
- GitHub Actions deployment workflow for a self-hosted Ubuntu Apache runner

## Project Structure

```text
.
|-- assets/
|   |-- images/
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
|-- .github/workflows/
|   `-- deploy.yml
|-- index.html
|-- server.js
|-- projects.html
|-- package.json
`-- README.md
```

## Main Files

`index.html` is the main landing page. It loads the global styles, section-specific styles, project data, and frontend scripts.

`projects.html` is the extended projects page. It uses the same project data and rendering logic.

`assets/projects-list.js` contains:

- `projectStacks`: technology names and CSS class mappings for project tags
- `portfolioProjects`: project metadata, descriptions, URLs, images, stacks, and fallback statuses

`js/projects-init.js` renders project cards from `window.portfolioProjects`. Before rendering, it attempts to fetch live statuses from `/api/project-statuses`. It also polls that endpoint every 5 minutes while the page is open.

`js/stack-carousel.js` owns the About section stack carousel. Add or reorder carousel technologies in the `stacks` array inside this file.

`server.js` is the Express API service for `GET /api/project-statuses`. It reads projects from `assets/projects-list.js`, checks each live URL, caches the result for 5 minutes, and returns status colors to the frontend.

`scripts/update-project-statuses.js` is a Node-based URL checker. It can update the hardcoded fallback `status` values in `assets/projects-list.js`.

## Project Status System

Each project can use one of these statuses:

| Status   | Meaning                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `blue`   | Planned or no live URL configured                                                                              |
| `green`  | Online and responding with a proper website                                                                    |
| `yellow` | Reachable, but appears to be an error, placeholder, maintenance page, HTTP error page, or non-website response |
| `red`    | Offline, invalid URL, timeout, DNS failure, or network failure                                                 |

The UI labels are defined in `js/projects-init.js`.

## Live Status API Contract

The frontend expects a reverse-proxied local API endpoint:

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

If the API fails, times out, or returns a non-OK response, the site keeps using the static statuses already present in `assets/projects-list.js`.

Client-side behavior:

- Fetch timeout: 3 seconds
- Initial fetch: on `DOMContentLoaded`
- Polling interval: every 5 minutes
- Overlap protection: a refresh will not start if a previous refresh is still running

The backend service for `/api/project-statuses` runs from this repo:

```bash
npm install
npm run api
```

By default it binds to `127.0.0.1:3001`. Optional environment variables:

```text
HOST=127.0.0.1
PORT=3001
PROJECT_STATUS_TIMEOUT_MS=5000
PROJECT_STATUS_CACHE_TTL_MS=300000
```

Apache or another edge server should reverse-proxy `/api/` to the local API process.

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

The script uses Node's built-in `fetch`, so use Node.js 18 or newer. Node.js 20 is recommended.

## Local Development

This is a static site. You can serve it with any local static server.

If using Five Server or VS Code Live Server, open:

```text
index.html
```

Install dependencies once:

```bash
npm install
```

If using Node tooling for the static frontend:

```bash
npx serve .
```

Then visit the local URL printed by the command.

Run the API in a second terminal:

```bash
npm run api
```

The API itself is available at:

```text
http://127.0.0.1:3001/api/project-statuses
```

Without a local reverse proxy from the frontend origin to this API, the frontend will fall back to the static statuses.

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
  icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/react.svg",
}
```

Most icons currently come from Simple Icons through jsDelivr. The carousel duplicates the stack list internally so the CSS animation can loop continuously.

The default carousel speed is controlled in `css/style.css`:

```css
.stack-track {
  animation: stackScroll 55s linear infinite;
}
```

Increase the seconds to slow it down. Decrease the seconds to speed it up.

Hover slowdown is controlled in `js/stack-carousel.js`:

```js
setCarouselSpeed(0.45);
```

## Deployment

Deployment is configured in `.github/workflows/deploy.yml`.

Current flow:

1. Runs on push to `main`
2. Uses a self-hosted Linux runner
3. Checks that the static site files exist
4. Copies the unified repo to the Apache web root with `rsync`
5. Sets read permissions
6. Purges Cloudflare cache

The configured Apache target path is:

```text
/mnt/Storage2_New/website-hosting/nateponds-portfolio
```

After deployment, run the API from the same target directory with `npm install --omit=dev` and `npm run api`, usually under `systemd`, `pm2`, or another process manager. Keep Apache serving the static files from this directory and reverse-proxy `/api/` to `http://127.0.0.1:3001/`.

Required GitHub secrets:

```text
CLOUDFLARE_ZONE_ID
CLOUDFLARE_API_TOKEN
```

## Notes

- The backend implementation for `/api/project-statuses` now lives in `server.js`.
- The frontend is safe without the API because it falls back to static statuses.
- Keep image assets in `assets/images/`.
- Keep project rendering changes in `js/projects-init.js`.
- Keep carousel-specific behavior in `js/stack-carousel.js`.
