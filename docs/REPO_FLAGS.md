# Repository Flags, Variables, and Secrets

This document lists recommended repository-level configuration for safe and repeatable deployments.

## GitHub Repository Variables (non-secret)

- `REPROMPT_API_BASE_URL`
  - Used by `.github/workflows/deploy.yml` to generate `public/config.js` for GitHub Pages.
  - Example: `https://api.reprompt.example.com`

## GitHub Repository Secrets

### Optional Vercel deployment (via API token)

- `VERCEL_TOKEN`
  - Vercel API token with deployment permissions for the target project.
- `VERCEL_ORG_ID`
  - Vercel team or personal org ID.
- `VERCEL_PROJECT_ID`
  - Vercel project ID for this repository.

### Backend provider secrets

Do **not** place provider keys in repository variables. Use deployment platform secrets:

- `ANTHROPIC_API_KEY`
- `AI_GATEWAY_API_KEY`

## Vercel Project Environment Variables

Set these in Vercel Project Settings → Environment Variables:

- `ANTHROPIC_API_KEY` (direct mode baseline)
- `AI_GATEWAY_URL` (optional, enables gateway mode)
- `AI_GATEWAY_MESSAGES_PATH` (optional; default `/messages`)
- `AI_GATEWAY_API_KEY` (optional; falls back to Anthropic key)
- `AI_GATEWAY_AUTH_MODE` (`x-api-key` or `bearer`)
- `REPROMPT_API_BASE_URL` (only needed for split frontend/backend deployments)

## Operational Flags (runtime behavior)

- `AI_GATEWAY_URL` present => gateway routing is enabled.
- `AI_GATEWAY_URL` absent + `ANTHROPIC_API_KEY` present => direct Anthropic routing.
- `AI_GATEWAY_AUTH_MODE=bearer` => proxy sends `Authorization: Bearer <key>`.
- default auth mode => proxy sends `x-api-key: <key>`.
