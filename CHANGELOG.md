# Changelog

All notable changes to **rePROMPT** will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-02-18

### Changed

- **Security: Backend Proxy** — API calls now route through an Express backend server (`server.js`). The Anthropic API key is stored as a server-side environment variable (`ANTHROPIC_API_KEY`), never exposed to the browser.
- **Removed `anthropic-dangerous-direct-browser-access`** — Eliminated the insecure direct-browser header; all API traffic flows server-to-server.
- **Settings Modal** — Replaced the client-side API key input with a backend connection status indicator showing real-time health (green/yellow/red).
- **Project Structure** — Static assets moved to `public/` directory; Express serves them alongside the `/api/messages` proxy endpoint.
- **Service Worker** — Updated to v2 cache; now skips `/api/*` routes instead of `api.anthropic.com`.

### Added

- `server.js` — Express backend with `/api/messages` proxy and `/api/health` endpoint
- `.env.example` — Template for `ANTHROPIC_API_KEY` configuration
- `.gitignore` — Excludes `.env`, `node_modules/`, OS files, editor configs
- `npm start` script for one-command server startup

### Removed

- Client-side API key storage in `localStorage`
- Direct browser-to-Anthropic API calls
- API key input field and visibility toggle from settings UI

## [1.0.0] — 2026-02-18

### Added

- **Prompt Enhancement** — Three processing modes: Enhance, Rewrite, and Analyze
- **Claude API Integration** — Model selection (Sonnet 4.5, Haiku 4.5)
- **Image Input** — Attach images for visual context; base64-encoded and sent alongside prompts via Claude's vision capability
- **Optional Context Field** — Collapsible textarea for additional instructions or target-LLM details
- **Copy to Clipboard** — One-tap copy of enhanced output with toast confirmation
- **Settings Modal** — Bottom-sheet modal for model selection
- **PWA Support** — Service worker with stale-while-revalidate caching, web app manifest, and Add-to-Home-Screen readiness
- **iOS Optimizations** — Safe-area insets, standalone display, status bar styling, touch-optimized controls
- **VASEY/AI Branding** — Consistent header with Space Mono + DM Sans typography, Claude-inspired color palette (lavender, soft orange, grey)
- **App Icon** — SVG icon with angle-bracket + arrow motif and sparkle accents; PNG variants at 192px and 512px
- **GitHub Actions CI** — Automated linting and GitHub Pages deployment workflow
