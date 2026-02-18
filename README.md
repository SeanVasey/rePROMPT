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

## Tech Stack

- **Frontend** — Vanilla HTML / CSS / JavaScript (zero dependencies)
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

### 1. Clone

```bash
git clone https://github.com/SeanVasey/rePROMPT.git
cd rePROMPT
```

### 2. Serve locally

Any static file server will work:

```bash
# Python
python3 -m http.server 8000

# Node (npx)
npx serve .
```

Open `http://localhost:8000` on your phone or browser.

### 3. Configure API key

Tap the **gear icon** (top-right) and enter your Anthropic API key. The key is stored in your browser's `localStorage` and is only sent to `api.anthropic.com`.

### 4. Deploy to GitHub Pages

Push to `main` and the included GitHub Actions workflow will automatically deploy to:

```
https://seanvasey.github.io/rePROMPT
```

For custom domains, add a `CNAME` file to the repo root.

## Project Structure

```
rePROMPT/
├── index.html          # App shell
├── styles.css          # Full styling (Claude palette)
├── app.js              # Core logic + Claude API integration
├── sw.js               # Service worker (PWA caching)
├── manifest.json       # PWA manifest
├── package.json        # Version metadata
├── VERSION             # Semver version file
├── CHANGELOG.md        # Release notes
├── LICENSE             # Apache 2.0
├── icons/
│   ├── icon.svg        # Vector app icon
│   ├── icon-192.png    # PWA icon (192×192)
│   └── icon-512.png    # PWA icon (512×512)
└── .github/
    └── workflows/
        ├── ci.yml      # Lint & validate on PR
        └── deploy.yml  # GitHub Pages deployment
```

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
