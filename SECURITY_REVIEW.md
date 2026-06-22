# Security Review: nateponds.com

**Date**: 2026-06-22  
**Reviewed By**: Claude Code Security Audit  
**Status**: Security vulnerabilities and oversights identified

---

## Executive Summary

The nateponds.com portfolio project has several security gaps across development, deployment, and runtime configurations. While the application itself is relatively low-risk (no user authentication, no database writes), there are **critical information exposure issues**, missing security headers, and deployment practices that should be addressed.

**Risk Level: MEDIUM** (Primarily information exposure and infrastructure disclosure)

---

## Critical Issues

### 1. **Sensitive Personal Information Exposed in Source Code**
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

### 2. **Server Infrastructure Disclosure**
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

### 3. **No Security Headers**
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

### 4. **API Rate Limiting Missing**
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

### 5. **CORS Not Explicitly Configured**
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

### 6. **CDN Resources Without Integrity Checks**
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

### 7. **Insufficient Input Validation for URLs**
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

### 8. **Deployment Script Hardcoded Paths**
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

### 9. **Public GitHub Repository Exposes Source Code**
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

### 10. **Vite Dev Server Configuration Not Protected**
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

### 11. **No dependency Scanning in CI**
**Severity**: MEDIUM  
**Location**: `.github/workflows/deploy.yml`

No automated scanning for known vulnerabilities.

**Recommendations**: Add `npm audit` to CI:

```yaml
- name: Audit dependencies
  run: npm audit --audit-level=moderate
```

---

### 12. **Static Files Served Without Cache-Control**
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

### 13. **Insufficient Error Handling Details**
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

### 14. **Missing Health Check Validation**
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

**Priority 1 (Implement immediately)**:
1. Add security headers (Content-Security-Policy, X-Frame-Options, etc.)
2. Remove hardcoded phone number; use environment variable
3. Add rate limiting to API endpoints
4. Sanitize error messages

**Priority 2 (Implement soon)**:
5. Add explicit CORS configuration
6. Add SRI hashes to external resources
7. Add npm audit to CI pipeline
8. Move deployment paths to secrets

**Priority 3 (Good to have)**:
9. Add helmet.js for comprehensive security headers
10. Implement structured logging
11. Add security.txt file for vulnerability disclosure
12. Set up automated dependency updates (Dependabot)

---

## Conclusion

The nateponds.com project is a relatively low-risk portfolio application, but has significant security gaps in production hardening. The most critical issues are:

1. **Sensitive phone number exposure** in source code
2. **Missing security headers** that enable various browser-based attacks
3. **No rate limiting** on public API endpoints
4. **Infrastructure disclosure** in public-facing content

Implementing the Priority 1 fixes would significantly improve the security posture. The application should also establish a regular security review cycle as new features are added.
