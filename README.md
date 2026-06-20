<p align="center">
  <img src="./assets/images/logo.png" alt="Nathaniel Ponce portfolio logo" width="140" />
</p>

<p align="center">
  <a href="https://nateponds.com">Live Site</a> &bull;
  <a href="https://nateponds.com/projects.html">Projects</a> &bull;
  <a href="https://github.com/nateponds">GitHub</a> &bull;
  <a href="mailto:nathanielryanponce@gmail.com">Email</a>
</p>

<p align="center">
  <a href="https://github.com/nateponds/nateponds.com/actions/workflows/deploy.yml"><img src="https://github.com/nateponds/nateponds.com/actions/workflows/deploy.yml/badge.svg" alt="Deployment status" /></a>
  <a href="https://nateponds.com"><img src="https://img.shields.io/website?url=https%3A%2F%2Fnateponds.com&amp;label=nateponds.com" alt="Website status" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&amp;logoColor=white" alt="Node.js 20 or newer" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&amp;logoColor=black" alt="React 19" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&amp;logoColor=white" alt="Vite 8" /></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-5-000000?logo=express&amp;logoColor=white" alt="Express 5" /></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS"><img src="https://img.shields.io/badge/CSS-3-1572B6?logo=css&amp;logoColor=white" alt="CSS 3" /></a>
</p>

# Nathaniel Ponce Portfolio

Source and production runbook for [nateponds.com](https://nateponds.com). The site is a React 19/Vite portfolio with two HTML entry points, a small Express API for live project-status badges, and an automated deployment to Apache on a self-hosted Ubuntu runner.

## How the production site works

```text
Browser
  |
  v
Cloudflare (DNS, TLS, cache)
  |
  v
Apache :80/:443
  |-- / and /projects --> dist/ (React/Vite build)
  `-- /api/* ----------> Express 127.0.0.1:3001
                              |
                              `--> checks URLs in data/projects.json
```

Apache is the public web server. Express is bound to loopback and should not be exposed directly. Both the frontend and backend read `data/projects.json`, so project details and fallback statuses have one source of truth. The browser requests `/api/project-statuses` on load and every five minutes; if the API is unavailable, the statuses compiled into the frontend remain visible.

## Repository layout

```text
.
|-- .github/workflows/deploy.yml  # test, build, deploy, restart, cache purge
|-- assets/images/                # project and brand images
|-- css/                          # global and section styles
|-- data/projects.json            # shared project catalog and fallback statuses
|-- js/webgl.js                   # canvas background animation
|-- lib/project-status.js         # shared URL health-check logic
|-- scripts/update-project-statuses.js
|-- src/App.jsx                   # React UI
|-- src/data.js                   # UI metadata and image resolution
|-- src/main.jsx                  # React entry point and CSS imports
|-- test/                         # Node unit tests
|-- index.html                    # landing-page Vite entry
|-- projects.html                 # project-archive Vite entry
|-- server.js                     # Express API and optional static server
`-- vite.config.js                # multi-page build and development proxy
```

Generated or historical material is intentionally outside the application path: `node_modules/`, `dist/`, `docs/`, and `import/` should not be used as source. Vite regenerates `dist/`.

## Requirements

- Node.js 20 or newer and npm 10+
- For production: Ubuntu, Apache 2.4, systemd, rsync, curl, Git, and a self-hosted GitHub Actions runner
- A domain managed in Cloudflare (the workflow's cache purge assumes Cloudflare)

## Local development

Install the locked dependency set:

```bash
npm ci
```

Run the frontend and API in separate terminals:

```bash
npm run dev
npm run api
```

Vite prints the frontend URL, normally `http://localhost:5173`. Its `/api` proxy targets `http://127.0.0.1:3001`, so status requests work without local CORS configuration.

Useful commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite with hot reload |
| `npm run api` | Start Express on `127.0.0.1:3001` |
| `npm test` | Run backend health-check unit tests |
| `npm run build` | Create the production frontend in `dist/` |
| `npm run check` | Run tests, then a production build |
| `npm run preview` | Preview the Vite build locally |
| `npm run update-project-statuses` | Check live project URLs and rewrite fallback statuses |

Run `npm run check` before pushing. On Windows PowerShell systems that block `npm.ps1`, use `npm.cmd run check`.

## Editing the site

### Projects

Edit `data/projects.json`. Each entry supports:

```json
{
  "number": "05",
  "name": "Project name",
  "description": "Short project description.",
  "stacks": ["React", "Node.js"],
  "status": "blue",
  "url": "#",
  "featured": true,
  "image": "optionalImageKey",
  "imageAlt": "Accessible image description"
}
```

Image keys must be imported and mapped in `src/data.js`; put image files in `assets/images/`. Technology badge mappings live in `projectStacks` in `src/data.js`, with their colors in `css/projects-section.css`.

Statuses are:

| Value | Meaning |
| --- | --- |
| `blue` | Planned; no live URL |
| `green` | HTTP(S) URL returned a valid website |
| `yellow` | Reachable but returned an HTTP error, placeholder, maintenance page, or non-website response |
| `red` | Invalid URL, timeout, DNS error, or connection failure |

The updater performs network requests and changes `data/projects.json`; review its diff before committing.

### Content, styling, and animation

- Page sections and contact details: `src/App.jsx`
- Technology carousel: `technologies` in `src/data.js`
- Global/about/hero styles: `css/style.css`
- Projects: `css/projects-section.css`
- Contact: `css/contact.css`
- Responsive rules: `css/responsive.css`
- WebGL backgrounds: `js/webgl.js`

Both pages mount the same React application. `data-page="projects"` on `projects.html` selects archive mode; do not create a second React entry for it unless the pages genuinely diverge.

## API contract and configuration

`GET /api/health` returns:

```json
{ "ok": true }
```

`GET /api/project-statuses` returns project numbers mapped to status colors:

```json
{ "01": "blue", "02": "green" }
```

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Express bind address; keep loopback in production |
| `PORT` | `3001` | Express port |
| `PROJECT_STATUS_TIMEOUT_MS` | `5000` | Timeout per project check |
| `PROJECT_STATUS_CACHE_TTL_MS` | `300000` | API result cache lifetime |

## First production setup for nateponds.com

These steps are performed once on the Ubuntu host. Replace the runner account below if it is not `github-runner`.

### 1. DNS and Cloudflare

1. Add `nateponds.com` to Cloudflare and use the assigned Cloudflare nameservers at the registrar.
2. Create a proxied `A` record for `@` pointing to the server's public IPv4 address. Add a proxied `AAAA` record only when IPv6 is correctly routed and firewalled.
3. Create `www` as a proxied CNAME to `nateponds.com` if the `www` hostname is desired.
4. Set SSL/TLS mode to **Full (strict)** after installing a valid origin certificate. Never use Flexible mode with this reverse-proxy layout.
5. Forward TCP 80 and 443 from the router to the Ubuntu host when it is behind NAT. Do not forward port 3001.

### 2. Host packages and Apache modules

```bash
sudo apt update
sudo apt install -y apache2 curl git rsync
sudo a2enmod proxy proxy_http headers rewrite ssl
```

Install Node.js 20+ using a maintained distribution or NodeSource, then verify `node --version` and `npm --version`. Install the GitHub self-hosted runner using GitHub's repository **Settings → Actions → Runners** instructions and apply the `self-hosted` and `linux` labels expected by the workflow.

Create the deployment directory:

```bash
sudo install -d -o github-runner -g github-runner /mnt/Storage2_New/website-hosting/nateponds-portfolio
```

The filesystem containing `/mnt/Storage2_New` must mount before Apache and the API service start. Use a stable UUID entry in `/etc/fstab` for attached storage.

### 3. Apache virtual host

Create `/etc/apache2/sites-available/nateponds.com.conf`:

```apache
<VirtualHost *:80>
    ServerName nateponds.com
    ServerAlias www.nateponds.com
    Redirect permanent / https://nateponds.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName nateponds.com
    ServerAlias www.nateponds.com

    DocumentRoot /mnt/Storage2_New/website-hosting/nateponds-portfolio/dist

    <Directory /mnt/Storage2_New/website-hosting/nateponds-portfolio/dist>
        Options -Indexes
        AllowOverride None
        Require all granted
    </Directory>

    ProxyPreserveHost On
    ProxyPass        /api/ http://127.0.0.1:3001/api/
    ProxyPassReverse /api/ http://127.0.0.1:3001/api/

    ErrorLog ${APACHE_LOG_DIR}/nateponds-error.log
    CustomLog ${APACHE_LOG_DIR}/nateponds-access.log combined

    SSLEngine on
    SSLCertificateFile /etc/ssl/cloudflare/nateponds.com.pem
    SSLCertificateKeyFile /etc/ssl/cloudflare/nateponds.com.key
</VirtualHost>
```

The certificate paths are examples; use the paths where the Cloudflare Origin Certificate and private key were securely installed. Protect the key with root ownership and mode `600`.

Enable and validate the site:

```bash
sudo a2ensite nateponds.com.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

### 4. Express systemd service

Create `/etc/systemd/system/nateponds-portfolio-api.service`:

```ini
[Unit]
Description=nateponds.com project status API
After=network-online.target
Wants=network-online.target
RequiresMountsFor=/mnt/Storage2_New/website-hosting/nateponds-portfolio

[Service]
Type=simple
User=github-runner
Group=github-runner
WorkingDirectory=/mnt/Storage2_New/website-hosting/nateponds-portfolio
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3001
Environment=PROJECT_STATUS_TIMEOUT_MS=5000
Environment=PROJECT_STATUS_CACHE_TTL_MS=300000
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

Confirm the Node path with `command -v node` and adjust `ExecStart` if needed, then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nateponds-portfolio-api.service
```

The workflow restarts this unit. Give the runner narrowly scoped passwordless permission with `sudo visudo -f /etc/sudoers.d/nateponds-runner`:

```sudoers
github-runner ALL=(root) NOPASSWD: /usr/bin/systemctl restart nateponds-portfolio-api.service
```

### 5. GitHub Actions and Cloudflare secrets

The workflow deploys every push to `main` on the self-hosted Linux runner. It:

1. Checks out the repository and selects Node 20.
2. Runs `npm ci`, unit tests, and the Vite production build.
3. Uses `rsync --delete` to deploy into `/mnt/Storage2_New/website-hosting/nateponds-portfolio`.
4. Installs production-only backend dependencies.
5. Restarts the systemd API service.
6. Purges the Cloudflare zone cache.

Add these repository Actions secrets:

| Secret | Required permission |
| --- | --- |
| `CLOUDFLARE_ZONE_ID` | The zone ID for nateponds.com |
| `CLOUDFLARE_API_TOKEN` | Token limited to **Zone → Cache Purge → Purge** for this zone |

Protect `main` and require the deploy/check workflow if production changes should be reviewed before release. The self-hosted runner has production access; restrict who can modify workflows and who can push to deployment branches.

## Deployment and verification

Push a tested change to `main` and watch the **Deploy nateponds.com to Ubuntu Apache** workflow. After it succeeds, verify from the server:

```bash
curl -fsS http://127.0.0.1:3001/api/health
curl -fsS https://nateponds.com/api/health
curl -I https://nateponds.com/
curl -I https://nateponds.com/projects.html
sudo systemctl status nateponds-portfolio-api.service --no-pager
```

Also open the landing page and project archive in a browser, check mobile navigation, and confirm live status badges. A green workflow only proves deployment completed; these checks prove the public path, TLS, Apache proxy, and API are all connected.

## Operations and troubleshooting

| Symptom | Checks |
| --- | --- |
| Apache returns 503 for `/api/` | `systemctl status` and `journalctl -u nateponds-portfolio-api.service -n 100` |
| Site returns 403 | Directory execute/read permissions, mount state, and Apache `<Directory>` path |
| Old frontend remains visible | Confirm workflow revision, inspect `dist/`, then check Cloudflare cache purge result |
| Statuses remain static | Test both health endpoints and inspect browser Network requests to `/api/project-statuses` |
| Apache will not reload | Run `sudo apache2ctl configtest` and inspect `nateponds-error.log` |
| Deploy cannot restart API | Verify the exact systemd unit name and the narrow sudoers rule |
| Runner is offline | Check the GitHub runner service and host network/storage mount |

Logs:

```bash
sudo journalctl -u nateponds-portfolio-api.service -f
sudo tail -f /var/log/apache2/nateponds-error.log
sudo tail -f /var/log/apache2/nateponds-access.log
```

For rollback, redeploy a known-good commit (preferably by reverting the bad commit on `main`). If immediate manual recovery is necessary, check out the known-good revision on the runner, run `npm ci && npm run check`, rsync it to the production path using the workflow's exclusions, install production dependencies, and restart the service. Record the manual action and follow it with a Git commit so production and `main` do not drift.

## Security and maintenance checklist

- Keep Express on `127.0.0.1`; expose only 80/443 through the firewall/router.
- Use Cloudflare Full (strict), a protected origin private key, and a least-privilege cache-purge token.
- Apply Ubuntu, Apache, Node, and npm security updates regularly.
- Review dependency changes and commit `package-lock.json`; CI uses `npm ci` for reproducibility.
- Keep the self-hosted runner dedicated or tightly isolated because repository workflows execute on the production host.
- Back up Apache, systemd, Cloudflare/DNS settings, and the repository—not `node_modules` or `dist`, which are reproducible.
- Monitor disk space, mount health, API restarts, certificate validity, and public health checks.
- Never commit `.env`, certificates, private keys, API tokens, or runner credentials.
