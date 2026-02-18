# Changelog

All notable changes to **rePROMPT** will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-02-18

### Added

- **Prompt Enhancement** — Three processing modes: Enhance, Rewrite, and Analyze
- **Claude API Integration** — Direct browser calls to Anthropic Messages API with model selection (Sonnet 4.5, Haiku 4.5)
- **Image Input** — Attach images for visual context; base64-encoded and sent alongside prompts via Claude's vision capability
- **Optional Context Field** — Collapsible textarea for additional instructions or target-LLM details
- **Copy to Clipboard** — One-tap copy of enhanced output with toast confirmation
- **Settings Modal** — Bottom-sheet modal for API key entry and model selection; key stored in localStorage
- **PWA Support** — Service worker with stale-while-revalidate caching, web app manifest, and Add-to-Home-Screen readiness
- **iOS Optimizations** — Safe-area insets, standalone display, status bar styling, touch-optimized controls
- **VASEY/AI Branding** — Consistent header with Space Mono + DM Sans typography, Claude-inspired color palette (lavender, soft orange, grey)
- **App Icon** — SVG icon with angle-bracket + arrow motif and sparkle accents; PNG variants at 192px and 512px
- **GitHub Actions CI** — Automated linting and GitHub Pages deployment workflow
