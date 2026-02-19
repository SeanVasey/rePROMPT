# rePROMPT

rePROMPT is a Claude-powered prompt enhancement web app by VASEY/AI. It ships as a static PWA frontend plus a secure Node/Express API proxy so Anthropic credentials stay server-side.

## Features

- Enhance, rewrite, and analyze prompts with structured system prompts.
- Optional image attachments sent through backend proxy for Claude vision input.
- PWA install support (manifest + service worker + icons).
- Runtime backend health check in settings UI.
- Configurable API base URL for GitHub Pages/static deployment.
- Secret-safe architecture: API keys are never stored in browser code.

## Tech Stack

- Node.js 18+ / Express 4
- Vanilla HTML/CSS/JavaScript
- Anthropic Messages API
- GitHub Actions (CI + GitHub Pages deploy)

## Setup

```bash
git clone https://github.com/SeanVasey/rePROMPT.git
cd rePROMPT
npm install
cp .env.example .env
```

Set required variables in `.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
# Optional only if frontend and backend are on different origins
REPROMPT_API_BASE_URL=
```

Start:

```bash
npm start
```

App URL: `http://localhost:3000`

## Commands

- Run app: `npm start`
- Dev mode: `npm run dev`
- Validation smoke checks: `npm run validate`
- Test alias: `npm test`

## Architecture

```text
public/* (PWA frontend) -> /api/messages (Express proxy) -> api.anthropic.com/v1/messages
```

- Frontend reads API base from `window.__REPROMPT_CONFIG__.apiBaseUrl` in `public/config.js`.
- Local default is same-origin (`''`).
- GitHub Pages deploy workflow generates `public/config.js` from repo variable `REPROMPT_API_BASE_URL`.

## GitHub Pages + CI Configuration

### CI

`.github/workflows/ci.yml` runs on push/PR and performs:

- Node syntax checks and repository validation (`npm run validate`)
- Security pattern check to fail on committed `sk-ant-...` values

### GitHub Pages

`.github/workflows/deploy.yml` deploys `public/` and writes `public/config.js` at build time using:

- Repository Variable: `REPROMPT_API_BASE_URL` (backend origin, non-secret)

> Important: GitHub Pages cannot safely host your `ANTHROPIC_API_KEY`. Host `server.js` separately (Render/Fly/Railway/VPS/etc.) and set `ANTHROPIC_API_KEY` in that host's secret manager.

## Security

- Never commit `.env`.
- Never place `ANTHROPIC_API_KEY` in client-side code or GitHub Pages variables.
- Use provider secret stores for backend deployment.
- See `SECURITY.md` for reporting and policy details.

## Folder Structure

```text
.
├── .github/workflows/
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
