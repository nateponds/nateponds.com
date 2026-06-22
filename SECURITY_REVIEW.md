# Security Review: nateponds.com

**Date**: 2026-06-22  
**Reviewed By**: Claude Code Security Audit  
**Status**: Security vulnerabilities and oversights identified

---

## Executive Summary

The nateponds.com portfolio project has several security gaps across development, deployment, and runtime configurations. While the application itself is relatively low-risk (no user authentication, no database writes), there are **critical information exposure issues**, missing security headers, and deployment practices that should be addressed.

**Risk Level: MEDIUM → HIGH** (Critical: CI/CD pipeline exposure enables infrastructure compromise)

---

## Critical Issues

### 1. **CI/CD Deployment Workflow Exposed in Public Repository**
**Severity**: CRITICAL  
**Location**: `.github/workflows/deploy.yml`

The GitHub Actions deployment workflow is publicly visible and contains infrastructure secrets that enable attackers to plan targeted compromises of your server.

**What's Exposed**:
```yaml
ROOT="/mnt/Storage2_New/website-hosting/nateponds-portfolio"  # Exact server path
sudo systemctl restart nateponds-portfolio-api.service        # Service name
npm ci --omit=dev                                             # Build process
chmod -R u=rwX,go=rX "$ROOT"                                  # Permission setup
runs-on: [self-hosted, linux]                                 # Self-hosted runner
CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}     # Service dependencies
```

**Why This Is Dangerous**:

1. **Complete Infrastructure Blueprint**: Attackers now have:
   - Exact server directory structure
   - Service names to target/kill
   - Deployment method and timing
   - Build process details
   - Self-hosted runner location (more valuable target than GitHub's)

2. **Attack Planning**: With this information, attackers can:
   - Compromise the self-hosted runner to inject malicious code during deploys
   - Intercept or modify deployments (rsync transfers)
   - Time attacks to coincide with deployment windows
   - Plant backdoors in exact locations they know will be deployed
   - Determine exact privilege escalation paths (sudoers config)

3. **Credential Discovery**: While the token value is hidden, attackers know:
   - A Cloudflare API token is used for cache purging
   - The exact curl command format to potentially intercept it
   - Which external services are integrated with your infrastructure

4. **Self-Hosted Runner Risk**: Knowing you use a self-hosted runner makes it a high-value target:
   - One compromised workflow run gives full server access
   - Can be used to deploy malicious code directly
   - Can steal all environment variables and secrets
   - Can be used to pivot into your network

5. **Service Name Exploitation**: Knowing the service is `nateponds-portfolio-api.service` allows attackers to:
   - Target that specific systemctl service
   - Create systemd hooks to maintain persistence
   - Craft attacks specific to that service startup sequence

**Real Attack Scenario**:
```
1. Attacker forks your public repo
2. Creates a malicious PR that modifies the workflow to:
   - Add a backdoor to the deployment
   - Exfiltrate the Cloudflare token
   - Install persistence in /mnt/Storage2_New/...
3. Even if you don't merge it, they've learned your exact setup
4. They can now craft targeted exploits knowing:
   - Exact paths where code lands
   - Exact systemctl commands you run
   - Exact timing of deployments
   - Exact services to compromise
```

**Recommendations**:

✅ **DO NOT** commit workflow files with:
- Server paths and directories
- Service names
- Deployment commands
- Build process details
- Infrastructure topology

✅ **Instead**:
1. Move deployment script to a **separate private repository**
2. Call a minimal public wrapper that references private deployment logic
3. Use GitHub Environment Secrets for all infrastructure details
4. Document deployment procedure in a **private wiki** or team docs
5. Consider using GitHub's deployment protection rules and environment approvals

**Example Safe Approach**:
```yaml
# Public workflow - minimal details
- name: Deploy
  environment: production
  run: chmod +x ./scripts/deploy-public.sh && ./scripts/deploy-public.sh
```

```bash
# scripts/deploy-public.sh (can be public - calls private script)
#!/bin/bash
set -euo pipefail
# This script is intentionally minimal and calls a private deployment system
# Actual deployment details are in a separate private repository
echo "Initiating deployment..."
# Use GitHub Actions secrets, not hardcoded values
```

Keep the actual deployment details (paths, services, commands) in a private deployment repository that the self-hosted runner has access to.

---

### 2. **Sensitive Personal Information Exposed in Source Code**
**Severity**: HIGH  
**Location**: `src/App.jsx:749`

Personal contact information is hardcoded in the React component and will be visible in:
- Public GitHub repository source code
- Client-side JavaScript bundles (visible in browser DevTools)
- Build artifacts

```javascript
<a className="contact-method" href="tel:+639563585873">
  <PhoneIcon />
  <span>
    <strong>Phone</strong>
    <small>+63 (956) 358-5873</small>
  </span>
</a>
```

**Recommendations**:
- Consider using environment variables for sensitive contact information
- Use a contact form instead of direct phone numbers
- Implement automated scanning to prevent secrets from being committed

**Quick Fix**:
```javascript
// Load from environment or config
const PHONE_NUMBER = import.meta.env.VITE_PHONE || "Contact via email";
```

---

### 3. **Server Infrastructure Disclosure**
**Severity**: MEDIUM  
**Location**: `src/App.jsx:249, src/App.jsx:534-535`

Public exposure of:
- Operating system version: "Ubuntu 24.04.4 LTS"
- Hardware specifications: "AMD Ryzen 3 4300GE and 16 GB DDR5 RAM"
- Server setup details

**Impact**: Attackers can research specific OS/hardware vulnerabilities

**Recommendations**:
- Remove specific version numbers from public-facing content
- Use generic descriptions like "Linux-based server" instead
- Keep detailed system info for internal documentation only

---

### 4. **No Security Headers**
**Severity**: HIGH  
**Location**: `server.js` (missing middleware)

The Express server is missing critical security headers:
- No `Content-Security-Policy` (CSP)
- No `X-Frame-Options` (clickjacking protection)
- No `X-Content-Type-Options` (MIME sniffing protection)
- No `Strict-Transport-Security` (HSTS)
- No `Referrer-Policy`

**Impact**: 
- Clickjacking attacks
- MIME type sniffing exploits
- XSS vulnerabilities
- Information leakage via referrer headers

**Recommendations**: Add helmet.js or manual headers:

```javascript
const express = require("express");
const app = express();

// Add security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net cdn.simpleicons.org fonts.googleapis.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self';"
  );
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
```

---

### 5. **API Rate Limiting Missing**
**Severity**: MEDIUM  
**Location**: `server.js:35-46` (`/api/project-statuses` endpoint)

The project status checker endpoint has no rate limiting. An attacker could:
- Trigger repeated health checks of external sites
- Use as a proxy for reconnaissance
- Cause unnecessary load on target websites
- Enumerate which projects are configured

**Recommendations**: Implement rate limiting:

```javascript
const rateLimit = require("express-rate-limit");

const statusLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/api/project-statuses", statusLimiter, async (_request, response) => {
  // ... existing code
});

app.get("/api/health", rateLimit({ windowMs: 60 * 1000, max: 60 }), 
  (_request, response) => response.json({ ok: true })
);
```

---

## High Priority Issues

### 6. **CORS Not Explicitly Configured**
**Severity**: MEDIUM  
**Location**: `server.js` (missing CORS setup)

Without explicit CORS configuration, the API could be:
- Accessible from any origin
- Vulnerable to unauthorized API calls from other domains

**Recommendations**:

```javascript
const cors = require("cors");

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["https://nateponds.com"],
  credentials: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

---

### 7. **CDN Resources Without Integrity Checks**
**Severity**: MEDIUM  
**Location**: `index.html:7-11`

External resources loaded without Subresource Integrity (SRI):
- Google Fonts (CSS and font files)
- cdn.jsdelivr.net icons
- cdn.simpleicons.org icons

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css?family=Montserrat:..." rel="stylesheet" />
```

**Impact**: Man-in-the-middle attacks could modify CSS/fonts

**Recommendations**: Add SRI hashes:

```html
<link 
  href="https://fonts.googleapis.com/css?family=Montserrat:100,200,300,400,500,600,700,800,900"
  rel="stylesheet"
  integrity="sha384-..."
  crossorigin="anonymous"
/>
```

---

### 8. **Insufficient Input Validation for URLs**
**Severity**: MEDIUM  
**Location**: `lib/project-status.js:82-120`

While URL validation exists, error messages could leak information:

```javascript
catch (error) {
  return result(
    "red",
    error.name === "AbortError" ? "Request timed out" : error.message, // Leaks error details
  );
}
```

**Recommendations**: Sanitize error messages:

```javascript
catch (error) {
  const reason = error.name === "AbortError" 
    ? "Request timed out" 
    : "Unable to fetch status";
  return result("red", reason);
}
```

---

### 9. **Deployment Script Hardcoded Paths**
**Severity**: LOW-MEDIUM  
**Location**: `.github/workflows/deploy.yml:46, 61`

```yaml
ROOT="/mnt/Storage2_New/website-hosting/nateponds-portfolio"
```

**Issues**:
- Leaks server directory structure in public CI logs
- Hard to maintain across environments
- No validation that directory exists

**Recommendations**:

```yaml
- name: Deploy to Apache web root
  env:
    DEPLOY_ROOT: ${{ secrets.DEPLOY_ROOT }}
  run: |
    ROOT="${DEPLOY_ROOT:-/mnt/Storage2_New/website-hosting/nateponds-portfolio}"
    test -d "$ROOT" || { echo "Deploy directory not found"; exit 1; }
```

---

## Medium Priority Issues

### 10. **Public GitHub Repository Exposes Source Code**
**Severity**: MEDIUM (varies by sensitivity)  
**Location**: `src/App.jsx:268`

The GitHub link points to a public repository, which is fine for a portfolio, but:
- Private projects should never be referenced with accessible URLs
- Deployment scripts are visible
- All infrastructure details are exposed

**Recommendations**:
- Keep portfolio projects public (intentional)
- Separate deployment scripts into private CI/CD-only locations
- Document what should never be committed: `.env.local`, secrets, etc.

**Ensure .gitignore includes**:
```
.env
.env.local
.env.*.local
node_modules/
dist/
import/
```

✅ Already configured correctly in `.gitignore`

---

### 11. **Vite Dev Server Configuration Not Protected**
**Severity**: LOW (dev-only issue)  
**Location**: `vite.config.js:15-17`

```javascript
server: {
  proxy: {
    "/api": "http://127.0.0.1:3001",
  },
}
```

**Risk**: If accidentally deployed to production, the proxy would be active.

**Recommendations**:

```javascript
server: {
  proxy: {
    "/api": {
      target: "http://127.0.0.1:3001",
      secure: false,
      changeOrigin: false,
    },
  },
}
```

---

### 12. **No dependency Scanning in CI**
**Severity**: MEDIUM  
**Location**: `.github/workflows/deploy.yml`

No automated scanning for known vulnerabilities.

**Recommendations**: Add `npm audit` to CI:

```yaml
- name: Audit dependencies
  run: npm audit --audit-level=moderate
```

---

### 13. **Static Files Served Without Cache-Control**
**Severity**: LOW  
**Location**: `server.js:49`

```javascript
app.use(express.static(distDirectory));
```

**Recommendations**: Add cache headers for static assets:

```javascript
app.use(express.static(distDirectory, {
  maxAge: "1d",
  etag: false,
}));
```

---

## Low Priority Issues

### 14. **Insufficient Error Handling Details**
**Severity**: LOW  
**Location**: `server.js:40-42`

Error responses could leak information:

```javascript
} catch (error) {
  console.error("Failed to refresh project statuses:", error); // Logs full error
  return statusCache ? response.json(statusCache) : response.status(500).json({ error: "Unable to load project statuses" });
}
```

**Recommendations**: Don't expose error details in responses:

```javascript
} catch (error) {
  console.error("Failed to refresh project statuses:", error); // Safe in server logs
  return statusCache 
    ? response.json(statusCache) 
    : response.status(500).json({ error: "Service temporarily unavailable" });
}
```

---

### 15. **Missing Health Check Validation**
**Severity**: LOW  
**Location**: `server.js:48`

```javascript
app.get("/api/health", (_request, response) => response.json({ ok: true }));
```

Could be used for reconnaissance. Consider:

```javascript
const healthLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.get("/api/health", healthLimiter, (_request, response) => 
  response.json({ status: "ok" })
);
```

---

## Security Best Practices Checklist

- [ ] Add `helmet.js` or manual security headers to Express
- [ ] Implement rate limiting on all API endpoints
- [ ] Configure explicit CORS policy
- [ ] Add SRI hashes to external CDN resources
- [ ] Sanitize error messages exposed to clients
- [ ] Move hardcoded paths to environment variables
- [ ] Add `npm audit` to CI/CD pipeline
- [ ] Document sensitive information handling
- [ ] Enable HTTPS enforcement (HSTS header)
- [ ] Implement request validation middleware
- [ ] Add logging and monitoring for suspicious activity
- [ ] Regular dependency updates (use Dependabot)
- [ ] Use `npm ci` instead of `npm install` in CI (already done ✅)

---

## Quick Security Fixes Summary

**Priority 0 (CRITICAL - Do Immediately)**:
1. **Move CI/CD workflow to private repository** - Do not expose deployment pipeline publicly
2. Remove deployment paths, service names, and build commands from public workflows

**Priority 1 (Implement immediately)**:
3. Add security headers (Content-Security-Policy, X-Frame-Options, etc.)
4. Remove hardcoded phone number; use environment variable
5. Add rate limiting to API endpoints
6. Sanitize error messages

**Priority 2 (Implement soon)**:
7. Add explicit CORS configuration
8. Add SRI hashes to external resources
9. Add npm audit to CI pipeline
10. Evaluate if GitHub public workflows are necessary; consider alternative deployment methods

**Priority 3 (Good to have)**:
11. Add helmet.js for comprehensive security headers
12. Implement structured logging
13. Add security.txt file for vulnerability disclosure
14. Set up automated dependency updates (Dependabot)

---

## Conclusion

The nateponds.com project is a relatively low-risk portfolio application, but has **critical** security gaps that need immediate attention. The most severe issues are:

1. **🔴 CRITICAL: CI/CD deployment workflow is publicly exposed** — This is the most dangerous finding. Attackers can see:
   - Exact server paths, service names, and deployment commands
   - Infrastructure topology and build process details
   - Self-hosted runner configuration
   - Timing and methods for deploying code
   - This enables highly targeted infrastructure compromise

2. **Sensitive phone number exposure** in source code and bundle

3. **Missing security headers** that enable various browser-based attacks

4. **No rate limiting** on public API endpoints

5. **Infrastructure disclosure** in public-facing content

**Immediate Actions Required**:
- Move `.github/workflows/deploy.yml` to a **private repository** or use a different deployment method that doesn't expose infrastructure details
- This is more critical than all other findings combined as it enables infrastructure-level attacks

Implementing the Priority 0 and Priority 1 fixes would significantly improve the security posture. The application should establish a regular security review cycle and implement automation to prevent infrastructure details from being committed to public repositories.
