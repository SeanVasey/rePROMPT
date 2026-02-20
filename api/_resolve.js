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
 * When a gateway is configured the request is forwarded to
 *   <AI_GATEWAY_URL>/messages
 * and authenticated with AI_GATEWAY_API_KEY (or ANTHROPIC_API_KEY as fallback).
 */
function resolveEndpoint() {
    const gatewayUrl = (process.env.AI_GATEWAY_URL || '').replace(/\/+$/, '');
    const gatewayKey = process.env.AI_GATEWAY_API_KEY || '';
    const anthropicKey = process.env.ANTHROPIC_API_KEY || '';

    if (gatewayUrl) {
        return {
            url: `${gatewayUrl}/messages`,
            apiKey: gatewayKey || anthropicKey,
            mode: 'gateway',
        };
    }

    if (anthropicKey) {
        return {
            url: 'https://api.anthropic.com/v1/messages',
            apiKey: anthropicKey,
            mode: 'direct',
        };
    }

    return { url: null, apiKey: null, mode: 'unconfigured' };
}

module.exports = { resolveEndpoint };
