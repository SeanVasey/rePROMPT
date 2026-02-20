# Security Policy

## Supported Versions

Security fixes are applied to the latest `main` branch.

## Reporting a Vulnerability

Please **do not open public issues for security reports**.

1. Email: `security@vasey.ai`
2. Include reproduction steps, impact, and suggested remediation if known.
3. You will receive an acknowledgement within 72 hours.

## Secret Management

- `ANTHROPIC_API_KEY` must be set as a server-side environment variable.
- For gateway mode, configure `AI_GATEWAY_URL` and optionally `AI_GATEWAY_API_KEY`, `AI_GATEWAY_MESSAGES_PATH`, and `AI_GATEWAY_AUTH_MODE`.
- Never commit `.env` files or raw keys (`sk-ant-...`) to the repository.
- For GitHub Pages deployment, configure `REPROMPT_API_BASE_URL` as a repository variable (non-secret), pointing to your backend URL.
- For backend hosting providers, set `ANTHROPIC_API_KEY` using that provider's secret manager.
- For GitHub-driven Vercel deployments, keep `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` in GitHub Secrets only.

## Hardening Notes

- Frontend calls backend endpoints only; no API key is used in browser code.
- CI scans tracked files for Anthropic key-like patterns.
- Backend validates required fields and clamps token limits.
