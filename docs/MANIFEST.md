# Repository Manifest

## Runtime
- `server.js` — Express server, static hosting, and Anthropic proxy endpoint.
- `public/` — static PWA frontend (HTML/CSS/JS, icons, manifest, service worker).

## CI/CD
- `.github/workflows/ci.yml` — syntax/smoke validation and secret-pattern checks.
- `.github/workflows/deploy.yml` — GitHub Pages deployment for static frontend.

## Governance & Security
- `README.md` — setup, architecture, deployment notes.
- `CHANGELOG.md` — versioned change history.
- `SECURITY.md` — vulnerability reporting and secret-management policy.
- `LICENSE` — Apache 2.0 licensing.
