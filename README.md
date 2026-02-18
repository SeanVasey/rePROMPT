# rePROMPT

**AI-powered prompt enhancement** — part of the **VASEY/AI** application series.

rePROMPT takes rough, vague, or under-specified prompts and transforms them into clear, detailed, and effective instructions optimized for any large language model.

---

## Features

| Feature | Description |
|---|---|
| **Enhance** | Polish and detail an existing prompt while preserving intent |
| **Rewrite** | Completely reimagine a prompt with professional prompt-engineering best practices |
| **Analyze** | Get a quality rating, weakness diagnosis, and an improved version |
| **Image Input** | Attach images for visual context — sent via Claude's vision capability |
| **Copy Output** | One-tap copy of the enhanced prompt to clipboard |
| **PWA** | Install to your iOS/Android home screen for native-app feel |
| **Secure Backend** | API key stays on the server — never exposed to the browser |

## Architecture

```
Browser (PWA)           Backend (Express)           Anthropic API
─────────────           ─────────────────           ─────────────
  app.js        ──►     POST /api/messages    ──►   POST /v1/messages
  (no API key)          (adds API key from            (server-to-server)
                         env variable)
```

The frontend sends requests to the Express backend at `/api/messages`. The backend injects the `ANTHROPIC_API_KEY` from an environment variable and forwards the request to Anthropic's API. The API key is **never** sent to or stored in the browser.

## Tech Stack

- **Frontend** — Vanilla HTML / CSS / JavaScript (zero dependencies)
- **Backend** — Express.js proxy server (Node.js >=18)
- **API** — Anthropic Claude Messages API (Sonnet 4.5 / Haiku 4.5)
- **PWA** — Service worker + web app manifest
- **Fonts** — DM Sans + Space Mono (Google Fonts)
- **CI/CD** — GitHub Actions for linting + GitHub Pages deployment

## Color Palette

Claude-inspired theme used across the UI:

| Token | Hex | Usage |
|---|---|---|
| Lavender | `#C4B5FD` | Accent, focus rings, "PROMPT" text |
| Soft Orange | `#D97757` | Primary action, "re" prefix, active states |
| Dark BG | `#1A1A2E` | App background |
| Card BG | `#2A2A42` | Output cards, elevated surfaces |
| Text Primary | `#F0EDF6` | Body text |
| Text Secondary | `#9CA3AF` | Labels, hints |

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/SeanVasey/rePROMPT.git
cd rePROMPT
npm install
```

### 2. Configure the API key

```bash
cp .env.example .env
```

Edit `.env` and set your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

The `.env` file is git-ignored and never committed.

### 3. Start the server

```bash
npm start
```

Open `http://localhost:3000` in your browser. The settings gear will show a green "Connected" status when the backend is properly configured.

### 4. Deploy

**Self-hosted / VPS:**

```bash
# Set the env var on your server
export ANTHROPIC_API_KEY=sk-ant-...
npm start
```

**Docker / Platform-as-a-Service:**
Set `ANTHROPIC_API_KEY` as a secret/environment variable in your platform settings (Render, Railway, Fly.io, etc.) and deploy with `npm start`.

**GitHub Pages (static frontend only):**
Push to `main` and the CI workflow deploys to GitHub Pages. Note: GitHub Pages serves only the static frontend — you'll need a separate backend host for the API proxy.

## Project Structure

```
rePROMPT/
├── server.js               # Express backend (API proxy + static files)
├── package.json             # Dependencies, scripts, version
├── .env.example             # Template for ANTHROPIC_API_KEY
├── .gitignore               # Excludes .env, node_modules
├── VERSION                  # Semver version file
├── CHANGELOG.md             # Release notes
├── LICENSE                  # Apache 2.0
├── public/                  # Static frontend assets
│   ├── index.html           # App shell
│   ├── styles.css           # Full styling (Claude palette)
│   ├── app.js               # Core logic (calls /api/messages)
│   ├── sw.js                # Service worker (PWA caching)
│   ├── manifest.json        # PWA manifest
│   └── icons/
│       ├── icon.svg         # Vector app icon
│       ├── icon-192.png     # PWA icon (192x192)
│       └── icon-512.png     # PWA icon (512x512)
└── .github/
    └── workflows/
        ├── ci.yml           # Lint & validate on PR
        └── deploy.yml       # GitHub Pages deployment
```

## Security

- The API key is stored **only** as a server-side environment variable
- The frontend makes requests to `/api/messages` — no API key in the browser
- The `anthropic-dangerous-direct-browser-access` header has been removed
- `localStorage` stores only the user's model preference (no secrets)
- `.env` is excluded from version control via `.gitignore`

## Versioning

This project uses [Semantic Versioning](https://semver.org/). Current version is tracked in `VERSION` and `package.json`.

See [CHANGELOG.md](CHANGELOG.md) for release history.

## VASEY/AI Series

rePROMPT is part of the VASEY/AI application suite:

- **reSOURCERY** — Resource management
- **StyleyeS** — Style analysis
- **FilePhile** — File management
- **rePROMPT** — Prompt enhancement

## License

[Apache License 2.0](LICENSE)
