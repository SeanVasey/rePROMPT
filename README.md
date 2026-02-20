# rePROMPT

rePROMPT is a Claude-powered prompt enhancement web app by VASEY/AI. It ships as a static PWA frontend plus a secure Node/Express API proxy so provider credentials remain server-side.

## Features

- Enhance, rewrite, and analyze prompts with structured system prompts.
- Optional image attachments passed through the backend proxy.
- PWA install support (manifest + service worker + icons).
- Runtime backend health check in settings UI.
- Proxy-side input validation, upstream timeouts, and API rate limiting defaults.
- Configurable API base URL for static frontend hosting.
- Flexible provider routing:
  - direct Anthropic API key mode
  - AI Gateway mode (including Vercel AI Gateway patterns)

## Tech Stack

- Node.js 18+ / Express 4
- Vanilla HTML/CSS/JavaScript
- Anthropic Messages API-compatible proxying
- GitHub Actions (CI, GitHub Pages deploy, optional Vercel deploy)

## Setup

```bash
git clone https://github.com/SeanVasey/rePROMPT.git
cd rePROMPT
npm install
cp .env.example .env
```

Start locally:

```bash
npm start
```

App URL: `http://localhost:3000`

## Environment Variables

Use `.env.example` as the source of truth.

### Direct Anthropic mode

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### AI Gateway mode (Vercel AI Gateway or compatible)

```bash
AI_GATEWAY_URL=https://gateway.ai.vercel.sh/v1
AI_GATEWAY_MESSAGES_PATH=/messages
AI_GATEWAY_API_KEY=...
AI_GATEWAY_AUTH_MODE=bearer
```

Notes:
- If `AI_GATEWAY_URL` already contains `/messages`, no extra path is appended.
- `AI_GATEWAY_API_KEY` falls back to `ANTHROPIC_API_KEY` when empty.
- `AI_GATEWAY_AUTH_MODE` supports `x-api-key` (default) and `bearer`.

## Commands

- Run app: `npm start`
- Dev mode: `npm run dev`
- Validation checks: `npm run validate`
- Test alias: `npm test`

## Architecture

```text
public/* (PWA frontend) -> /api/messages (Express/Vercel proxy) -> AI Gateway or Anthropic
```

- Frontend reads API base from `window.__REPROMPT_CONFIG__.apiBaseUrl` in `public/config.js`.
- Local default is same-origin (`''`).
- GitHub Pages deploy workflow generates `public/config.js` from repo variable `REPROMPT_API_BASE_URL`.

## CI/CD

### CI

`.github/workflows/ci.yml` runs on push/PR and performs:

- dependency install
- repository validation (`npm run validate`)
- syntax/smoke checks
- secret-pattern scans for Anthropic-style keys
- version consistency checks (`package.json`, `VERSION`, `CHANGELOG.md`)

### GitHub Pages deploy

`.github/workflows/deploy.yml` deploys `public/` and writes `public/config.js` from:

- Repository Variable: `REPROMPT_API_BASE_URL` (non-secret)

### Optional Vercel deploy via API key

`.github/workflows/vercel-deploy.yml` supports deployment to Vercel using:

- `VERCEL_TOKEN` (secret, API token)
- `VERCEL_ORG_ID` (secret)
- `VERCEL_PROJECT_ID` (secret)

The workflow deploys preview builds on PRs and production on `main`/`master` pushes.

## Repository Flags & Variables

See `docs/REPO_FLAGS.md` for recommended repository variables/secrets and operational flags for GitHub + Vercel.

## Security

- Never commit `.env`.
- Never place provider API keys in frontend code.
- API handlers enforce strict payload validation, secure response headers, and outbound timeout controls.
- Express runtime adds an IP-based rate limit for `/api/*` routes (60 requests/minute).
- Use provider/platform secret stores for backend deployment.
- See `SECURITY.md` for reporting policy.

## Folder Structure

```text
.
├── .github/workflows/
├── api/
├── docs/
├── public/
├── scripts/
├── server.js
├── README.md
├── CHANGELOG.md
├── SECURITY.md
├── LICENSE
└── .env.example
```

## License

Apache-2.0. See `LICENSE`.
