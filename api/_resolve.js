/* =========================================
   rePROMPT — VASEY/AI
   Shared helper: resolve AI endpoint config
   ========================================= */

'use strict';

/**
 * Resolves the target URL and API key for outbound Anthropic API calls.
 *
 * Priority:
 *   1. AI_GATEWAY_URL  — custom gateway / Vercel AI Gateway
 *   2. ANTHROPIC_API_KEY — direct Anthropic API
 *
 * Gateway controls:
 *   - AI_GATEWAY_URL: base URL or full messages endpoint.
 *   - AI_GATEWAY_MESSAGES_PATH: optional path appended to AI_GATEWAY_URL when needed.
 *   - AI_GATEWAY_AUTH_MODE: "x-api-key" (default) or "bearer".
 *   - AI_GATEWAY_API_KEY: explicit gateway credential (falls back to ANTHROPIC_API_KEY).
 */
function resolveEndpoint() {
    const gatewayUrlRaw = process.env.AI_GATEWAY_URL || '';
    const gatewayPathRaw = process.env.AI_GATEWAY_MESSAGES_PATH || '/messages';
    const gatewayKey = process.env.AI_GATEWAY_API_KEY || '';
    const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
    const authModeRaw = (process.env.AI_GATEWAY_AUTH_MODE || 'x-api-key').toLowerCase().trim();
    const authMode = authModeRaw === 'bearer' ? 'bearer' : 'x-api-key';

    const gatewayUrl = gatewayUrlRaw.trim().replace(/\/+$/, '');
    const gatewayPath = gatewayPathRaw.trim() || '/messages';

    if (gatewayUrl) {
        const normalizedPath = gatewayPath.startsWith('/') ? gatewayPath : `/${gatewayPath}`;
        const hasMessagesLikePath = /\/messages(?:\?|$)/.test(gatewayUrl);
        const url = hasMessagesLikePath ? gatewayUrl : `${gatewayUrl}${normalizedPath}`;

        return {
            url,
            apiKey: gatewayKey || anthropicKey,
            mode: 'gateway',
            authMode,
        };
    }

    if (anthropicKey) {
        return {
            url: 'https://api.anthropic.com/v1/messages',
            apiKey: anthropicKey,
            mode: 'direct',
            authMode: 'x-api-key',
        };
    }

    return { url: null, apiKey: null, mode: 'unconfigured', authMode: 'x-api-key' };
}

module.exports = { resolveEndpoint };
